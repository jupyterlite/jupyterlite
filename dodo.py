import json
import os
import platform
import re
import shutil
import subprocess
import sys
import tempfile
from hashlib import sha256
from pathlib import Path

import doit
import pkginfo


def which(cmd):
    """find a command, maybe with a weird windows extension"""
    return str(
        Path(
            shutil.which(cmd)
            or shutil.which(f"{cmd}.exe")
            or shutil.which(f"{cmd}.cmd")
            or shutil.which(f"{cmd}.bat")
        ).resolve()
    )


def task_env():
    """keep environments in sync"""

    yield dict(
        name="binder",
        doc="update binder environment with docs environment",
        file_dep=[P.DOCS_ENV, B.YARN_INTEGRITY],
        targets=[P.BINDER_ENV],
        actions=[
            (U.sync_env, [P.DOCS_ENV, P.BINDER_ENV, C.DOCS_ENV_MARKER]),
            *([U.do(*C.PRETTIER, P.BINDER_ENV)] if not C.DOCS_IN_CI else []),
        ],
    )

    if C.IN_CONDA:
        all_deps = []

        yield dict(
            name="pyodide:repodata",
            doc="fetch the pyodide repodata.json",
            file_dep=[P.APP_SCHEMA],
            targets=[B.PYODIDE_REPODATA],
            actions=[U.fetch_pyodide_repodata],
        )

        for nb in P.ALL_EXAMPLES:
            if not nb.name.endswith(".ipynb") or nb in B.SKIP_DEPFINDER:
                continue
            nb_deps = B.EXAMPLE_DEPS / f"{nb.name}.yml"
            yield dict(
                name=f"lite:deps:{nb.name}",
                doc="find dependencies for pyolite notebooks",
                file_dep=[nb],
                targets=[nb_deps],
                actions=[
                    (doit.tools.create_folder, [B.EXAMPLE_DEPS]),
                    (U.get_deps, [nb, nb_deps]),
                ],
            )

            all_deps += [nb_deps]

        yield dict(
            name="lite:extensions",
            doc="update jupyter-lite.json from the conda env",
            file_dep=[P.BINDER_ENV, B.PYODIDE_REPODATA, *all_deps],
            targets=[B.RAW_WHEELS_REQS],
            actions=[
                (
                    U.sync_lite_config,
                    [
                        P.BINDER_ENV,
                        P.EXAMPLE_LITE_BUILD_CONFIG,
                        C.FED_EXT_MARKER,
                        [C.P5_WHL_URL],
                        all_deps,
                    ],
                ),
                U.do(*C.PRETTIER, P.EXAMPLE_LITE_BUILD_CONFIG),
            ],
        )


def task_setup():
    """perform initial non-python setup"""
    if C.TESTING_IN_CI:
        return

    args = [
        "yarn",
        "--prefer-offline",
        "--ignore-optional",
        "--registry",
        C.YARN_REGISTRY,
    ]
    file_dep = [
        *P.APP_JSONS,
        *P.PACKAGE_JSONS.values(),
        P.APP_PACKAGE_JSON,
        P.ROOT_PACKAGE_JSON,
    ]

    if P.YARN_LOCK.exists():
        file_dep += [P.YARN_LOCK]

    if C.CI or C.WIN_DEV_IN_CI:
        # .yarn-integrity will only exist on a full cache hit vs yarn.lock, saves 1min+
        if B.YARN_INTEGRITY.exists():
            return
        args += ["--frozen-lockfile"]

    actions = [U.do(*args)]

    if not (C.CI or C.RTD or C.BINDER):
        actions += [U.do("yarn", "deduplicate")]

    yield dict(
        name="js",
        doc="install node packages",
        file_dep=file_dep,
        actions=actions,
        targets=[B.YARN_INTEGRITY],
    )


def task_lint():
    """format and ensure style of code, docs, etc."""
    if C.RTD or C.BUILDING_IN_CI or C.DOCS_IN_CI:
        return

    yield U.ok(
        B.OK_LITE_VERSION,
        name="version:js:lite",
        doc="check jupyter-lite.json version vs package.json",
        file_dep=[P.APP_JUPYTERLITE_JSON, P.APP_PACKAGE_JSON],
        actions=[lambda: D.APP_VERSION in P.APP_JUPYTERLITE_JSON.read_text(**C.ENC)],
    )

    has_pyodide_js = [P.APP_SCHEMA, P.PYOLITE_EXT_TS]
    has_pyodide_bz2 = [P.DOCS_OFFLINE_MD]
    yield U.ok(
        B.OK_PYODIDE_VERSION,
        name="version:js:pyodide",
        doc="check pyodide version from devDependencies vs schema, ts, etc",
        file_dep=[P.PACKAGE_JSONS["pyolite-kernel"], *has_pyodide_js, *has_pyodide_bz2],
        actions=[
            *[(U.check_contains, [p, D.PYODIDE_CDN_URL]) for p in has_pyodide_js],
            *[(U.check_contains, [p, D.PYODIDE_URL]) for p in has_pyodide_bz2],
        ],
    )

    yield U.ok(
        B.OK_PRETTIER,
        name="prettier",
        doc="format .ts, .md, .json, etc. files with prettier",
        file_dep=[*L.ALL_PRETTIER, B.YARN_INTEGRITY],
        actions=[U.do("yarn", "prettier:check-src" if C.CI else "prettier:fix")],
    )

    if not C.SKIP_ESLINT:
        yield U.ok(
            B.OK_ESLINT,
            name="eslint",
            doc="format and verify .ts, .js files with eslint",
            file_dep=[B.OK_PRETTIER, *L.ALL_ESLINT],
            actions=[U.do("yarn", "eslint:check" if C.CI else "eslint:fix")],
        )

    yield U.ok(
        B.OK_BLACK,
        name="black",
        doc="format python files with black",
        file_dep=L.ALL_BLACK,
        actions=[
            U.do(*C.PYM, "isort", *L.ALL_BLACK),
            U.do(*C.PYM, "black", *(["--check"] if C.CI else []), *L.ALL_BLACK),
        ],
    )

    yield U.ok(
        B.OK_PYFLAKES,
        name="pyflakes",
        doc="ensure python code style with pyflakes",
        file_dep=[*L.ALL_BLACK, B.OK_BLACK],
        actions=[U.do(*C.PYM, "pyflakes", *L.ALL_BLACK)],
    )

    yield dict(
        name="schema:self",
        file_dep=[P.APP_SCHEMA],
        actions=[(U.validate, [P.APP_SCHEMA])],
    )

    yield dict(
        name="schema:piplite",
        file_dep=[P.PIPLITE_SCHEMA],
        actions=[(U.validate, [P.PIPLITE_SCHEMA])],
    )

    for config in D.APP_CONFIGS:
        if config.name.endswith(".ipynb"):
            validate_args = [
                P.APP_SCHEMA,
                None,
                json.loads(config.read_text(**C.ENC))["metadata"][C.IPYNB_METADATA],
            ]
        else:
            validate_args = [P.APP_SCHEMA, config]

        yield dict(
            name=f"schema:validate:{config.relative_to(P.ROOT)}",
            file_dep=[P.APP_SCHEMA, config],
            actions=[(U.validate, validate_args)],
        )

    if not C.CI:
        for ipynb in D.ALL_IPYNB:
            yield dict(
                name=f"ipynb:{ipynb.relative_to(P.ROOT)}",
                file_dep=[ipynb, B.YARN_INTEGRITY, P.PRETTIER_RC],
                actions=[
                    U.do("nbstripout", ipynb),
                    (U.notebook_lint, [ipynb]),
                    U.do(
                        "jupyter-nbconvert",
                        "--log-level=WARN",
                        "--to=notebook",
                        "--inplace",
                        "--output",
                        ipynb,
                        ipynb,
                    ),
                ],
            )


