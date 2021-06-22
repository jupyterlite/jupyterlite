import json
import os
import re
import shutil
import subprocess
import sys
from collections import defaultdict
from hashlib import sha256
from pathlib import Path

import doit
import jsonschema


def task_env():
    """keep environments in sync"""

    yield dict(
        name="binder",
        file_dep=[P.DOCS_ENV],
        targets=[P.BINDER_ENV],
        actions=[(U.sync_env, [P.DOCS_ENV, P.BINDER_ENV, C.DOCS_ENV_MARKER])],
    )


def task_setup():
    """perform initial non-python setup"""
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
    if C.RTD:
        return

    yield U.ok(
        B.OK_PRETTIER,
        name="prettier",
        doc="format .ts, .md, .json, etc. files with prettier",
        file_dep=[*L.ALL_PRETTIER, B.YARN_INTEGRITY],
        actions=[U.do("yarn", "prettier:check" if C.CI else "prettier")],
    )

    yield U.ok(
        B.OK_ESLINT,
        name="eslint",
        doc="format and verify .ts, .js files with eslint",
        file_dep=[B.OK_PRETTIER, *L.ALL_ESLINT],
        actions=[U.do("yarn", "eslint:check" if C.CI else "eslint")],
    )

    yield U.ok(
        B.OK_BLACK,
        name="black",
        doc="format python files with black",
        file_dep=L.ALL_BLACK,
        actions=[
            U.do("isort", *L.ALL_BLACK),
            U.do("black", *(["--check"] if C.CI else []), *L.ALL_BLACK),
        ],
    )

    yield U.ok(
        B.OK_PYFLAKES,
        name="pyflakes",
        doc="ensure python code style with pyflakes",
        file_dep=[*L.ALL_BLACK, B.OK_BLACK],
        actions=[U.do("pyflakes", *L.ALL_BLACK)],
    )


