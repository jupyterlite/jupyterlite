# ignore the whole dodo.py file for now
# ruff: noqa

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
        file_dep=[P.DOCS_ENV],
        targets=[P.BINDER_ENV],
        actions=[
            (U.sync_env, [P.DOCS_ENV, P.BINDER_ENV, C.DOCS_ENV_MARKER]),
            *([U.do(P.BINDER_ENV)] if not C.DOCS_IN_CI else []),
        ],
    )

    if C.IN_CONDA:
        all_deps = []

        yield dict(
            name="lite:extensions",
            doc="update jupyter-lite.json from the conda env",
            file_dep=[P.BINDER_ENV, *all_deps],
            targets=[],
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
                U.do(P.EXAMPLE_LITE_BUILD_CONFIG),
            ],
        )


def task_setup():
    """perform initial non-python setup"""
    if C.TESTING_IN_CI:
        return

    args = [
        "jlpm",
    ]
    file_dep = [
        *P.APP_JSONS,
        *P.PACKAGE_JSONS.values(),
        P.APP_PACKAGE_JSON,
        P.ROOT_PACKAGE_JSON,
    ]

    if P.YARN_LOCK.exists():
        file_dep += [P.YARN_LOCK]

    actions = [U.do(*args)]

    yield dict(
        name="js",
        doc="install node packages",
        file_dep=file_dep,
        actions=actions,
        targets=[B.YARN_STATE],
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

    yield dict(
        name="schema:self",
        file_dep=[P.APP_SCHEMA],
        actions=[(U.validate, [P.APP_SCHEMA])],
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
                file_dep=[ipynb],
                actions=[
                    U.do("nbstripout", "--keep-id", ipynb),
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
        file_dep=[P.DOCS_ICON, P.DOCS_WORDMARK, B.YARN_STATE],
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
            *P.PACKAGE_JSONS.values(),
            P.ROOT_PACKAGE_JSON,
            B.YARN_STATE,
        ],
        actions=[
            U.do("jlpm", "build:lib"),
        ],
        targets=[B.META_BUILDINFO],
    )

    app_deps = [
        B.YARN_STATE,
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
            app.parent / "index.template.js",
            app_json,
        ]

    yield dict(
        name="js:app",
        doc="build JupyterLite with webpack",
        file_dep=[
            *app_deps,
            *extra_app_deps,
        ],
        actions=[U.do("jlpm", "lerna", "run", "build:prod", "--scope", "@jupyterlite/app")],
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
        name=f"py:{C.CORE_NAME}:pre:app",
        file_dep=[B.APP_PACK],
        targets=[B.PY_APP_PACK],
        actions=[
            (U.copy_one, [B.APP_PACK, B.PY_APP_PACK]),
        ],
    )

    for py_name, setup_py in P.PY_SETUP_PY.items():
        py_pkg = setup_py.parent
        wheel = py_pkg / f"""dist/{py_name.replace("-", "_")}-{D.PY_VERSION}-{C.NOARCH_WHL}"""
        sdist = py_pkg / f"""dist/{py_name.replace("_", "-")}-{D.PY_VERSION}.tar.gz"""

        pyproj_toml = py_pkg / "pyproject.toml"

        file_dep = [
            *py_pkg.rglob("*.py"),
            *py_pkg.glob("*.md"),
            setup_py,
            pyproj_toml,
        ]

        if py_name == "jupyterlite-core":
            file_dep += [B.PY_APP_PACK]

        targets = [wheel, sdist]
        actions = [(U.build_one_hatch, [py_pkg])]

        yield dict(
            name=f"py:{py_name}",
            doc=f"build the {py_name} python package",
            file_dep=file_dep,
            actions=actions,
            targets=targets,
        )


def task_dist():
    """fix up the state of the distribution directory"""
    if C.TESTING_IN_CI or C.DOCS_IN_CI:
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
        yield dict(
            name=f"twine:{dist.name}",
            doc=f"use twine to validate {dist.name}",
            file_dep=[dist],
            actions=[["twine", "check", dist]],
        )


def task_dev():
    """setup up local packages for interactive development"""
    if C.DOCS_IN_CI or C.TESTING_IN_CI:
        py_name = C.CORE_NAME.replace("-", "_")
        args = [
            *C.PYM,
            "pip",
            "install",
            "-vv",
            "--no-index",
            "--find-links",
            B.DIST,
            py_name,
        ]

        yield dict(
            name="py:jupyterlite-core",
            actions=[U.do(*args, cwd=P.ROOT)],
            file_dep=[B.DIST / f"""{py_name}-{D.PY_VERSION}-{C.NOARCH_WHL}"""],
        )
    else:
        core_args = [*C.PYM, "pip", "install", "-e", "./py/jupyterlite-core[test]"]
        yield dict(
            name="py:jupyterlite-core",
            actions=[U.do(*core_args, cwd=P.ROOT)],
        )

        metapackage_args = [
            *C.PYM,
            "pip",
            "install",
            "-e",
            "./py/jupyterlite",
            "--no-deps",
        ]
        yield dict(
            name="py:jupyterlite",
            actions=[U.do(*metapackage_args, cwd=P.ROOT)],
        )


def task_docs():
    """build documentation"""
    if C.TESTING_IN_CI or C.BUILDING_IN_CI:
        return

    if not C.DOCS_IN_CI:
        yield dict(
            name="typedoc:ensure",
            file_dep=[*P.PACKAGE_JSONS.values()],
            actions=[
                U.typedoc_conf,
                U.do(*P.TYPEDOC_CONF),
            ],
            targets=[P.TYPEDOC_JSON, P.TSCONFIG_TYPEDOC],
        )
        yield dict(
            name="typedoc:build",
            doc="build the TS API documentation with typedoc",
            file_dep=[B.META_BUILDINFO, *P.TYPEDOC_CONF],
            actions=[U.do("jlpm", "docs")],
            targets=[B.DOCS_RAW_TYPEDOC_README],
        )

        yield dict(
            name="typedoc:mystify",
            doc="transform raw typedoc into myst markdown",
            file_dep=[B.DOCS_RAW_TYPEDOC_README],
            targets=[B.DOCS_TS_MYST_INDEX, *B.DOCS_TS_MODULES],
            actions=[
                U.mystify,
                U.do(B.DOCS_TS),
            ],
        )

    app_build_deps = [
        *([] if C.CI else [B.PY_APP_PACK]),
        *P.ALL_EXAMPLES,
        # NOTE: these won't always trigger a rebuild because of the inner dodo
        *P.PY_SETUP_PY[C.CORE_NAME].rglob("*.py"),
    ]

    docs_app_targets = [B.DOCS_APP_WHEEL_INDEX, B.DOCS_APP_JS_BUNDLE]

    yield U.ok(
        B.OK_DOCS_APP,
        name="app:build",
        doc="use the jupyterlite CLI to (pre-)build the docs app",
        task_dep=[f"dev:py:{C.CORE_NAME}"],
        uptodate=[lambda: False],
        actions=[(U.docs_app, [])],
        file_dep=app_build_deps,
        targets=docs_app_targets,
    )

    yield dict(
        name="app:pack",
        doc="build the as-deployed app archive",
        uptodate=[lambda: False],
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
                text = schema_html.read_text(**C.ENC)
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
            file_dep=[],
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
        actions=[U.do("jlpm", "serve")],
        file_dep=app_indexes,
    )

    yield dict(
        name="core:py",
        doc="serve the core app (no extensions) with python",
        uptodate=[lambda: False],
        actions=[U.do("jlpm", "serve:py")],
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

    yield dict(
        name="app",
        doc="use the jupyterlite CLI to check the docs app",
        task_dep=[f"dev:py:{C.CORE_NAME}"],
        actions=[(U.docs_app, ["check"])],
        file_dep=[
            B.DOCS_APP_SHA256SUMS,
            # NOTE: these won't always trigger a rebuild because of the inner dodo
            *P.PY_SETUP_PY[C.CORE_NAME].rglob("*.py"),
        ],
    )


def task_watch():
    """watch sources and rebuild on change"""
    yield dict(
        name="js",
        doc="watch .ts, .js, and .css sources and rebuild packages and apps",
        uptodate=[lambda: False],
        file_dep=[],
        actions=[U.do("jlpm", "watch")],
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
        file_dep=[B.META_BUILDINFO],
        actions=[U.do("jlpm", "build:test"), U.do("jlpm", "test")],
    )

    env = dict(os.environ)

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
        if py_name != C.CORE_NAME:
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
        actions=[U.integrity, U.do(*pkg_jsons)],
        file_dep=[*pkg_jsons],
    )

    yield dict(
        name="integrity:check",
        doc="check app yarn resolutions are up-to-date",
        actions=[
            (U.integrity, [True]),
        ],
        file_dep=[*pkg_jsons],
    )


class C:
    NAME = "jupyterlite"
    CORE_NAME = "jupyterlite-core"
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
        os.environ.get("LAB_ARGS", """["--no-browser","--debug","--expose-app-in-browser"]""")
    )
    SPHINX_ARGS = json.loads(os.environ.get("SPHINX_ARGS", "[]"))

    DOCS_ENV_MARKER = "### DOCS ENV ###"
    FED_EXT_MARKER = "### FEDERATED EXTENSIONS ###"
    RE_CONDA_FORGE_URL = r"/conda-forge/(.*/)?(noarch|linux-64|win-64|osx-64)/([^/]+)$"
    GH = "https://github.com"
    CONDA_FORGE_RELEASE = "https://conda.anaconda.org/conda-forge"
    LITE_GH_ORG = f"{GH}/{NAME}"
    P5_GH_REPO = f"{LITE_GH_ORG}/p5-kernel"
    P5_MOD = "jupyterlite_p5_kernel"
    P5_VERSION = "0.1.0"
    P5_RELEASE = f"{P5_GH_REPO}/releases/download/v{P5_VERSION}"
    P5_WHL_URL = f"{P5_RELEASE}/{P5_MOD}-{P5_VERSION}-{NOARCH_WHL}"
    JUPYTERLITE_JSON = "jupyter-lite.json"
    JUPYTERLITE_IPYNB = "jupyter-lite.ipynb"
    IPYNB_METADATA = "jupyter-lite"
    LITE_CONFIG_FILES = [JUPYTERLITE_JSON, JUPYTERLITE_IPYNB]
    NO_TYPEDOC = ["_metapackage"]

    BUILDING_IN_CI = json.loads(os.environ.get("BUILDING_IN_CI", "0"))
    DOCS_IN_CI = json.loads(os.environ.get("DOCS_IN_CI", "0"))
    TESTING_IN_CI = json.loads(os.environ.get("TESTING_IN_CI", "0"))
    WIN_DEV_IN_CI = json.loads(os.environ.get("WIN_DEV_IN_CI", "0"))
    PYM = [sys.executable, "-m"]
    HATCH = [*PYM, "hatch"]
    SOURCE_DATE_EPOCH = (
        subprocess.check_output([which("git"), "log", "-1", "--format=%ct"]).decode("utf-8").strip()
    )
    SVGO = ["jlpm", "svgo", "--multipass", "--pretty", "--indent=2", "--final-newline"]

    # coverage varies based on excursions
    COV_THRESHOLD = 82
    SKIP_LINT = [
        "/docs/_build/",
        "/.ipynb_checkpoints/",
        "/jupyter_execute/",
        "/_static/",
    ]
    NOT_SKIP_LINT = lambda p: not re.findall("|".join(C.SKIP_LINT), str(p.as_posix()))