def task_build():
    """build code and intermediate packages"""
    if C.TESTING_IN_CI or C.DOCS_IN_CI:
        return

    if not (C.RTD or C.CI):
        yield dict(
            name="docs:favicon",
            doc="rebuild favicons from svg source, requires imagemagick",
            file_dep=[P.DOCS_ICON],
            targets=[P.LAB_FAVICON],
            actions=[["echo", "... `convert` not found, install imagemagick"]]
            if not shutil.which("convert")
            else [
                lambda: [
                    subprocess.call(
                        [
                            "convert",
                            "-verbose",
                            "-density",
                            "256x256",
                            "-background",
                            "transparent",
                            P.DOCS_ICON,
                            "-define",
                            "icon:auto-resize",
                            "-colors",
                            "256",
                            P.LAB_FAVICON,
                        ]
                    ),
                    None,
                ][-1]
            ],
        )

    yield dict(
        name="js:ui-components",
        doc="copy the icon and wordmark to the ui-components package",
        file_dep=[P.DOCS_ICON, P.DOCS_WORDMARK, B.YARN_INTEGRITY],
        targets=[P.LITE_ICON, P.LITE_WORDMARK],
        actions=[
            U.do(
                *C.SVGO,
                P.DOCS_ICON,
                P.DOCS_WORDMARK,
                "-o",
                P.LITE_ICON,
                P.LITE_WORDMARK,
            ),
        ],
    )

    yield dict(
        name="js:lib",
        doc="build .ts files into .js files",
        file_dep=[
            *L.ALL_ESLINT,
            *P.PACKAGE_JSONS.values(),
            B.PYOLITE_WHEEL_TS,
            B.YARN_INTEGRITY,
            P.ROOT_PACKAGE_JSON,
        ],
        actions=[
            U.do("yarn", "build:lib"),
        ],
        targets=[B.META_BUILDINFO],
    )

    js_wheels = []

    for py_pkg, version in P.PYOLITE_PACKAGES.items():
        if re.match("^\d", py_pkg.name):
            name = py_pkg.parent.name
        else:
            name = py_pkg.name

        wheel = py_pkg / f"dist/{name}-{version}-{C.NOARCH_WHL}"
        js_wheels += [wheel]
        yield dict(
            name=f"js:py:{name}:{version}",
            doc=f"build the {name} {version}python package for the browser with flit",
            file_dep=[*py_pkg.rglob("*.py"), py_pkg / "pyproject.toml"],
            actions=[(U.build_one_flit, [py_pkg])],
            # TODO: get version
            targets=[wheel],
        )

    # a temporary environment to reuse build logic for app, for now
    bs_env = dict(os.environ)
    bs_env["PYTHONPATH"] = str(P.MAIN_SRC)

    yield dict(
        name="js:piplite:wheels",
        file_dep=js_wheels,
        actions=[
            (doit.tools.create_folder, [B.PYOLITE_WHEELS]),
            (U.copy_wheels, [B.PYOLITE_WHEELS, js_wheels]),
            U.do(
                *C.PYM, "jupyterlite.app", "pip", "index", B.PYOLITE_WHEELS, env=bs_env
            ),
            (U.make_pyolite_wheel_js),
        ],
        targets=[B.PYOLITE_WHEEL_INDEX, B.PYOLITE_WHEEL_TS],
    )

    app_deps = [
        B.META_BUILDINFO,
        P.WEBPACK_CONFIG,
        P.LITE_ICON,
        P.LITE_WORDMARK,
        P.APP_PACKAGE_JSON,
        *[p for p in P.APP_HTMLS if p.name == "index.template.html"],
    ]

    all_app_targets = []
    extra_app_deps = []

    for app_json in P.APP_JSONS:
        app = app_json.parent
        app_build = app / "build"
        app_targets = [
            P.APP / app.name / "index.html",
            app_build / "index.js",
            app_build / "style.js",
        ]
        all_app_targets += app_targets
        extra_app_deps += [
            app / "index.template.js",
            app_json,
        ]

    yield dict(
        name="js:app",
        doc="build JupyterLite with webpack",
        file_dep=[
            *app_deps,
            *extra_app_deps,
            B.PYOLITE_WHEEL_INDEX,
            B.PYOLITE_WHEEL_TS,
        ],
        actions=[
            U.do("yarn", "lerna", "run", "build:prod", "--scope", "@jupyterlite/app")
        ],
        targets=[*all_app_targets],
    )

    yield dict(
        name="js:pack",
        doc="build the JupyterLite distribution",
        file_dep=[
            *all_app_targets,
            *P.APP.glob("*.js"),
            *P.APP.glob("*.json"),
            *P.APP.rglob("*.ipynb"),
            *P.APP.glob("*/*/index.html"),
            *P.APP.glob("*/build/schemas/**/.json"),
            B.PYOLITE_WHEEL_INDEX,
            B.META_BUILDINFO,
            P.APP / "index.html",
            P.APP_NPM_IGNORE,
            P.APP_SCHEMA,
        ],
        actions=[
            (doit.tools.create_folder, [B.DIST]),
            U.do("npm", "pack", "../app", cwd=B.DIST),
        ],
        targets=[B.APP_PACK],
    )

    yield dict(
        name=f"py:{C.NAME}:pre:readme",
        file_dep=[P.README],
        targets=[P.PY_README],
        actions=[(U.copy_one, [P.README, P.PY_README])],
    )

    yield dict(
        name=f"py:{C.NAME}:pre:app",
        file_dep=[B.APP_PACK],
        targets=[B.PY_APP_PACK],
        actions=[
            (U.copy_one, [B.APP_PACK, B.PY_APP_PACK]),
        ],
    )

    for py_name, setup_py in P.PY_SETUP_PY.items():
        py_pkg = setup_py.parent
        wheel = (
            py_pkg
            / f"""dist/{py_name.replace("-", "_")}-{D.PY_VERSION}-{C.NOARCH_WHL}"""
        )
        sdist = py_pkg / f"""dist/{py_name.replace("_", "-")}-{D.PY_VERSION}.tar.gz"""

        actions = [U.do("python", "setup.py", "sdist", "bdist_wheel", cwd=py_pkg)]

        file_dep = [
            *P.PY_SETUP_DEPS[py_name](),
            *py_pkg.rglob("src/*.py"),
            *py_pkg.glob("*.md"),
            setup_py,
        ]

        pyproj_toml = py_pkg / "pyproject.toml"

        targets = [wheel, sdist]

        # we might tweak the args
        if pyproj_toml.exists() and "flit_core" in pyproj_toml.read_text(**C.ENC):
            actions = [(U.build_one_flit, [py_pkg])]
            file_dep += [pyproj_toml]

        yield dict(
            name=f"py:{py_name}",
            doc=f"build the {py_name} python package",
            file_dep=file_dep,
            actions=actions,
            targets=targets,
        )


def task_dist():
    """fix up the state of the distribution directory"""
    if C.TESTING_IN_CI or C.DOCS_IN_CI or C.LINTING_IN_CI:
        return

    py_dests = []
    for dist in B.PY_DISTRIBUTIONS:
        dest = B.DIST / dist.name
        py_dests += [dest]
        yield dict(
            name=f"copy:py:{dist.name}",
            actions=[(U.copy_one, [dist, dest])],
            file_dep=[dist],
            targets=[dest],
        )

    yield dict(
        name="hash",
        file_dep=py_dests,
        actions=[(U.hashfile, [B.DIST])],
        targets=[B.DIST / "SHA256SUMS"],
    )

    for dist in B.PY_DISTRIBUTIONS:
        if dist.name.endswith(".tar.gz"):
            # apparently flit sdists are malformed according to `twine check`
            continue
        yield dict(
            name=f"twine:{dist.name}",
            doc=f"use twine to validate {dist.name}",
            file_dep=[dist],
            actions=[["twine", "check", dist]],
        )


def task_dev():
    """setup up local packages for interactive development"""
    if C.TESTING_IN_CI or C.DOCS_IN_CI or C.LINTING_IN_CI:
        cwd = P.ROOT
        file_dep = [
            B.DIST / f"""{C.NAME.replace("-", "_")}-{D.PY_VERSION}-{C.NOARCH_WHL}"""
        ]
        args = [
            *C.PYM,
            "pip",
            "install",
            "-vv",
            "--no-index",
            "--find-links",
            B.DIST,
            C.NAME,
        ]
    else:
        cwd = P.PY_SETUP_PY[C.NAME].parent
        file_dep = [cwd / "src" / C.NAME / B.APP_PACK.name]
        args = [*C.FLIT, "install", "--pth-file", "--deps=none"]

    yield dict(
        name=f"py:{C.NAME}",
        actions=[U.do(*args, cwd=cwd)],
        file_dep=file_dep,
    )


