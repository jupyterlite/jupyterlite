import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from collections import defaultdict
from hashlib import sha256
from pathlib import Path

import doit
import pkginfo


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
            name="pyodide:packages",
            doc="fetch the pyodide packages.json",
            file_dep=[P.APP_SCHEMA],
            targets=[B.PYODIDE_PACKAGES],
            actions=[U.fetch_pyodide_packages],
        )

        for nb in P.ALL_EXAMPLES:
            if not nb.name.endswith(".ipynb"):
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
            file_dep=[P.BINDER_ENV, B.PYODIDE_PACKAGES, *all_deps],
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

    args = ["yarn", "--prefer-offline", "--ignore-optional"]

    if C.CI:
        # .yarn-integrity will only exist on a full cache hit vs yarn.lock, saves 1min+
        if B.YARN_INTEGRITY.exists():
            return
        args += ["--frozen-lockfile"]

    yield dict(
        name="js",
        doc="install node packages",
        file_dep=[
            P.YARN_LOCK,
            *P.PACKAGE_JSONS,
            P.ROOT_PACKAGE_JSON,
            P.APP_PACKAGE_JSON,
            *P.APP_JSONS,
        ],
        actions=[U.do(*args)],
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

    yield U.ok(
        B.OK_PRETTIER,
        name="prettier",
        doc="format .ts, .md, .json, etc. files with prettier",
        file_dep=[*L.ALL_PRETTIER, B.YARN_INTEGRITY],
        actions=[U.do("yarn", "prettier:check" if C.CI else "prettier:fix")],
    )

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

    yield dict(
        name=f"schema:validate:{B.LAB_WHEEL_INDEX.relative_to(P.ROOT)}",
        file_dep=[P.PIPLITE_SCHEMA, B.LAB_WHEEL_INDEX],
        actions=[(U.validate, (P.PIPLITE_SCHEMA, B.LAB_WHEEL_INDEX))],
    )

    for config in D.APP_CONFIGS:
        yield dict(
            name=f"schema:validate:{config.relative_to(P.ROOT)}",
            file_dep=[P.APP_SCHEMA, config],
            actions=[(U.validate, (P.APP_SCHEMA, config))],
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
                "yarn",
                "svgo",
                "--pretty",
                "--indent=2",
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
            P.ROOT_PACKAGE_JSON,
            *P.PACKAGE_JSONS,
            B.YARN_INTEGRITY,
        ],
        actions=[
            U.do("yarn", "build:lib"),
        ],
        targets=[B.META_BUILDINFO],
    )

    wheels = []

    for py_pkg, version in P.PYOLITE_PACKAGES.items():
        name = py_pkg.name
        wheel = py_pkg / f"dist/{name}-{version}-{C.NOARCH_WHL}"
        wheels += [wheel]
        yield dict(
            name=f"js:py:{name}",
            doc=f"build the {name} python package for the brower with flit",
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
        file_dep=wheels,
        actions=[
            (doit.tools.create_folder, [B.LAB_WHEELS]),
            (U.copy_wheels, [B.LAB_WHEEL_INDEX, wheels]),
            # nasty
            U.do(*C.PYM, "jupyterlite.app", "pip", "index", B.LAB_WHEELS, env=bs_env),
        ],
        targets=[B.LAB_WHEEL_INDEX],
    )

    app_deps = [B.META_BUILDINFO, P.WEBPACK_CONFIG, P.LITE_ICON, P.LITE_WORDMARK]
    all_app_targets = []

    for app_json in P.APP_JSONS:
        app = app_json.parent
        app_data = json.loads(app_json.read_text(**C.ENC))
        app_build = app / "build"
        app_targets = [
            app_build / "bundle.js",
            app_build / "index.js",
            app_build / "style.js",
        ]
        all_app_targets += app_targets

        yield dict(
            name=f"js:app:{app.name}",
            doc=f"build JupyterLite {app.name.title()} with webpack",
            file_dep=[
                *app_deps,
                B.LAB_WHEEL_INDEX,
                app / "index.template.js",
                app_json,
            ],
            actions=[
                U.do("yarn", "lerna", "run", "build:prod", "--scope", app_data["name"])
            ],
            targets=[*app_targets],
        )

    yield dict(
        name="js:pack",
        doc="build the JupyterLite distribution",
        file_dep=[
            *all_app_targets,
            *P.APP.glob("*.js"),
            *P.APP.glob("*.json"),
            *P.APP.glob("*/*/index.html"),
            *P.APP.glob("*/build/schemas/**/.json"),
            B.LAB_WHEEL_INDEX,
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


@doit.create_after("build")
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
            file_dep=[*P.PACKAGE_JSONS, B.YARN_INTEGRITY],
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
                U.do(*C.PRETTIER, B.DOCS_TS_MYST_INDEX, *B.DOCS_TS_MODULES),
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

    yield U.ok(
        B.OK_DOCS_APP,
        name="app:build",
        doc="use the jupyterlite CLI to (pre-)build the docs app",
        task_dep=[f"dev:py:{C.NAME}"],
        actions=[(U.docs_app, [])],
        file_dep=app_build_deps,
        targets=[B.DOCS_APP_WHEEL_INDEX, B.DOCS_APP_JS_BUNDLE],
    )

    yield dict(
        name="app:pack",
        doc="build the as-deployed app archive",
        file_dep=[B.OK_DOCS_APP],
        actions=[(U.docs_app, ["archive"])],
        targets=[B.DOCS_APP_ARCHIVE],
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
        targets=[B.DOCS_BUILDINFO, B.DOCS_STATIC_APP],
    )


@doit.create_after("docs")
def task_check():
    """perform checks of built artifacts"""
    yield dict(
        name="docs:links",
        doc="check for broken (internal) links",
        file_dep=[*B.DOCS.rglob("*.html")],
        actions=[
            U.do(
                "pytest-check-links",
                B.DOCS,
                "-p",
                "no:warnings",
                "--links-ext=html",
                "--check-anchors",
                "--check-links-ignore",
                "^https?://",
            )
        ],
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
    if C.DOCS_IN_CI or C.BUILDING_IN_CI:
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

    pytest_args = [
        *C.PYM,
        "pytest",
        "--ff",
        "--script-launch-mode=subprocess",
        "-n=4",
        "-vv",
        f"--cov-fail-under={C.COV_THRESHOLD}",
        "--cov-report=term-missing:skip-covered",
        "--no-cov-on-fail",
        "--durations=5",
    ]

    for py_name, setup_py in P.PY_SETUP_PY.items():
        if py_name != C.NAME:
            # TODO: we'll get there
            continue

        py_mod = py_name.replace("-", "_")
        cov_path = B.BUILD / f"htmlcov/{py_name}"
        cov_index = cov_path / "index.html"
        html_index = B.BUILD / f"pytest/{py_name}/index.html"

        if C.CI:
            cwd = B.DIST
            pkg_args = ["--pyargs", py_mod]
        else:
            cwd = setup_py.parent
            pkg_args = []

        yield U.ok(
            B.OK_LITE_PYTEST,
            name=f"py:{py_name}",
            doc=f"run pytest for {py_name}",
            task_dep=[f"dev:py:{py_name}"],
            file_dep=[
                *setup_py.parent.rglob("*.py"),
                setup_py.parent / "pyproject.toml",
            ],
            targets=[cov_index, html_index],
            actions=[
                U.do(
                    *pytest_args,
                    *(C.PYTEST_ARGS or []),
                    "--cov",
                    py_mod,
                    "--cov-report",
                    f"html:{cov_path}",
                    f"--html={html_index}",
                    "--self-contained-html",
                    *pkg_args,
                    cwd=cwd,
                )
            ],
        )


def task_repo():
    pkg_jsons = [P.ROOT / "app" / app / "package.json" for app in C.APPS]
    yield dict(
        name="integrity",
        doc="ensure app yarn resolutions are up-to-date",
        actions=[U.integrity, U.do(*C.PRETTIER, *pkg_jsons)],
        file_dep=[B.YARN_INTEGRITY, *pkg_jsons],
    )


class C:
    NAME = "jupyterlite"
    APPS = ["retro", "lab"]
    NOARCH_WHL = "py3-none-any.whl"
    ENC = dict(encoding="utf-8")
    JSON = dict(indent=2, sort_keys=True)
    CI = bool(json.loads(os.environ.get("CI", "0")))
    RTD = bool(json.loads(os.environ.get("READTHEDOCS", "False").lower()))
    IN_CONDA = bool(os.environ.get("CONDA_PREFIX"))
    PYTEST_ARGS = json.loads(os.environ.get("PYTEST_ARGS", "[]"))
    LITE_ARGS = json.loads(os.environ.get("LITE_ARGS", "[]"))
    SPHINX_ARGS = json.loads(os.environ.get("SPHINX_ARGS", "[]"))
    DOCS_ENV_MARKER = "### DOCS ENV ###"
    FED_EXT_MARKER = "### FEDERATED EXTENSIONS ###"
    RE_CONDA_FORGE_URL = r"/conda-forge/(.*/)?(noarch|linux-64|win-64|osx-64)/([^/]+)$"
    GH = "https://github.com"
    CONDA_FORGE_RELEASE = f"{GH}/conda-forge/releases/releases/download"
    LITE_GH_ORG = f"{GH}/{NAME}"
    P5_GH_REPO = f"{LITE_GH_ORG}/p5-kernel"
    P5_MOD = "jupyterlite_p5_kernel"
    P5_VERSION = "0.1.0a12"
    P5_RELEASE = f"{P5_GH_REPO}/releases/download/v{P5_VERSION}"
    P5_WHL_URL = f"{P5_RELEASE}/{P5_MOD}-{P5_VERSION}-{NOARCH_WHL}"
    JUPYTERLITE_JSON = "jupyter-lite.json"
    LITE_CONFIG_FILES = [JUPYTERLITE_JSON, "jupyter-lite.ipynb"]
    NO_TYPEDOC = ["_metapackage"]
    LITE_CONFIG_FILES = ["jupyter-lite.json", "jupyter-lite.ipynb"]
    COV_THRESHOLD = 91
    IGNORED_WHEEL_DEPS = [
        # our stuff
        "pyolite",
        "piplite",
        # magic JS interop layer
        "js",
        "pyodide_js",
    ]
    IGNORED_WHEELS = ["widgetsnbextension", "nbformat", "ipykernel", "pyolite"]

    BUILDING_IN_CI = json.loads(os.environ.get("BUILDING_IN_CI", "0"))
    DOCS_IN_CI = json.loads(os.environ.get("DOCS_IN_CI", "0"))
    LINTING_IN_CI = json.loads(os.environ.get("LINTING_IN_CI", "0"))
    TESTING_IN_CI = json.loads(os.environ.get("TESTING_IN_CI", "0"))

    PYM = [sys.executable, "-m"]
    FLIT = [*PYM, "flit"]
    SOURCE_DATE_EPOCH = (
        subprocess.check_output(["git", "log", "-1", "--format=%ct"])
        .decode("utf-8")
        .strip()
    )
    PRETTIER = ["yarn", "prettier", "--write"]


class P:
    DODO = Path(__file__)
    ROOT = DODO.parent
    PACKAGES = ROOT / "packages"
    PACKAGE_JSONS = sorted(PACKAGES.glob("*/package.json"))
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
    APP_PACKAGE_JSON = APP / "package.json"
    APP_SCHEMA = APP / "jupyterlite.schema.v0.json"
    PIPLITE_SCHEMA = APP / "piplite.schema.v0.json"
    APP_HTMLS = [APP / "index.html", *APP.glob("*/index.html")]
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
    DOCS_ICON = DOCS / "_static/icon.svg"
    DOCS_WORDMARK = DOCS / "_static/wordmark.svg"
    EXAMPLE_OVERRIDES = EXAMPLES / "overrides.json"
    EXAMPLE_JUPYTERLITE_JSON = EXAMPLES / C.JUPYTERLITE_JSON
    EXAMPLE_LITE_BUILD_CONFIG = EXAMPLES / "jupyter_lite_config.json"
    TSCONFIG_TYPEDOC = ROOT / "tsconfig.typedoc.json"
    TYPEDOC_JSON = ROOT / "typedoc.json"
    TYPEDOC_CONF = [TSCONFIG_TYPEDOC, TYPEDOC_JSON]
    DOCS_SRC_MD = sorted(
        [p for p in DOCS.rglob("*.md") if "docs/api/ts" not in str(p.as_posix())]
    )
    DOCS_ENV = DOCS / "environment.yml"
    DOCS_PY = sorted([p for p in DOCS.rglob("*.py") if "jupyter_execute" not in str(p)])
    DOCS_MD = sorted([*DOCS_SRC_MD, README, CONTRIBUTING, CHANGELOG])
    DOCS_IPYNB = sorted(DOCS.glob("*.ipynb"))

    # demo
    BINDER = ROOT / ".binder"
    BINDER_ENV = BINDER / "environment.yml"

    # CI
    CI = ROOT / ".github"


class D:
    # data
    APP = json.loads(P.APP_PACKAGE_JSON.read_text(**C.ENC))
    APP_VERSION = APP["version"]
    # derive the PEP-compatible version
    PY_VERSION = (
        APP["version"]
        .replace("-alpha.", "a")
        .replace("-beta.", "b")
        .replace("-rc.", "rc")
    )

    PACKAGE_JSONS = {
        p.parent.name: json.loads(p.read_text(**C.ENC)) for p in P.PACKAGE_JSONS
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


P.PYOLITE_PACKAGES = {
    P.PACKAGES / pkg / pyp: pyp_version
    for pkg, pkg_data in D.PACKAGE_JSONS.items()
    for pyp, pyp_version in pkg_data.get("pyolite", {}).get("packages", {}).items()
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
            if "node_modules" in str(path) or ".ipynb_checkpoints" in str(path):
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
        P.PACKAGE_JSONS,
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
    ALL_PRETTIER = _clean_paths(
        ALL_JSON, ALL_MD, ALL_YAML, ALL_ESLINT, ALL_JS, ALL_HTML
    )
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
    LAB_WHEELS = P.APP / "lab/build/wheels"
    LAB_WHEEL_INDEX = LAB_WHEELS / "all.json"
    PY_APP_PACK = P.ROOT / "py" / C.NAME / "src" / C.NAME / APP_PACK.name

    EXAMPLE_DEPS = BUILD / "depfinder"

    PYODIDE_PACKAGES = BUILD / "pyodide-packages.json"
    RAW_WHEELS = BUILD / "wheels"
    RAW_WHEELS_REQS = RAW_WHEELS / "requirements.txt"
    DOCS_APP = BUILD / "docs-app"
    DOCS_APP_SHA256SUMS = DOCS_APP / "SHA256SUMS"
    DOCS_APP_ARCHIVE = DOCS_APP / f"""jupyterlite-docs-{D.APP_VERSION}.tgz"""
    DOCS_APP_WHEEL_INDEX = DOCS_APP / "lab/build/wheels/all.json"
    DOCS_APP_JS_BUNDLE = DOCS_APP / "lab/build/bundle.js"

    DOCS = Path(os.environ.get("JLITE_DOCS_OUT", P.DOCS / "_build"))
    DOCS_BUILDINFO = DOCS / ".buildinfo"
    DOCS_STATIC = DOCS / "_static"
    DOCS_STATIC_APP = DOCS_STATIC / DOCS_APP_ARCHIVE.name

    # typedoc
    DOCS_RAW_TYPEDOC = BUILD / "typedoc"
    DOCS_RAW_TYPEDOC_README = DOCS_RAW_TYPEDOC / "README.md"
    DOCS_TS = P.DOCS / "api/ts"
    DOCS_TS_MYST_INDEX = DOCS_TS / "index.md"
    DOCS_TS_MODULES = [
        P.ROOT / "docs/api/ts" / f"{p.parent.name}.md"
        for p in P.PACKAGE_JSONS
        if p.parent.name not in C.NO_TYPEDOC
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
    PY_DISTRIBUTIONS = [
        *P.ROOT.glob("py/*/dist/*.whl"),
        *P.ROOT.glob("py/*/dist/*.tar.gz"),
    ]
    DIST_HASH_INPUTS = sorted([*PY_DISTRIBUTIONS, APP_PACK])


class U:
    @staticmethod
    def do(*args, cwd=P.ROOT, **kwargs):
        """wrap a CmdAction for consistency"""
        cmd = args[0]
        try:
            cmd = Path(
                shutil.which(cmd)
                or shutil.which(f"{cmd}.exe")
                or shutil.which(f"{cmd}.cmd")
                or shutil.which(f"{cmd}.bat")
            ).resolve()
        except Exception:
            print(cmd, "is not available (this might not be a problem)")
            return ["echo", f"{cmd} not available"]
        return doit.action.CmdAction([cmd, *args[1:]], shell=False, cwd=str(Path(cwd)))

    @staticmethod
    def ok(ok, **task):
        task.setdefault("targets", []).append(ok)
        task["actions"] = [
            lambda: [ok.unlink() if ok.exists() else None, None][-1],
            *task["actions"],
            (doit.tools.create_folder, [B.OK]),
            lambda: [ok.touch(), None][-1],
        ]
        return task

    @staticmethod
    def sync_env(from_env, to_env, marker):
        """update an environment from another environment, based on marker pairs"""
        from_chunks = from_env.read_text(**C.ENC).split(marker)
        to_chunks = to_env.read_text(**C.ENC).split(marker)
        to_env.write_text(
            "".join([to_chunks[0], marker, from_chunks[1], marker, to_chunks[2]]),
            **C.ENC,
        )

    @staticmethod
    def get_deps(has_deps, dep_file):
        """look for deps with depfinder"""
        out = "{}"

        try:
            out = subprocess.check_output(
                ["depfinder", "--no-remap", "--yaml", "--key", "required", has_deps]
            ).decode("utf-8")
        except subprocess.CalledProcessError:
            print(has_deps, "probably isn't python")

        dep_file.write_text(out, **C.ENC)

    @staticmethod
    def sync_lite_config(from_env, to_json, marker, extra_urls, all_deps):
        """use conda list to derive tarball names for federated_extensions"""
        raw_lock = subprocess.check_output(["conda", "list", "--explicit"])
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
                    tarball_urls += [
                        "/".join([C.CONDA_FORGE_RELEASE, subdir, pkg, pkg])
                    ]

        config = json.loads(to_json.read_text(**C.ENC))
        config["LiteBuildConfig"]["federated_extensions"] = sorted(set(tarball_urls))
        config["LiteBuildConfig"]["piplite_urls"] = sorted(
            set(U.deps_to_wheels(all_deps))
        )

        # fetch piplite wheels
        U.deps_to_wheels(all_deps)

        to_json.write_text(json.dumps(config, **C.JSON))

    @staticmethod
    def deps_to_wheels(all_deps):
        from yaml import safe_load

        required_deps = ["ipykernel", "notebook"]
        ignored_deps = [
            p
            for p in json.loads(B.PYODIDE_PACKAGES.read_text(**C.ENC))[
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
            ["pip", "download", "-r", B.RAW_WHEELS_REQS], cwd=str(B.RAW_WHEELS)
        )

        ignored_wheels = [*C.IGNORED_WHEELS, *ignored_deps]

        for wheel in sorted(B.RAW_WHEELS.glob(f"*{C.NOARCH_WHL}")):
            if any(re.findall(f"{p}-\d", wheel.name) for p in ignored_wheels):
                continue
            meta = pkginfo.get_metadata(str(wheel))
            yield U.pip_url(meta.name, meta.version, wheel.name)

    @staticmethod
    def pip_url(name, version, wheel_name):
        python_tag = "py3" if "py2." not in wheel_name else "py2.py3"

        if name == "testpath":
            python_tag = "py2.py3"

        return "/".join(
            [
                "https://files.pythonhosted.org/packages",
                python_tag,
                name[0],
                name,
                wheel_name,
            ]
        )

    @staticmethod
    def typedoc_conf():
        typedoc = json.loads(P.TYPEDOC_JSON.read_text(**C.ENC))
        original_entry_points = sorted(typedoc["entryPoints"])
        new_entry_points = sorted(
            [
                str(next(p.parent.glob("src/index.ts*")).relative_to(P.ROOT).as_posix())
                for p in P.PACKAGE_JSONS
                if p.parent.name not in C.NO_TYPEDOC
            ]
        )

        if json.dumps(original_entry_points) != json.dumps(new_entry_points):
            typedoc["entryPoints"] = new_entry_points
            P.TYPEDOC_JSON.write_text(json.dumps(typedoc, **C.JSON), **C.ENC)

        tsconfig = json.loads(P.TSCONFIG_TYPEDOC.read_text(**C.ENC))
        original_references = tsconfig["references"]
        new_references = [
            {"path": f"./packages/{p.parent.name}"}
            for p in P.PACKAGE_JSONS
            if p.parent.name not in C.NO_TYPEDOC
        ]

        if json.dumps(original_references) != json.dumps(new_references):
            tsconfig["references"] = new_references
            P.TSCONFIG_TYPEDOC.write_text(json.dumps(tsconfig, **C.JSON), **C.ENC)

    @staticmethod
    def mystify():
        """unwrap monorepo docs into per-module docs"""
        mods = defaultdict(lambda: defaultdict(list))
        if B.DOCS_TS.exists():
            shutil.rmtree(B.DOCS_TS)

        def mod_md_name(mod):
            return mod.replace("@jupyterlite/", "") + ".md"

        for doc in sorted(B.DOCS_RAW_TYPEDOC.rglob("*.md")):
            if doc.parent == B.DOCS_RAW_TYPEDOC:
                continue
            if doc.name == "README.md":
                continue
            doc_text = doc.read_text(**C.ENC)
            doc_lines = doc_text.splitlines()
            mod_chunks = doc_lines[0].split(" / ")
            src = mod_chunks[1]
            if src.startswith("["):
                src = re.findall(r"\[(.*)/src\]", src)[0]
            else:
                src = src.replace("/src", "")
            pkg = f"""@jupyterlite/{src.replace("/src", "")}"""
            mods[pkg][doc.parent.name] += [
                str(doc.relative_to(B.DOCS_RAW_TYPEDOC).as_posix())[:-3]
            ]

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
            out_text = out_text.replace("/src]", "]")
            out_text = re.sub("/src$", "", out_text, flags=re.M)
            out_text = re.sub(
                r"^Defined in: ([^\n]+)$",
                "_Defined in:_ `\\1`",
                out_text,
                flags=re.M | re.S,
            )
            out_text = re.sub(
                r"^((Implementation of|Overrides|Inherited from):)",
                "_\\1_",
                out_text,
                flags=re.M | re.S,
            )

            out_doc.write_text(out_text, **C.ENC)

        for mod, sections in mods.items():
            out_doc = B.DOCS_TS / mod_md_name(mod)
            mod_lines = [f"""# `{mod.replace("@jupyterlite/", "")}`\n"""]
            for label, contents in sections.items():
                mod_lines += [
                    f"## {label.title()}\n",
                    "```{toctree}",
                    ":maxdepth: 1",
                    *contents,
                    "```\n",
                ]
            out_doc.write_text("\n".join(mod_lines))

        B.DOCS_TS_MYST_INDEX.write_text(
            "\n".join(
                [
                    "# `@jupyterlite`\n",
                    "```{toctree}",
                    ":maxdepth: 1",
                    *[mod_md_name(mod) for mod in sorted(mods)],
                    "```",
                ]
            ),
            **C.ENC,
        )

    @staticmethod
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

    @staticmethod
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

    @staticmethod
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

    @staticmethod
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

    @staticmethod
    def build_one_flit(py_pkg):
        """attempt to build one package with flit: on RTD, allow doing a build in /tmp"""

        print(f"[{py_pkg.name}] trying in-tree build...", flush=True)
        args = [*C.FLIT, "--debug", "build"]
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

    @staticmethod
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

    @staticmethod
    def copy_wheels(wheel_index, wheels):
        """create a warehouse-like index for the wheels"""
        wheel_dir = wheel_index.parent

        for whl_path in wheels:
            shutil.copy2(whl_path, wheel_dir / whl_path.name)

    @staticmethod
    def integrity():
        def _ensure_resolutions(app_name):
            app_json = P.ROOT / "app" / app_name / "package.json"
            app = json.loads(app_json.read_text(**C.ENC))
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

            # Write the package.json back to disk.
            app_json.write_text(json.dumps(app, indent=2) + "\n", **C.ENC)

        for app in C.APPS:
            _ensure_resolutions(app)

    @staticmethod
    def fetch_pyodide_packages():
        import urllib.request

        schema = json.loads(P.APP_SCHEMA.read_text(**C.ENC))
        props = schema["definitions"]["pyolite-settings"]["properties"]
        url = props["pyodideUrl"]["default"].replace("pyodide.js", "packages.json")
        with urllib.request.urlopen(url) as response:
            packages = json.loads(response.read().decode("utf-8"))
        B.PYODIDE_PACKAGES.parent.mkdir(exist_ok=True, parents=True)
        B.PYODIDE_PACKAGES.write_text(json.dumps(packages, **C.JSON))


# environment overloads
os.environ.update(
    NODE_OPTS="--max-old-space-size=4096",
    PYTHONIOENCODING=C.ENC["encoding"],
    PIP_DISABLE_PIP_VERSION_CHECK="1",
)

# doit configuration
DOIT_CONFIG = {
    "backend": "sqlite3",
    "verbosity": 2,
    "par_type": "thread",
    "default_tasks": ["lint", "build", "docs:app:build"],
}