class P:
    DODO = Path(__file__)
    ROOT = DODO.parent
    PACKAGES = ROOT / "packages"
    PACKAGE_JSONS = {p.parent.name: p for p in PACKAGES.glob("*/package.json")}
    UI_COMPONENTS = PACKAGES / "ui-components"
    UI_COMPONENTS_ICONS = UI_COMPONENTS / "style" / "icons"
    ROOT_PACKAGE_JSON = ROOT / "package.json"
    YARN_LOCK = ROOT / "yarn.lock"

    EXAMPLES = ROOT / "examples"
    ALL_EXAMPLES = [
        p
        for p in EXAMPLES.rglob("*")
        if not p.is_dir() and ".cache" not in str(p) and ".doit" not in str(p)
    ]

    APP = ROOT / "app"
    APP_JUPYTERLITE_JSON = APP / C.JUPYTERLITE_JSON
    APP_JUPYTERLITE_IPYNB = APP / C.JUPYTERLITE_IPYNB
    APP_PACKAGE_JSON = APP / "package.json"
    APP_SCHEMA = APP / "jupyterlite.schema.v0.json"
    APP_HTMLS = [
        APP / "index.html",
        *APP.rglob("*/index.template.html"),
        *[p for p in APP.rglob("*/index.html") if not (p.parent / "index.template.html").exists()],
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
        [p for p in DOCS.rglob("*.md") if "docs/reference/api/ts" not in str(p.as_posix())]
    )
    DOCS_ENV = DOCS / "environment.yml"
    DOCS_PY = sorted([p for p in DOCS.rglob("*.py") if "jupyter_execute" not in str(p)])
    DOCS_MD = sorted([*DOCS_SRC_MD, README, CONTRIBUTING, CHANGELOG])
    DOCS_IPYNB = filter(
        lambda p: not re.match("|".join(C.SKIP_LINT), str(p.as_posix())),
        DOCS.rglob("*.ipynb"),
    )

    # demo
    BINDER = ROOT / ".binder"
    BINDER_ENV = BINDER / "environment.yml"

    # CI
    CI = ROOT / ".github"