def task_docs():
    """build documentation"""
    if C.TESTING_IN_CI or C.BUILDING_IN_CI:
        return

    if not C.DOCS_IN_CI:
        yield dict(
            name="typedoc:ensure",
            file_dep=[*P.PACKAGE_JSONS.values(), B.YARN_INTEGRITY],
            actions=[
                U.typedoc_conf,
                U.do(*C.PRETTIER, *P.TYPEDOC_CONF),
            ],
            targets=[P.TYPEDOC_JSON, P.TSCONFIG_TYPEDOC],
        )
        yield dict(
            name="typedoc:build",
            doc="build the TS API documentation with typedoc",
            file_dep=[B.META_BUILDINFO, *P.TYPEDOC_CONF],
            actions=[U.do("yarn", "docs")],
            targets=[B.DOCS_RAW_TYPEDOC_README],
        )

        yield dict(
            name="typedoc:mystify",
            doc="transform raw typedoc into myst markdown",
            file_dep=[B.DOCS_RAW_TYPEDOC_README],
            targets=[B.DOCS_TS_MYST_INDEX, *B.DOCS_TS_MODULES],
            actions=[
                U.mystify,
                U.do(*C.PRETTIER, B.DOCS_TS),
            ],
        )

    app_build_deps = [
        *([] if C.CI else [B.PY_APP_PACK]),
        *P.ALL_EXAMPLES,
        # NOTE: these won't always trigger a rebuild because of the inner dodo
        *P.PY_SETUP_PY[C.NAME].rglob("*.py"),
    ]

    # in CI, assume the config, wheels, etc. all agree
    if not (C.DOCS_IN_CI or C.RTD):
        app_build_deps += [B.RAW_WHEELS_REQS]

    docs_app_targets = [B.DOCS_APP_WHEEL_INDEX, B.DOCS_APP_JS_BUNDLE]

    uptodate = []

    if C.FORCE_PYODIDE:
        docs_app_targets += [B.DOCS_APP_PYODIDE_JS]
        uptodate = [doit.tools.config_changed(dict(pyodide_url=D.PYODIDE_URL))]

    yield U.ok(
        B.OK_DOCS_APP,
        name="app:build",
        doc="use the jupyterlite CLI to (pre-)build the docs app",
        task_dep=[f"dev:py:{C.NAME}"],
        uptodate=uptodate,
        actions=[(U.docs_app, [])],
        file_dep=app_build_deps,
        targets=docs_app_targets,
    )

    yield dict(
        name="app:pack",
        doc="build the as-deployed app archive",
        uptodate=uptodate,
        file_dep=[B.OK_DOCS_APP],
        actions=[(U.docs_app, ["archive"])],
        targets=[B.DOCS_APP_ARCHIVE, B.DOCS_APP_SHA256SUMS],
    )

    yield dict(
        name="sphinx",
        doc="build the documentation site with sphinx",
        file_dep=[
            *P.DOCS_MD,
            *P.DOCS_PY,
            *P.DOCS_IPYNB,
            B.DOCS_APP_ARCHIVE,
            B.DOCS_TS_MYST_INDEX,
        ],
        actions=[U.do("sphinx-build", *C.SPHINX_ARGS, "-b", "html", P.DOCS, B.DOCS)],
        targets=[B.DOCS_BUILDINFO, B.DOCS_STATIC_APP, *BB.ALL_DOCS_HTML],
    )

    if C.IN_SPHINX:

        def _clean_dupe_ids():
            all_schema_html = sorted(B.DOCS.glob("schema-v*.html"))

            for schema_html in all_schema_html:
                print(f"... fixing: {schema_html.relative_to(B.DOCS)}")
                text = schema_html.read_text(encoding="utf-8")
                new_text = re.sub(r'<span id="([^"]*)"></span>', "", text)
                if text != new_text:
                    schema_html.write_text(new_text, encoding="utf-8")

        yield dict(
            name="post:schema",
            doc="clean sphinx-jsonschema duplicate ids",
            actions=[_clean_dupe_ids],
        )

        def _skip_image(path):
            as_posix = str(path.as_posix())
            return (
                "_static/extensions" in as_posix
                or "_static/build" in as_posix
                or "_static/vendor" in as_posix
            )

        def _optimize_images():
            all_svg = [p for p in B.DOCS.rglob("*.svg") if not _skip_image(p)]

            subprocess.check_call(
                [*C.SVGO, *all_svg, "-o", *all_svg],
                cwd=str(P.ROOT),
            )

        yield dict(
            name="post:images",
            doc="clean sphinx-jsonschema duplicate ids",
            actions=[_optimize_images],
            file_dep=[B.YARN_INTEGRITY],
        )


def task_serve():
    """run various development servers"""

    yield dict(
        name="docs:app",
        doc="serve the as-built example site with `jupyter lite serve`",
        uptodate=[lambda: False],
        actions=[(U.docs_app, ["serve"])],
        file_dep=[B.DOCS_APP_WHEEL_INDEX, B.DOCS_APP_JS_BUNDLE],
        task_dep=["dev"],
    )

    app_indexes = [P.APP / app / "index.html" for app in D.APPS]

    yield dict(
        name="core:js",
        doc="serve the core app (no extensions) with nodejs",
        uptodate=[lambda: False],
        actions=[U.do("yarn", "serve")],
        file_dep=app_indexes,
    )

    yield dict(
        name="core:py",
        doc="serve the core app (no extensions) with python",
        uptodate=[lambda: False],
        actions=[U.do("yarn", "serve:py")],
        file_dep=app_indexes,
    )

    def _lab():
        args = [which("jupyter-lab"), *C.LAB_ARGS]
        proc = subprocess.Popen(list(map(str, args)), stdin=subprocess.PIPE)

        try:
            proc.wait()
        except KeyboardInterrupt:
            proc.terminate()
            proc.communicate(b"y\n")

        proc.wait()

    yield dict(
        name="lab",
        doc="start jupyterlab",
        uptodate=[lambda: False],
        actions=[_lab],
        task_dep=["dev"],
    )


@doit.create_after("docs")
def task_check():
    """perform checks of built artifacts"""
    yield dict(
        name="docs:links",
        doc="check for broken (internal) links",
        file_dep=[*BB.ALL_DOCS_HTML],
        actions=[
            U.do(
                "pytest-check-links",
                B.DOCS,
                "-n",
                "auto",
                "-p",
                "no:warnings",
                "--links-ext",
                "html",
                "--check-anchors",
                "--check-links-ignore",
                "^https?://",
            )
        ],
    )

    if not C.DOCS_IN_CI:
        yield dict(
            name=f"schema:validate:{B.PYOLITE_WHEEL_INDEX.relative_to(P.ROOT)}",
            file_dep=[P.PIPLITE_SCHEMA, B.PYOLITE_WHEEL_INDEX],
            actions=[(U.validate, (P.PIPLITE_SCHEMA, B.PYOLITE_WHEEL_INDEX))],
        )

    yield dict(
        name="app",
        doc="use the jupyterlite CLI to check the docs app",
        task_dep=[f"dev:py:{C.NAME}"],
        actions=[(U.docs_app, ["check"])],
        file_dep=[
            B.DOCS_APP_SHA256SUMS,
            # NOTE: these won't always trigger a rebuild because of the inner dodo
            *P.PY_SETUP_PY[C.NAME].rglob("*.py"),
        ],
    )

    for example in P.ALL_EXAMPLES:
        if example.name.endswith(".ipynb"):
            yield from U.check_one_ipynb(example)


def task_watch():
    """watch sources and rebuild on change"""
    yield dict(
        name="js",
        doc="watch .ts, .js, and .css sources and rebuild packages and apps",
        uptodate=[lambda: False],
        file_dep=[B.YARN_INTEGRITY],
        actions=[U.do("yarn", "watch")],
    )
    if shutil.which("sphinx-autobuild"):
        yield dict(
            name="docs",
            doc="watch .md sources and rebuild the documentation",
            uptodate=[lambda: False],
            file_dep=[*P.DOCS_MD, *P.DOCS_PY, B.APP_PACK],
            actions=[
                U.do(
                    "sphinx-autobuild",
                    *(C.SPHINX_ARGS or ["-a", "-j8"]),
                    P.DOCS,
                    B.DOCS,
                )
            ],
        )