def task_build():
    """build code and intermediate packages"""

    # this doesn't appear to be reproducible vs. whatever is on RTD, making flit angry
    if not C.RTD:
        yield dict(
            name="favicon",
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
        name="ui-components",
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
            actions=[U.do("flit", "--debug", "build", cwd=py_pkg)],
            # TODO: get version
            targets=[wheel],
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
        app_targets += [app_build / w.name for w in wheels]
        all_app_targets += app_targets

        yield dict(
            name=f"js:app:{app.name}",
            doc=f"build JupyterLite {app.name.title()} with webpack",
            file_dep=[
                *app_deps,
                *wheels,
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
            P.APP_SCHEMA,
            *P.APP.glob("*/*/index.html"),
            *P.APP.glob("*/build/schemas/**/.json"),
            *P.APP.glob("*.js"),
            *P.APP.glob("*.json"),
            B.META_BUILDINFO,
            P.APP / "index.html",
            P.APP_NPM_IGNORE,
        ],
        actions=[
            (doit.tools.create_folder, [B.DIST]),
            U.do("npm", "pack", "../app", cwd=B.DIST),
        ],
        targets=[B.APP_PACK],
    )

    for py_name, setup_py in P.PY_SETUP_PY.items():
        py_pkg = setup_py.parent
        wheel = (
            py_pkg
            / f"""dist/{py_name.replace("-", "_")}-{D.PY_VERSION}-{C.NOARCH_WHL}"""
        )
        sdist = py_pkg / f"""dist/{py_name.replace("_", "-")}-{D.PY_VERSION}.tar.gz"""

        args = ["python", "setup.py", "sdist", "bdist_wheel"]

        file_dep = [
            *P.PY_SETUP_DEPS[py_name](),
            *py_pkg.rglob("*.py"),
            setup_py,
        ]

        pyproj_toml = py_pkg / "pyproject.toml"

        targets = [wheel, sdist]

        # we might tweak the args
        if pyproj_toml.exists() and "flit" in pyproj_toml.read_text(encoding="utf-8"):
            args = ["flit", "--debug", "build"]
            file_dep += [pyproj_toml]

        # make "the" action
        actions = [U.do(*args, cwd=py_pkg)]

        # may do some setup steps: TODO: refactor into separate task
        if py_name == C.NAME:
            dest = py_pkg / "src" / py_name / B.APP_PACK.name
            actions = [
                lambda: [dest.exists() and dest.unlink(), None][-1],
                lambda: [shutil.copy2(B.APP_PACK, dest), None][-1],
                *actions,
            ]
            file_dep += [B.APP_PACK, pyproj_toml]
            targets += [dest]

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

    dests = []
    for dist in B.DISTRIBUTIONS:
        dest = B.DIST / dist.name
        dests += [dest]
        yield dict(
            name=f"copy:{dist.name}",
            actions=[(U.copy_one, [dist, dest])],
            file_dep=[dist],
            targets=[dest],
        )

    yield dict(
        name="hash",
        file_dep=dests,
        actions=[(U.hashfile, [B.DIST])],
        targets=[B.DIST / "SHA256SUMS"],
    )


def task_dev():
    """setup up local packages for interactive development"""
    py_pkg = P.PY_SETUP_PY[C.NAME].parent

    # TODO: probably name this file
    dest = py_pkg / "src" / C.NAME / B.APP_PACK.name

    yield dict(
        name=f"py:{C.NAME}",
        actions=[U.do("flit", "install", "--pth-file", cwd=py_pkg)],
        file_dep=[dest],
    )


def task_docs():
    """build documentation"""
    yield dict(
        name="typedoc:ensure",
        file_dep=[*P.PACKAGE_JSONS],
        actions=[U.typedoc_conf],
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
        actions=[U.mystify, U.do("yarn", "prettier")],
    )

    yield dict(
        name="app:build",
        doc="use the jupyterlite CLI to (pre-)build the docs app",
        task_dep=[f"dev:py:{C.NAME}"],
        actions=[(U.docs_app, [])],
        file_dep=[
            B.APP_PACK,
            *P.ALL_EXAMPLES,
            # NOTE: these won't always trigger a rebuild because of the inner dodo
            *P.PY_SETUP_PY[C.NAME].rglob("*.py"),
        ],
        targets=[B.DOCS_APP_SHA256SUMS],
    )

    yield dict(
        name="app:pack",
        doc="build the as-deployed app archive",
        file_dep=[B.DOCS_APP_SHA256SUMS],
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


def task_schema():
    """update, validate the schema and instance documents"""
    yield dict(
        name="self", file_dep=[P.APP_SCHEMA], actions=[(U.validate, [P.APP_SCHEMA])]
    )

    for config in D.APP_CONFIGS:
        yield dict(
            name=f"validate:{config.relative_to(P.ROOT)}",
            file_dep=[P.APP_SCHEMA, config],
            actions=[(U.validate, (P.APP_SCHEMA, config))],
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
    yield U.ok(
        B.OK_JEST,
        name="js",
        doc="run the .js, .ts unit tests with jest",
        file_dep=[B.YARN_INTEGRITY, B.META_BUILDINFO],
        actions=[U.do("yarn", "build:test"), U.do("yarn", "test")],
    )

    pytest_args = [
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
                    cwd=setup_py.parent,
                )
            ],
        )


class C:
    NAME = "jupyterlite"
    APPS = ["retro", "lab"]
    NOARCH_WHL = "py3-none-any.whl"
    ENC = dict(encoding="utf-8")
    CI = bool(json.loads(os.environ.get("CI", "0")))
    RTD = bool(json.loads(os.environ.get("READTHEDOCS", "False").lower()))
    PYTEST_ARGS = json.loads(os.environ.get("PYTEST_ARGS", "[]"))
    SPHINX_ARGS = json.loads(os.environ.get("SPHINX_ARGS", "[]"))
    DOCS_ENV_MARKER = "### DOCS ENV ###"
    NO_TYPEDOC = ["_metapackage"]
    LITE_CONFIG_FILES = ["jupyter-lite.json", "jupyter-lite.ipynb"]
    COV_THRESHOLD = 88


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
    ALL_EXAMPLES = [p for p in EXAMPLES.rglob("*") if not p.is_dir()]

    # set later
    PYOLITE_PACKAGES = {}

    APP = ROOT / "app"
    APP_JUPYTERLITE_JSON = APP / "jupyter-lite.json"
    APP_PACKAGE_JSON = APP / "package.json"
    APP_SCHEMA = APP / "jupyterlite.schema.v0.json"
    APP_HTMLS = [APP / "index.html", *APP.glob("*/index.html")]
    WEBPACK_CONFIG = APP / "webpack.config.js"
    APP_JSONS = sorted(APP.glob("*/package.json"))
    APP_NPM_IGNORE = APP / ".npmignore"
    LAB_FAVICON = APP / "lab/favicon.ico"
    LITE_ICON = UI_COMPONENTS_ICONS / "liteIcon.svg"
    LITE_WORDMARK = UI_COMPONENTS_ICONS / "liteWordmark.svg"

    # "real" py packages have a `setup.py`, even if handled by `.toml` or `.cfg`
    PY_SETUP_PY = {p.parent.name: p for p in (ROOT / "py").glob("*/setup.py")}
    PY_SETUP_DEPS = {
        C.NAME: lambda: [B.APP_PACK],
    }

    # docs
    README = ROOT / "README.md"
    CONTRIBUTING = ROOT / "CONTRIBUTING.md"
    CHANGELOG = ROOT / "CHANGELOG.md"
    DOCS = ROOT / "docs"
    DOCS_ICON = DOCS / "_static/icon.svg"
    DOCS_WORDMARK = DOCS / "_static/wordmark.svg"
    EXAMPLE_OVERRIDES = EXAMPLES / "overrides.json"
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
    PY_VERSION = APP["version"].replace("-alpha.", "a")

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
        P.PACKAGE_JSONS, P.APP_JSONS, P.ROOT_PACKAGE_JSON, P.ROOT.glob("*.json")
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

    DOCS_APP = BUILD / "docs-app"
    DOCS_APP_SHA256SUMS = DOCS_APP / "SHA256SUMS"
    DOCS_APP_ARCHIVE = DOCS_APP / f"""jupyterlite-docs-{D.APP_VERSION}.tgz"""

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
    OK_BLACK = OK / "black"
    OK_ESLINT = OK / "eslint"
    OK_JEST = OK / "jest"
    OK_PRETTIER = OK / "prettier"
    OK_PYFLAKES = OK / "pyflakes"
    OK_LITE_PYTEST = OK / "jupyterlite.pytest"
    DISTRIBUTIONS = [
        *P.ROOT.glob("py/*/dist/*.whl"),
        *P.ROOT.glob("py/*/dist/*.tar.gz"),
    ]
    DIST_HASH_INPUTS = sorted([*DISTRIBUTIONS, APP_PACK])


class U:
    @staticmethod
    def do(*args, cwd=P.ROOT, **kwargs):
        """wrap a CmdAction for consistency"""
        cmd = args[0]
        cmd = Path(
            shutil.which(cmd)
            or shutil.which(f"{cmd}.exe")
            or shutil.which(f"{cmd}.cmd")
            or shutil.which(f"{cmd}.bat")
        ).resolve()
        return doit.tools.Interactive([cmd, *args[1:]], shell=False, cwd=str(Path(cwd)))

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
        from_chunks = from_env.read_text(**C.ENC).split(marker)
        to_chunks = to_env.read_text(**C.ENC).split(marker)
        to_env.write_text(
            "".join([to_chunks[0], marker, from_chunks[1], marker, to_chunks[2]]),
            **C.ENC,
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
            P.TYPEDOC_JSON.write_text(
                json.dumps(typedoc, indent=2, sort_keys=True), **C.ENC
            )

        tsconfig = json.loads(P.TSCONFIG_TYPEDOC.read_text(**C.ENC))
        original_references = tsconfig["references"]
        new_references = [
            {"path": f"./packages/{p.parent.name}"}
            for p in P.PACKAGE_JSONS
            if p.parent.name not in C.NO_TYPEDOC
        ]

        if json.dumps(original_references) != json.dumps(new_references):
            tsconfig["references"] = new_references
            P.TSCONFIG_TYPEDOC.write_text(
                json.dumps(tsconfig, indent=2, sort_keys=True), **C.ENC
            )

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
                instance = instance["metadata"]["jupyterlite"]
            label = instance_path.relative_to(P.ROOT)
        errors = [*validator.iter_errors(instance)]
        for error in errors:
            print(f"""{label}#/{"/".join(error.relative_path)}""")
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
                "--files",
                ".",
                "--output-dir",
                B.DOCS_APP,
                "--app-archive",
                B.APP_PACK,
                "--output-archive",
                B.DOCS_APP_ARCHIVE,
            ]
            subprocess.check_call(list(map(str, args)), cwd=str(P.EXAMPLES))

    @staticmethod
    def hashfile(path):
        shasums = path / "SHA256SUMS"
        lines = []

        for p in path.glob("*"):
            if p.name == "SHA256SUMS":
                continue
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
    "default_tasks": ["lint", "schema", "build"],
}