def _js_version_to_py_version(js_version):
    return js_version.replace("-alpha.", "a").replace("-beta.", "b").replace("-rc.", "rc")


class D:
    # data
    APP = json.loads(P.APP_PACKAGE_JSON.read_text(**C.ENC))
    APP_VERSION = APP["version"]
    APPS = APP["jupyterlite"]["apps"]
    APP_SCHEMA = json.loads(P.APP_SCHEMA.read_text(**C.ENC))
    APP_SCHEMA_DEFS = APP_SCHEMA["definitions"]

    # derive the PEP-compatible version
    PY_VERSION = _js_version_to_py_version(APP["version"])

    PACKAGE_JSONS = {
        parent: json.loads(p.read_text(**C.ENC)) for parent, p in P.PACKAGE_JSONS.items()
    }

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


class B:
    # built
    NODE_MODULES = P.ROOT / "node_modules"
    YARN_STATE = NODE_MODULES / ".yarn-state.yml"
    META_BUILDINFO = P.PACKAGES / "_metapackage/tsconfig.tsbuildinfo"

    # built things
    BUILD = P.ROOT / "build"
    DIST = P.ROOT / "dist"
    APP_PACK = DIST / f"""{C.NAME}-app-{D.APP_VERSION}.tgz"""
    PY_APP_PACK = P.ROOT / "py" / C.CORE_NAME / C.CORE_NAME.replace("-", "_") / APP_PACK.name
    REQ_CACHE = BUILD / "requests-cache.sqlite"

    EXAMPLE_DEPS = BUILD / "depfinder"
    # does crazy imports
    SKIP_DEPFINDER = [P.EXAMPLES / "python-packages.ipynb"]

    DOCS_APP = BUILD / "docs-app"
    DOCS_APP_SHA256SUMS = DOCS_APP / "SHA256SUMS"
    DOCS_APP_ARCHIVE = DOCS_APP / f"""jupyterlite-docs-{D.APP_VERSION}.tgz"""
    DOCS_APP_WHEEL_INDEX = DOCS_APP / "pypi/all.json"
    DOCS_APP_JS_BUNDLE = DOCS_APP / "build/lab/bundle.js"

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
        P.ROOT / f"docs/reference/api/ts/modules/jupyterlite_{parent.replace('-', '_')}.md"
        for parent in P.PACKAGE_JSONS
        if parent not in C.NO_TYPEDOC
    ]

    OK = BUILD / "ok"
    OK_DOCS_APP = OK / "docs-app"
    OK_JEST = OK / "jest"
    OK_LITE_PYTEST = OK / "jupyterlite.pytest"
    OK_LITE_VERSION = OK / "lite.version"
    PY_DISTRIBUTIONS = [
        *P.ROOT.glob("py/*/dist/*.whl"),
        *P.ROOT.glob("py/*/dist/*.tar.gz"),
    ]
    DIST_HASH_INPUTS = sorted([*PY_DISTRIBUTIONS, APP_PACK])