def task_test():
    """test jupyterlite"""
    if C.BUILDING_IN_CI:
        return

    yield U.ok(
        B.OK_JEST,
        name="js",
        doc="run the .js, .ts unit tests with jest",
        file_dep=[B.YARN_INTEGRITY, B.META_BUILDINFO],
        actions=[U.do("yarn", "build:test"), U.do("yarn", "test")],
    )

    if C.LINTING_IN_CI:
        return

    env = dict(os.environ)

    if D.PYODIDE_ARCHIVE_CACHE.exists():
        # this makes some tests e.g. archive _very_ slow
        env["TEST_JUPYTERLITE_PYODIDE_URL"] = str(D.PYODIDE_ARCHIVE_CACHE)

    pytest_args = [
        *C.PYM,
        "pytest",
        "--ff",
        "--script-launch-mode=subprocess",
        f"-n={C.PYTEST_PROCS}",
        "-vv",
        "--durations=5",
        *(C.PYTEST_ARGS or []),
    ]

    for py_name, setup_py in P.PY_SETUP_PY.items():
        if py_name != C.NAME:
            # TODO: we'll get there
            continue

        py_mod = py_name.replace("-", "_")
        html_index = B.BUILD / f"pytest/{py_name}/index.html"
        pkg_targets = [html_index]
        pkg_args = [
            f"--html={html_index}",
            "--self-contained-html",
        ]
        cwd = setup_py.parent

        if C.CI:
            cwd = B.DIST
            pkg_args += ["--pyargs", py_mod]

        if not C.PYPY:
            # coverage is very slow/finicky on pypy
            cov_path = B.BUILD / f"htmlcov/{py_name}"
            pkg_args += [
                "--cov-report=term-missing:skip-covered",
                "--no-cov-on-fail",
                f"--cov-fail-under={C.COV_THRESHOLD}",
                f"--cov-report=html:{cov_path}",
                f"--cov={py_mod}",
            ]
            pkg_targets += [cov_path / "index.html"]

        yield U.ok(
            B.OK_LITE_PYTEST,
            name=f"py:{py_name}",
            doc=f"run pytest for {py_name}",
            task_dep=[f"dev:py:{py_name}"],
            file_dep=[
                *setup_py.parent.rglob("*.py"),
                setup_py.parent / "pyproject.toml",
            ],
            targets=pkg_targets,
            actions=[U.do(*pytest_args, *pkg_args, env=env, cwd=cwd)],
        )


def task_repo():
    pkg_jsons = [P.ROOT / "app" / app / "package.json" for app in D.APPS]
    yield dict(
        name="integrity",
        doc="ensure app yarn resolutions are up-to-date",
        actions=[U.integrity, U.do(*C.PRETTIER, *pkg_jsons)],
        file_dep=[B.YARN_INTEGRITY, *pkg_jsons],
    )


class C:
    NAME = "jupyterlite"
    NOARCH_WHL = "py3-none-any.whl"
    ENC = dict(encoding="utf-8")
    JSON = dict(indent=2, sort_keys=True)
    PY_IMPL = platform.python_implementation()
    WIN = platform.system() == "Windows"
    PYPY = "pypy" in PY_IMPL.lower()
    # env vars
    CI = bool(json.loads(os.environ.get("CI", "0")))
    BINDER = bool(json.loads(os.environ.get("BINDER", "0")))
    RTD = bool(json.loads(os.environ.get("READTHEDOCS", "False").lower()))
    IN_CONDA = bool(os.environ.get("CONDA_PREFIX"))
    IN_SPHINX = json.loads(os.environ.get("IN_SPHINX", "0"))
    PYTEST_ARGS = json.loads(os.environ.get("PYTEST_ARGS", "[]"))
    PYTEST_PROCS = json.loads(os.environ.get("PYTEST_PROCS", "4"))
    LITE_ARGS = json.loads(os.environ.get("LITE_ARGS", "[]"))
    LAB_ARGS = json.loads(
        os.environ.get(
            "LAB_ARGS", """["--no-browser","--debug","--expose-app-in-browser"]"""
        )
    )
    SPHINX_ARGS = json.loads(os.environ.get("SPHINX_ARGS", "[]"))

    DOCS_ENV_MARKER = "### DOCS ENV ###"
    FED_EXT_MARKER = "### FEDERATED EXTENSIONS ###"
    RE_CONDA_FORGE_URL = r"/conda-forge/(.*/)?(noarch|linux-64|win-64|osx-64)/([^/]+)$"
    YARN_REGISTRY = "https://registry.npmjs.org/"
    GH = "https://github.com"
    CONDA_FORGE_RELEASE = "https://conda.anaconda.org/conda-forge"
    LITE_GH_ORG = f"{GH}/{NAME}"
    P5_GH_REPO = f"{LITE_GH_ORG}/p5-kernel"
    P5_MOD = "jupyterlite_p5_kernel"
    P5_VERSION = "0.1.0a12"
    P5_RELEASE = f"{P5_GH_REPO}/releases/download/v{P5_VERSION}"
    P5_WHL_URL = f"{P5_RELEASE}/{P5_MOD}-{P5_VERSION}-{NOARCH_WHL}"
    PYTHON_HOSTED = "https://files.pythonhosted.org/packages"
    PYPI = "https://pypi.org"
    PYPI_API = f"{PYPI}/pypi"
    PYPI_SRC = f"{PYPI}/packages/source"
    PYODIDE_GH = f"{GH}/pyodide/pyodide"
    PYODIDE_DOWNLOAD = f"{PYODIDE_GH}/releases/download"

    JUPYTERLITE_JSON = "jupyter-lite.json"
    JUPYTERLITE_IPYNB = "jupyter-lite.ipynb"
    IPYNB_METADATA = "jupyter-lite"
    LITE_CONFIG_FILES = [JUPYTERLITE_JSON, JUPYTERLITE_IPYNB]
    NO_TYPEDOC = ["_metapackage"]
    IGNORED_WHEEL_DEPS = [
        # our stuff
        "pyolite",
        "piplite",
        # magic JS interop layer
        "js",
        "pyodide_js",
        "pyodide",
        # broken?
        "pathspec",
    ]
    IGNORED_WHEELS = ["widgetsnbextension", "ipykernel", "pyolite"]
    REQUIRED_WHEEL_DEPS = ["ipykernel", "notebook", "ipywidgets>=8"]

    BUILDING_IN_CI = json.loads(os.environ.get("BUILDING_IN_CI", "0"))
    DOCS_IN_CI = json.loads(os.environ.get("DOCS_IN_CI", "0"))
    LINTING_IN_CI = json.loads(os.environ.get("LINTING_IN_CI", "0"))
    TESTING_IN_CI = json.loads(os.environ.get("TESTING_IN_CI", "0"))
    WIN_DEV_IN_CI = json.loads(os.environ.get("WIN_DEV_IN_CI", "0"))
    FORCE_PYODIDE = "JUPYTERLITE_PYODIDE_URL" in os.environ or bool(
        json.loads(os.environ.get("FORCE_PYODIDE", "0"))
    )
    PYM = [sys.executable, "-m"]
    FLIT = [*PYM, "flit"]
    SOURCE_DATE_EPOCH = (
        subprocess.check_output([which("git"), "log", "-1", "--format=%ct"])
        .decode("utf-8")
        .strip()
    )
    SVGO = ["yarn", "svgo", "--multipass", "--pretty", "--indent=2", "--final-newline"]
    PRETTIER = ["yarn", "prettier", "--write"]
    PRETTIER_IGNORE = [
        "_pypi.ts",
        ".ipynb_checkpoints",
        "node_modules",
    ]
    MIME_IPYTHON = "text/x-python"

    # coverage varies based on excursions
    COV_THRESHOLD = 92 if FORCE_PYODIDE else 86
    SKIP_LINT = [
        "/docs/_build/",
        "/.ipynb_checkpoints/",
        "/jupyter_execute/",
        "/_static/",
    ]
    NOT_SKIP_LINT = lambda p: not re.findall("|".join(C.SKIP_LINT), str(p.as_posix()))
    SKIP_ESLINT = json.loads(os.environ.get("SKIP_ESLINT", "0"))


class P:
    DODO = Path(__file__)
    ROOT = DODO.parent
    PACKAGES = ROOT / "packages"
    PACKAGE_JSONS = {p.parent.name: p for p in PACKAGES.glob("*/package.json")}
    UI_COMPONENTS = PACKAGES / "ui-components"
    UI_COMPONENTS_ICONS = UI_COMPONENTS / "style" / "icons"
    ROOT_PACKAGE_JSON = ROOT / "package.json"
    YARN_LOCK = ROOT / "yarn.lock"

    ENV_EXTENSIONS = Path(sys.prefix) / "share/jupyter/labextensions"

    EXAMPLES = ROOT / "examples"
    ALL_EXAMPLES = [
        p
        for p in EXAMPLES.rglob("*")
        if not p.is_dir() and ".cache" not in str(p) and ".doit" not in str(p)
    ]

    # set later
    PYOLITE_PACKAGES = {}

    APP = ROOT / "app"
    APP_JUPYTERLITE_JSON = APP / C.JUPYTERLITE_JSON
    APP_JUPYTERLITE_IPYNB = APP / C.JUPYTERLITE_IPYNB
    APP_PACKAGE_JSON = APP / "package.json"
    APP_SCHEMA = APP / "jupyterlite.schema.v0.json"
    PIPLITE_SCHEMA = APP / "piplite.schema.v0.json"
    APP_HTMLS = [
        APP / "index.html",
        *APP.rglob("*/index.template.html"),
        *[
            p
            for p in APP.rglob("*/index.html")
            if not (p.parent / "index.template.html").exists()
        ],
    ]

    WEBPACK_CONFIG = APP / "webpack.config.js"
    APP_JSONS = sorted(APP.glob("*/package.json"))
    APP_EXTRA_JSON = sorted(APP.glob("*/*.json"))
    APP_NPM_IGNORE = APP / ".npmignore"
    LAB_FAVICON = APP / "lab/favicon.ico"
    LITE_ICON = UI_COMPONENTS_ICONS / "liteIcon.svg"
    LITE_WORDMARK = UI_COMPONENTS_ICONS / "liteWordmark.svg"

    # "real" py packages have a `setup.py`, even if handled by `.toml` or `.cfg`
    PY_SETUP_PY = {p.parent.name: p for p in (ROOT / "py").glob("*/setup.py")}
    PY_SETUP_DEPS = {
        C.NAME: lambda: [B.PY_APP_PACK],
    }
    MAIN_SRC = ROOT / "py" / C.NAME / "src"

    # docs
    README = ROOT / "README.md"
    PY_README = ROOT / f"py/{C.NAME}/README.md"
    CONTRIBUTING = ROOT / "CONTRIBUTING.md"
    CHANGELOG = ROOT / "CHANGELOG.md"
    DOCS = ROOT / "docs"
    DOCS_OFFLINE_MD = DOCS / "howto/configure/advanced/offline.md"
    DOCS_ICON = DOCS / "_static/icon.svg"
    DOCS_WORDMARK = DOCS / "_static/wordmark.svg"
    EXAMPLE_OVERRIDES = EXAMPLES / "overrides.json"
    EXAMPLE_JUPYTERLITE_JSON = EXAMPLES / C.JUPYTERLITE_JSON
    EXAMPLE_LITE_BUILD_CONFIG = EXAMPLES / "jupyter_lite_config.json"
    TSCONFIG_TYPEDOC = ROOT / "tsconfig.typedoc.json"
    TYPEDOC_JSON = ROOT / "typedoc.json"
    TYPEDOC_CONF = [TSCONFIG_TYPEDOC, TYPEDOC_JSON]
    DOCS_SRC_MD = sorted(
        [
            p
            for p in DOCS.rglob("*.md")
            if "docs/reference/api/ts" not in str(p.as_posix())
        ]
    )
    DOCS_ENV = DOCS / "environment.yml"
    DOCS_PY = sorted([p for p in DOCS.rglob("*.py") if "jupyter_execute" not in str(p)])
    DOCS_MD = sorted([*DOCS_SRC_MD, README, CONTRIBUTING, CHANGELOG])
    DOCS_IPYNB = filter(
        lambda p: not re.match("|".join(C.SKIP_LINT), str(p.as_posix())),
        DOCS.rglob("*.ipynb"),
    )

    # pyolite
    PYOLITE_TS = PACKAGES / "pyolite-kernel"
    PYOLITE_EXT = PACKAGES / "pyolite-kernel-extension"
    PYOLITE_EXT_TS = PYOLITE_EXT / "src/index.ts"

    # demo
    BINDER = ROOT / ".binder"
    BINDER_ENV = BINDER / "environment.yml"

    # CI
    CI = ROOT / ".github"

    # lint
    PRETTIER_RC = ROOT / ".prettierrc"


def _js_version_to_py_version(js_version):
    return (
        js_version.replace("-alpha.", "a").replace("-beta.", "b").replace("-rc.", "rc")
    )


class D:
    # data
    APP = json.loads(P.APP_PACKAGE_JSON.read_text(**C.ENC))
    APP_VERSION = APP["version"]
    APPS = APP["jupyterlite"]["apps"]
    APP_SCHEMA = json.loads(P.APP_SCHEMA.read_text(**C.ENC))
    APP_SCHEMA_DEFS = APP_SCHEMA["definitions"]
    APP_SCHEMA_PYOLITE = APP_SCHEMA_DEFS["pyolite-settings"]

    # derive the PEP-compatible version
    PY_VERSION = _js_version_to_py_version(APP["version"])

    PACKAGE_JSONS = {
        parent: json.loads(p.read_text(**C.ENC))
        for parent, p in P.PACKAGE_JSONS.items()
    }
    PYODIDE_JS_VERSION = PACKAGE_JSONS["pyolite-kernel"]["devDependencies"]["pyodide"]
    PYODIDE_CDN_URL = APP_SCHEMA_PYOLITE["properties"]["pyodideUrl"]["default"]
    PYODIDE_VERSION = _js_version_to_py_version(PYODIDE_JS_VERSION)
    PYODIDE_JS = PYODIDE_CDN_URL.split("/")[-1]
    PYODIDE_ARCHIVE = f"pyodide-{PYODIDE_VERSION}.tar.bz2"
    PYODIDE_URL = os.environ.get(
        "JUPYTERLITE_PYODIDE_URL",
        f"{C.PYODIDE_DOWNLOAD}/{PYODIDE_VERSION}/{PYODIDE_ARCHIVE}",
    )
    PYODIDE_ARCHIVE_CACHE = P.EXAMPLES / ".cache/pyodide" / PYODIDE_ARCHIVE

    APP_CONFIGS = [
        p
        for fname in C.LITE_CONFIG_FILES
        for p in [
            *P.APP.glob(fname),
            *P.APP.glob(f"*/{fname}"),
            *P.APP.glob(f"*/*/{fname}"),
        ]
        if p.exists()
    ]

    ALL_IPYNB = filter(
        C.NOT_SKIP_LINT,
        [*P.DOCS_IPYNB, *[p for p in P.ALL_EXAMPLES if p.name.endswith(".ipynb")]],
    )


P.PYOLITE_PACKAGES = {
    P.PACKAGES / js_pkg / pyp_path: pyp_version
    for js_pkg, pkg_data in D.PACKAGE_JSONS.items()
    for pyp_path, pyp_version in pkg_data.get("pyolite", {}).get("packages", {}).items()
}


def _clean_paths(*paths_or_globs):
    final_paths = []
    for pg in paths_or_globs:
        if pg is None:
            continue
        elif isinstance(pg, Path):
            paths = [pg]
        else:
            paths = set(pg)
        for path in paths:
            if any(p in str(path) for p in C.PRETTIER_IGNORE):
                continue
            final_paths += [path]
    return sorted(set(final_paths))


class L:
    # linting
    ALL_ESLINT = _clean_paths(
        P.PACKAGES.rglob("*/src/**/*.js"),
        P.PACKAGES.rglob("*/src/**/*.ts"),
    )
    ALL_JSON = _clean_paths(
        P.PACKAGE_JSONS.values(),
        P.APP_JSONS,
        P.APP_EXTRA_JSON,
        P.ROOT_PACKAGE_JSON,
        P.ROOT.glob("*.json"),
    )
    ALL_JS = _clean_paths(
        (P.ROOT / "scripts").glob("*.js"), P.APP.glob("*/index.template.js")
    )
    ALL_HTML = [*P.APP_HTMLS]
    ALL_MD = [*P.CI.rglob("*.md"), *P.DOCS_MD]
    ALL_YAML = _clean_paths(
        P.ROOT.glob("*.yml"), P.BINDER.glob("*.yml"), P.CI.rglob("*.yml")
    )
    ALL_PRETTIER = _clean_paths(ALL_JSON, ALL_MD, ALL_YAML, ALL_ESLINT, ALL_JS)
    ALL_BLACK = _clean_paths(
        *P.DOCS_PY,
        P.DODO,
        *(P.ROOT / "scripts").glob("*.py"),
        *sum([[*p.parent.rglob("*.py")] for p in P.PY_SETUP_PY.values()], []),
        *sum([[*p.rglob("*.py")] for p in P.PYOLITE_PACKAGES.keys()], []),
    )