class BB:
    """Built from other built files"""

    # not exhaustive, because of per-class API pages
    ALL_DOCS_HTML = [
        (B.DOCS / src.parent.relative_to(P.DOCS) / (src.name.rsplit(".", 1)[0] + ".html"))
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
        return doit.action.CmdAction([cmd, *args[1:]], shell=False, cwd=str(Path(cwd)), **kwargs)

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

        to_json.write_text(json.dumps(config, **C.JSON))

    def typedoc_conf():
        typedoc = json.loads(P.TYPEDOC_JSON.read_text(**C.ENC))
        original_entry_points = sorted(typedoc["entryPoints"])
        new_entry_points = sorted(
            [f"packages/{parent}" for parent in P.PACKAGE_JSONS if parent not in C.NO_TYPEDOC]
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

    def build_one_hatch(py_pkg):
        """attempt to build one package with hatch: on RTD, allow doing a build in /tmp"""

        print(f"[{py_pkg.name}] trying in-tree build...", flush=True)
        args = [*C.HATCH, "build"]
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

    def integrity(check=False):
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
                prefix = "~" if re.search("^(@jupyter|@lumino).*", name) else "^"
                app["resolutions"][name] = f"{prefix}{data['version']}"

            app["resolutions"] = {
                k: v for k, v in sorted(app["resolutions"].items(), key=lambda item: item[0])
            }

            new_text = json.dumps(app, indent=2) + "\n"

            if new_text.strip() == old_text.strip():
                print(f"... {app_json.relative_to(P.ROOT)} `resolutions` are up-to-date!")
                return True
            elif check:
                print(f"... {app_json.relative_to(P.ROOT)} `resolutions` are out-of-date!")
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
    "default_tasks": ["build", "docs:app:build"],
}