class B:
    # built
    NODE_MODULES = P.ROOT / "node_modules"
    YARN_INTEGRITY = NODE_MODULES / ".yarn-integrity"
    META_BUILDINFO = P.PACKAGES / "_metapackage/tsconfig.tsbuildinfo"

    # built things
    BUILD = P.ROOT / "build"
    DIST = P.ROOT / "dist"
    APP_PACK = DIST / f"""{C.NAME}-app-{D.APP_VERSION}.tgz"""
    PYOLITE_WHEELS = P.PYOLITE_TS / "pypi"
    PYOLITE_WHEEL_INDEX = PYOLITE_WHEELS / "all.json"
    PYOLITE_WHEEL_TS = P.PYOLITE_TS / "src/_pypi.ts"
    PY_APP_PACK = P.ROOT / "py" / C.NAME / "src" / C.NAME / APP_PACK.name
    REQ_CACHE = BUILD / "requests-cache.sqlite"

    EXAMPLE_DEPS = BUILD / "depfinder"
    # does crazy imports
    SKIP_DEPFINDER = [P.EXAMPLES / "python-packages.ipynb"]

    PYODIDE_REPODATA = BUILD / "pyodide-repodata.json"
    RAW_WHEELS = BUILD / "wheels"
    RAW_WHEELS_REQS = RAW_WHEELS / "requirements.txt"
    DOCS_APP = BUILD / "docs-app"
    DOCS_APP_SHA256SUMS = DOCS_APP / "SHA256SUMS"
    DOCS_APP_ARCHIVE = DOCS_APP / f"""jupyterlite-docs-{D.APP_VERSION}.tgz"""
    DOCS_APP_WHEEL_INDEX = DOCS_APP / "pypi/all.json"
    DOCS_APP_JS_BUNDLE = DOCS_APP / "build/lab/bundle.js"
    DOCS_APP_PYODIDE_JS = DOCS_APP / f"static/pyodide/{D.PYODIDE_JS}"

    DOCS = Path(os.environ.get("JLITE_DOCS_OUT", P.DOCS / "_build"))
    DOCS_BUILDINFO = DOCS / ".buildinfo"
    DOCS_STATIC = DOCS / "_static"
    DOCS_STATIC_APP = DOCS_STATIC / DOCS_APP_ARCHIVE.name

    # typedoc
    DOCS_RAW_TYPEDOC = BUILD / "typedoc"
    DOCS_RAW_TYPEDOC_README = DOCS_RAW_TYPEDOC / "README.md"
    DOCS_TS = P.DOCS / "reference/api/ts"
    DOCS_TS_MYST_INDEX = DOCS_TS / "index.md"
    DOCS_TS_MYST_MODULES = DOCS_TS / "modules.md"
    DOCS_TS_MYST_INTERFACES = DOCS_TS / "interfaces.md"
    DOCS_TS_MYST_CLASSES = DOCS_TS / "classes.md"
    DOCS_TS_MODULES = [
        P.ROOT
        / f"docs/reference/api/ts/modules/jupyterlite_{parent.replace('-', '_')}.md"
        for parent in P.PACKAGE_JSONS
        if parent not in C.NO_TYPEDOC
    ]

    OK = BUILD / "ok"
    OK_DOCS_APP = OK / "docs-app"
    OK_BLACK = OK / "black"
    OK_ESLINT = OK / "eslint"
    OK_JEST = OK / "jest"
    OK_PRETTIER = OK / "prettier"
    OK_PYFLAKES = OK / "pyflakes"
    OK_LITE_PYTEST = OK / "jupyterlite.pytest"
    OK_LITE_VERSION = OK / "lite.version"
    OK_PYODIDE_VERSION = OK / "pyodide.version"
    PY_DISTRIBUTIONS = [
        *P.ROOT.glob("py/*/dist/*.whl"),
        *P.ROOT.glob("py/*/dist/*.tar.gz"),
    ]
    DIST_HASH_INPUTS = sorted([*PY_DISTRIBUTIONS, APP_PACK])


class BB:
    """Built from other built files"""

    # not exhaustive, because of per-class API pages
    ALL_DOCS_HTML = [
        (
            B.DOCS
            / src.parent.relative_to(P.DOCS)
            / (src.name.rsplit(".", 1)[0] + ".html")
        )
        for src in [*P.DOCS_MD, *P.DOCS_IPYNB, *B.DOCS_TS_MODULES]
        if P.DOCS in src.parents and C.NOT_SKIP_LINT(src)
    ]


class U:
    _SESSION = None

    def session():
        try:
            import requests_cache

            HAS_REQUESTS_CACHE = True
        except Exception as error:
            print(f"requests_cache not available: {error}")
            HAS_REQUESTS_CACHE = False

        if U._SESSION is None:
            if HAS_REQUESTS_CACHE:
                if not B.BUILD.exists():
                    B.BUILD.mkdir()

                U._SESSION = requests_cache.CachedSession(
                    str(B.BUILD / B.REQ_CACHE.stem),
                    allowable_methods=["GET", "POST", "HEAD"],
                    allowable_codes=[200, 302, 404],
                )
            else:
                import requests

                U._SESSION = requests.Session()
                print("Using uncached requests session, not recommended")

        return U._SESSION

    def do(*args, cwd=P.ROOT, **kwargs):
        """wrap a CmdAction for consistency (e.g. on windows)"""
        try:
            cmd = which(args[0])
        except Exception:
            print(args[0], "is not available (this might not be a problem)")
            return ["echo", f"{args[0]} not available"]
        return doit.action.CmdAction(
            [cmd, *args[1:]], shell=False, cwd=str(Path(cwd)), **kwargs
        )

    def ok(ok, **task):
        task.setdefault("targets", []).append(ok)
        task["actions"] = [
            lambda: [ok.unlink() if ok.exists() else None, None][-1],
            *task["actions"],
            (doit.tools.create_folder, [B.OK]),
            lambda: [ok.touch(), None][-1],
        ]
        return task

    def sync_env(from_env, to_env, marker):
        """update an environment from another environment, based on marker pairs"""
        from_chunks = from_env.read_text(**C.ENC).split(marker)
        to_chunks = to_env.read_text(**C.ENC).split(marker)
        to_env.write_text(
            "".join([to_chunks[0], marker, from_chunks[1], marker, to_chunks[2]]),
            **C.ENC,
        )

    def get_deps(has_deps, dep_file):
        """look for deps with depfinder"""
        args = [
            which("depfinder"),
            "--no-remap",
            "--yaml",
            "--key",
            "required",
            has_deps,
        ]
        proc = subprocess.Popen(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if proc.wait() == 0:
            out = proc.stdout.read().decode("utf-8")
        else:
            print(f"   ... {has_deps.relative_to(P.ROOT)} probably isn't python...")
            out = "{}"

        dep_file.write_text(out, **C.ENC)

    def sync_lite_config(from_env, to_json, marker, extra_urls, all_deps):
        """use conda list to derive tarball names for federated_extensions"""
        try:
            # try with conda first
            raw_lock = subprocess.check_output([which("conda"), "list", "--explicit"])
        except:
            # try with micromamba
            raw_lock = subprocess.check_output(
                [os.getenv("MAMBA_EXE"), "env", "export", "--explicit"]
            )

        ext_packages = [
            p.strip().split(" ")[0]
            for p in from_env.read_text(**C.ENC).split(marker)[1].split(" - ")
            if p.strip()
        ]
        tarball_urls = [*(extra_urls or [])]
        for raw_url in sorted(raw_lock.decode("utf-8").splitlines()):
            try:
                label, subdir, pkg = re.findall(C.RE_CONDA_FORGE_URL, raw_url)[0]
            except IndexError:
                continue

            if label:
                # TODO: haven't looked into this
                continue

            for ext in ext_packages:
                if pkg.startswith(ext):
                    tarball_urls += ["/".join([C.CONDA_FORGE_RELEASE, subdir, pkg])]

        config = json.loads(to_json.read_text(**C.ENC))
        config["LiteBuildConfig"]["federated_extensions"] = sorted(set(tarball_urls))
        config["PipliteAddon"]["piplite_urls"] = sorted(set(U.deps_to_wheels(all_deps)))

        # fetch piplite wheels
        U.deps_to_wheels(all_deps)

        to_json.write_text(json.dumps(config, **C.JSON))

    def deps_to_wheels(all_deps):
        from yaml import safe_load

        required_deps = [*C.REQUIRED_WHEEL_DEPS]
        ignored_deps = [
            p
            for p in json.loads(B.PYODIDE_REPODATA.read_text(**C.ENC))[
                "packages"
            ].keys()
        ]
        ignored_deps += C.IGNORED_WHEEL_DEPS

        for dep in all_deps:
            required_deps += safe_load(dep.read_text(**C.ENC)).get("required", [])

        from_chunks = P.BINDER_ENV.read_text(**C.ENC).split(C.FED_EXT_MARKER)
        # replace unversioned dependencies with versioned ones, if needed
        for pkg, version in re.findall("-\s*([^\s]*)\s*==\s*([^\s]*)", from_chunks[1]):
            if pkg in required_deps:
                required_deps.remove(pkg)
            required_deps += [f"{pkg}=={version}"]

        B.RAW_WHEELS.mkdir(exist_ok=True, parents=True)
        B.RAW_WHEELS_REQS.write_text(
            "\n".join(
                [
                    req
                    for req in sorted(set(required_deps))
                    if req.split("==")[0] not in ignored_deps
                ]
            )
        )
        subprocess.check_call(
            [*C.PYM, "pip", "download", "-r", B.RAW_WHEELS_REQS, "--prefer-binary"],
            cwd=str(B.RAW_WHEELS),
        )

        ignored_wheels = [*C.IGNORED_WHEELS, *ignored_deps]

        for wheel in sorted(B.RAW_WHEELS.glob(f"*{C.NOARCH_WHL}")):
            if any(re.findall(f"{p}-\d", wheel.name) for p in ignored_wheels):
                continue
            meta = pkginfo.get_metadata(str(wheel))
            yield U.pip_url(meta.name, meta.version, wheel.name)

    def pip_url(name, version, wheel_name):
        """calculate and verify a "predictable" wheel name, or calculate it the hard way"""
        python_tag = "py3" if "py2." not in wheel_name else "py2.py3"

        if name == "testpath":
            python_tag = "py2.py3"

        url = "/".join([C.PYTHON_HOSTED, python_tag, name[0], name, wheel_name])

        print(".", end="", flush=True)
        r = U.session().head(url)

        if r.status_code < 400:
            print(".", end="", flush=True)
            return url

        dists = U.session().get(f"{C.PYPI_API}/{name}/json").json()["releases"][version]
        print("!", end="", flush=True)
        for dist in dists:
            if dist.get("yanked"):
                continue
            if dist["filename"] == wheel_name:
                return dist["url"]

        raise ValueError(
            f"Couldn't figure out simple or canonical URL for {wheel_name}: try"
            " deleting `build/requests-cache.sqlite` and running again"
        )

    def typedoc_conf():
        typedoc = json.loads(P.TYPEDOC_JSON.read_text(**C.ENC))
        original_entry_points = sorted(typedoc["entryPoints"])
        new_entry_points = sorted(
            [
                f"packages/{parent}"
                for parent in P.PACKAGE_JSONS
                if parent not in C.NO_TYPEDOC
            ]
        )

        if json.dumps(original_entry_points) != json.dumps(new_entry_points):
            typedoc["entryPoints"] = new_entry_points
            P.TYPEDOC_JSON.write_text(json.dumps(typedoc, **C.JSON), **C.ENC)

        tsconfig = json.loads(P.TSCONFIG_TYPEDOC.read_text(**C.ENC))
        original_references = tsconfig["references"]
        new_references = [
            {"path": f"./packages/{parent}"}
            for parent in sorted(P.PACKAGE_JSONS.keys())
            if parent not in C.NO_TYPEDOC
        ]

        if json.dumps(original_references) != json.dumps(new_references):
            tsconfig["references"] = new_references
            P.TSCONFIG_TYPEDOC.write_text(json.dumps(tsconfig, **C.JSON), **C.ENC)

    def mystify():
        """unwrap monorepo docs into per-module docs"""
        if B.DOCS_TS.exists():
            shutil.rmtree(B.DOCS_TS)

        def unescape_name_header(matchobj):
            unescaped = matchobj.group(1).replace("\\_", "_")
            if unescaped not in ["Interfaces"]:
                unescaped = f"`{unescaped}`"
            return f"""### {unescaped}"""

        def unescape_bold(matchobj):
            unescaped = matchobj.group(1).replace("\\_", "_")
            return f"""**`{unescaped}`**"""

        for doc in sorted(B.DOCS_RAW_TYPEDOC.rglob("*.md")):
            if doc.parent == B.DOCS_RAW_TYPEDOC:
                continue
            if doc.name == "README.md":
                continue
            doc_text = doc.read_text(**C.ENC)
            doc_lines = doc_text.splitlines()

            # rewrite doc and write back out
            out_doc = B.DOCS_TS / doc.relative_to(B.DOCS_RAW_TYPEDOC)
            if not out_doc.parent.exists():
                out_doc.parent.mkdir(parents=True)

            out_text = "\n".join([*doc_lines[1:], ""]).replace("README.md", "index.md")
            out_text = re.sub(
                r"## Table of contents(.*?)\n## ",
                "\n## ",
                out_text,
                flags=re.M | re.S,
            )
            out_text = re.sub("^# Module: (.*)$", r"# `\1`", out_text, flags=re.M)
            out_text = re.sub("^# (.*): (.*)$", r"# \1: `\2`", out_text, flags=re.M)
            out_text = re.sub("^### (.*)$", unescape_name_header, out_text, flags=re.M)
            out_text = re.sub(r"^[\-_]{3}$", "", out_text, flags=re.M)
            # what even is this
            out_text = re.sub("^[•▸] ", ">\n> ", out_text, flags=re.M)
            out_text = re.sub("\*\*([^\*]+)\*\*", unescape_bold, out_text, flags=re.M)
            out_text = out_text.replace("/src]", "]")
            out_text = re.sub("/src$", "", out_text, flags=re.M)
            out_text = re.sub(
                r"^((Implementation of|Overrides|Inherited from):)",
                "_\\1_",
                out_text,
                flags=re.M | re.S,
            )
            out_text = re.sub(
                r"^Defined in: ([^\n]+)$",
                "_Defined in:_ `\\1`",
                out_text,
                flags=re.M | re.S,
            )

            out_doc.write_text(out_text, **C.ENC)

        for index in [
            B.DOCS_TS_MYST_INTERFACES,
            B.DOCS_TS_MYST_MODULES,
            B.DOCS_TS_MYST_CLASSES,
        ]:
            name = index.name[:-3]
            index.write_text(
                "\n".join(
                    [
                        f"# {name.title()}",
                        "\n",
                        "```{toctree}",
                        ":maxdepth: 1",
                        ":glob:",
                        f"{name}/*",
                        "```",
                    ]
                )
            )

        B.DOCS_TS_MYST_INDEX.write_text(
            "\n".join(
                [
                    "# `@jupyterlite`\n",
                    "```{toctree}",
                    ":maxdepth: 1",
                    "modules",
                    "interfaces",
                    "classes",
                    "```",
                ]
            ),
            **C.ENC,
        )

    def validate(schema_path, instance_path=None, instance_obj=None, ref=None):
        import jsonschema

        schema = json.loads(schema_path.read_text(**C.ENC))
        if ref:
            schema["$ref"] = ref
        validator = jsonschema.Draft7Validator(schema)
        if instance_path is None and instance_obj is None:
            # probably just validating itself, carry on
            return
        if instance_obj:
            instance = instance_obj
            label = "some JSON"
        else:
            instance = json.loads(instance_path.read_text(**C.ENC))
            # handle special case of loading from ipynb
            if instance_path.name.endswith(".ipynb"):
                instance = instance["metadata"][C.NAME]
            label = instance_path.relative_to(P.ROOT)
        errors = [*validator.iter_errors(instance)]
        for error in errors:
            print(f"""{label}#/{"/".join(map(str, error.relative_path))}""")
            print("\t!!!", error.message)
            print("\ton:", str(error.instance)[:64])
        return not errors

    def docs_app(lite_task="build"):
        """before sphinx ensure a custom build of JupyterLite"""

        MATHJAX_DIR = None

        try:
            from jupyter_server_mathjax.app import STATIC_ASSETS_PATH as MATHJAX_DIR
        except Exception:
            pass

        for task in ["status", lite_task]:
            args = [
                "jupyter",
                "lite",
                task,
                "--debug",
                "--output-archive",
                B.DOCS_APP_ARCHIVE,
            ]

            # prefer the shipped archive in CI
            if not C.CI:
                args += ["--app-archive", B.APP_PACK]

            if C.FORCE_PYODIDE:
                args += ["--pyodide", D.PYODIDE_URL]

            # ignoring sys-prefix for fine-grained extensions, add mathjax dir
            if MATHJAX_DIR:
                args += ["--mathjax-dir", MATHJAX_DIR]

            args += C.LITE_ARGS

            subprocess.check_call(list(map(str, args)), cwd=str(P.EXAMPLES))

    def hashfile(path):
        shasums = path / "SHA256SUMS"
        lines = []

        for p in path.glob("*"):
            if p.name == "SHA256SUMS":
                continue
            print(p.stat().st_size / (1024 * 1024), "Mb", p.name)
            lines += ["  ".join([sha256(p.read_bytes()).hexdigest(), p.name])]

        output = "\n".join(lines)
        print(output)
        shasums.write_text(output)

    def copy_one(src, dest):
        if not src.exists():
            return False
        if not dest.parent.exists():
            dest.parent.mkdir(parents=True)
        if dest.exists():
            if dest.is_dir():
                shutil.rmtree(dest)
            else:
                dest.unlink()
        if src.is_dir():
            shutil.copytree(src, dest)
        else:
            shutil.copy2(src, dest)

    def build_one_flit(py_pkg):
        """attempt to build one package with flit: on RTD, allow doing a build in /tmp"""

        print(f"[{py_pkg.name}] trying in-tree build...", flush=True)
        args = [*C.FLIT, "--debug", "build", "--setup-py"]
        env = os.environ.update(SOURCE_DATE_EPOCH=C.SOURCE_DATE_EPOCH)

        try:
            subprocess.check_call(args, cwd=str(py_pkg), env=env)
        except subprocess.CalledProcessError:
            if not C.RTD:
                print(f"[{py_pkg.name}] ... in-tree build failed, not on ReadTheDocs")
                return False
            print(
                f"[{py_pkg.name}] ... in-tree build failed, trying build in tempdir...",
                flush=True,
            )
            py_dist = py_pkg / "dist"
            if py_dist.exists():
                shutil.rmtree(py_dist)

            with tempfile.TemporaryDirectory() as td:
                tdp = Path(td)
                py_tmp = tdp / py_pkg.name
                shutil.copytree(py_pkg, py_tmp)
                subprocess.call(args, cwd=str(py_tmp), env=env)
                shutil.copytree(py_tmp / "dist", py_dist)

    def check_one_ipynb(path):
        """ensure any pinned imports are present in the env and wheel cache"""
        built = B.DOCS / "_static/files" / path.relative_to(P.EXAMPLES)

        if not built.exists():
            return

        raw = built.read_text(**C.ENC)

        if "piplite" not in raw:
            return

        def _check():
            from_chunks = P.BINDER_ENV.read_text(**C.ENC).split(C.FED_EXT_MARKER)
            wheels = json.loads(B.DOCS_APP_WHEEL_INDEX.read_text(**C.ENC))
            unpinned = []
            uncached = []
            for pkg, version in re.findall(
                "-\s*([^\s]*)\s*==\s*([^\s]*)", from_chunks[1]
            ):
                spec = f"{pkg}=={version}"
                if pkg in raw:
                    if spec not in raw:
                        unpinned += [spec]
                    if not wheels.get(pkg, {}).get("releases", {}).get(version):
                        uncached += [spec]

            if unpinned:
                print(P.BINDER_ENV, path.name, *unpinned)

            if uncached:
                print(B.DOCS_APP_WHEEL_INDEX, path.name, *uncached)

            return not (unpinned + uncached)

        yield dict(
            name=f"ipynb:{path.name}",
            actions=[_check],
            file_dep=[path, built, P.BINDER_ENV, B.DOCS_APP_WHEEL_INDEX],
        )

    def copy_wheels(wheel_dir, wheels):
        """create a warehouse-like index for the wheels"""
        for whl_path in wheels:
            shutil.copy2(whl_path, wheel_dir / whl_path.name)

    def integrity():
        def _ensure_resolutions(app_name):
            app_json = P.ROOT / "app" / app_name / "package.json"
            old_text = app_json.read_text(**C.ENC)
            app = json.loads(old_text)
            app["resolutions"] = {}
            dependencies = list(app["dependencies"].keys())
            singletonPackages = list(app["jupyterlab"]["singletonPackages"])
            packages = dependencies + singletonPackages
            for name in packages:
                package_json = P.ROOT / "node_modules" / name / "package.json"
                data = json.loads(package_json.read_text(**C.ENC))
                prefix = (
                    "~" if re.search("^(@jupyter|@retrolab|@lumino).*", name) else "^"
                )
                app["resolutions"][name] = f"{prefix}{data['version']}"

            app["resolutions"] = {
                k: v
                for k, v in sorted(app["resolutions"].items(), key=lambda item: item[0])
            }

            new_text = json.dumps(app, indent=2) + "\n"

            if new_text.strip() == old_text.strip():
                print(
                    f"... {app_json.relative_to(P.ROOT)} `resolutions` are up-to-date!"
                )
                return True
            elif C.LINTING_IN_CI:
                print(
                    f"... {app_json.relative_to(P.ROOT)} `resolutions` are out-of-date!"
                )
                return False

            # Write the package.json back to disk.
            app_json.write_text(new_text, **C.ENC)
            print(f"... {app_json.relative_to(P.ROOT)} was updated!")
            return True

        all_up_to_date = True

        print("Checking app `resolutions`...")
        for app in D.APPS:
            all_up_to_date = _ensure_resolutions(app) and all_up_to_date

        if not all_up_to_date:
            print("\n\t!!! Re-run `doit repo` locally and commit the results.\n")

        return all_up_to_date

    def fetch_pyodide_repodata():
        schema = json.loads(P.APP_SCHEMA.read_text(**C.ENC))
        props = schema["definitions"]["pyolite-settings"]["properties"]
        url = props["pyodideUrl"]["default"].replace(D.PYODIDE_JS, "repodata.json")
        print(f"fetching pyodide packages from {url}")
        packages = U.session().get(url).json()
        B.PYODIDE_REPODATA.parent.mkdir(exist_ok=True, parents=True)
        B.PYODIDE_REPODATA.write_text(json.dumps(packages, **C.JSON))

    def make_pyolite_wheel_js():
        lines = [
            "// this file is autogenerated from the wheels described in ../package.json",
            "export * as allJSONUrl from '!!file-loader"
            ""
            "?name=pypi/[name].[ext]"
            "&context=.!../pypi/all.json';",
        ]

        vars_made = {}
        for wheel in sorted(B.PYOLITE_WHEELS.glob(f"*{C.NOARCH_WHL}")):
            # this might be brittle
            name = wheel.name.split("-")[0]
            if name == "piplite":
                lines += [f"export const PIPLITE_WHEEL = '{wheel.name}';"]
            bang = f"!../pypi/{wheel.name}"
            base_var_name = f"{name}WheelUrl"

            if base_var_name not in vars_made:
                var_suffix = ""
                vars_made[base_var_name] = 0
            else:
                vars_made[base_var_name] += 1
                var_suffix = vars_made[base_var_name]

            lines += [
                f"export * as {base_var_name}{var_suffix} from '!!file-loader"
                ""
                f"?name=pypi/[name].[ext]&context=.{bang}';"
            ]
        B.PYOLITE_WHEEL_TS.write_text("\n".join(sorted(lines) + [""]))

    def notebook_lint(ipynb: Path):
        nb_text = ipynb.read_text(**C.ENC)
        nb_json = json.loads(nb_text)

        U.pretty_markdown_cells(ipynb, nb_json)

        ipynb.write_text(json.dumps(nb_json), **C.ENC)

        if C.MIME_IPYTHON in nb_text:
            print(f"... blackening {ipynb.stem}")
            black_args = []
            black_args += ["--check"] if C.CI else ["--quiet"]
            if subprocess.call([which("black"), *black_args, ipynb]) != 0:
                return False

    def pretty_markdown_cells(ipynb, nb_json):
        cells = [c for c in nb_json["cells"] if c["cell_type"] == "markdown"]

        if not cells:
            return

        print(f"... prettying {len(cells)} markdown cells of {ipynb.stem}")
        with tempfile.TemporaryDirectory() as td:
            tdp = Path(td)

            files = {}

            for i, cell in enumerate(cells):
                files[i] = tdp / f"{ipynb.stem}-{i:03d}.md"
                files[i].write_text("".join([*cell["source"], "\n"]), **C.ENC)

            args = [which("yarn"), "--silent", "prettier", "--config", P.PRETTIER_RC]

            args += ["--check"] if C.CI else ["--write", "--list-different"]

            subprocess.call([*args, tdp])

            for i, cell in enumerate(cells):
                cells[i]["source"] = (
                    files[i].read_text(**C.ENC).rstrip().splitlines(True)
                )

    def check_contains(path: Path, pattern: str):
        if pattern not in path.read_text(**C.ENC):
            print(f"!!! {pattern} not found in:")
            print("", path)
            return False


# environment overloads
os.environ.update(
    NODE_OPTS="--max-old-space-size=4096",
    PYTHONIOENCODING=C.ENC["encoding"],
    PIP_DISABLE_PIP_VERSION_CHECK="1",
)

if C.WIN:
    os.environ.update(
        # reasses after https://github.com/xz64/license-webpack-plugin/issues/111
        NO_WEBPACK_LICENSES="1",
    )


# doit configuration
DOIT_CONFIG = {
    "backend": "sqlite3",
    "verbosity": 2,
    "par_type": "thread",
    "default_tasks": ["lint", "build", "docs:app:build"],
}
