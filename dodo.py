import os
import doit
import json
import tempfile
import tarfile
import shutil
from pathlib import Path


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
        file_dep=[B.OK_PRETTIER],
        actions=[U.do("yarn", "eslint:check" if C.CI else "eslint")],
    )

    yield U.ok(
        B.OK_BLACK,
        name="black",
        doc="format python files with black",
        file_dep=L.ALL_BLACK,
        actions=[U.do("black", *(["--check"] if C.CI else []), *L.ALL_BLACK)],
    )


def task_build():
    """build code and intermediate packages"""
    yield dict(
        name="js:lib",
        doc="build .ts files into .js files",
        file_dep=[*L.ALL_TS, P.ROOT_PACKAGE_JSON, *P.PACKAGE_JSONS, B.YARN_INTEGRITY],
        actions=[
            U.do("yarn", "build:lib"),
        ],
        targets=[B.META_BUILDINFO],
    )

    wheels = []

    for py_pkg in P.PYOLITE_PACKAGES:
        name = py_pkg.name
        wheel = py_pkg / f"dist/{name}-0.1.0-py3-none-any.whl"
        wheels += [wheel]
        yield dict(
            name=f"py:{name}",
            doc=f"build the {name} python package for the brower with flit",
            file_dep=[*py_pkg.rglob("*.py"), py_pkg / "pyproject.toml"],
            actions=[U.do("flit", "build", cwd=py_pkg)],
            # TODO: get version
            targets=[wheel],
        )

    app_deps = [B.META_BUILDINFO, P.WEBPACK_CONFIG]
    all_app_wheels = []

    for app_json in P.APP_JSONS:
        app = app_json.parent
        app_data = json.loads(app_json.read_text(**C.ENC))
        app_wheels = [app / f"build/{w.name}" for w in wheels]
        all_app_wheels += app_wheels
        yield dict(
            name=f"js:app:{app.name}",
            doc=f"build JupyterLite {app.name.title()} with webpack",
            file_dep=[*wheels, *app_deps, app_json, app / "index.js"],
            actions=[
                U.do("yarn", "lerna", "run", "build:prod", "--scope", app_data["name"])
            ],
            targets=[app / "build/bundle.js", *app_wheels],
        )

    yield dict(
        name="js:pack",
        doc="build the JupyterLite distribution",
        file_dep=[
            P.APP_NPM_IGNORE,
            B.META_BUILDINFO,
            *P.APP.glob("*/build/bundle.js"),
            *all_app_wheels,
        ],
        actions=[
            (doit.tools.create_folder, [B.DIST]),
            U.do("npm", "pack", "../app", cwd=B.DIST),
        ],
        targets=[B.APP_PACK],
    )


def task_docs():
    """build documentation"""
    yield dict(
        name="sphinx",
        doc="build the documentation site with sphinx",
        file_dep=[*P.DOCS_MD, *P.DOCS_PY, B.APP_PACK],
        actions=[U.do("sphinx-build", "-b", "html", P.DOCS, B.DOCS)],
        targets=[B.DOCS_BUILDINFO],
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
    yield dict(
        name="docs",
        doc="watch .md sources and rebuild the documentation",
        uptodate=[lambda: False],
        file_dep=[*P.DOCS_MD, *P.DOCS_PY, B.APP_PACK],
        actions=[U.do("sphinx-autobuild", P.DOCS, B.DOCS)],
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


class C:
    NAME = "jupyterlite"
    APPS = ["classic", "lab"]
    ENC = dict(encoding="utf-8")
    CI = bool(json.loads(os.environ.get("CI", "0")))
    DOCS_ENV_MARKER = "### DOCS ENV ###"


class P:
    DODO = Path(__file__)
    ROOT = DODO.parent
    PACKAGES = ROOT / "packages"
    PACKAGE_JSONS = [*PACKAGES.glob("*/package.json")]
    ROOT_PACKAGE_JSON = ROOT / "package.json"
    YARN_LOCK = ROOT / "yarn.lock"

    # set later
    PYOLITE_PACKAGES = []

    APP = ROOT / "app"
    APP_PACKAGE_JSON = APP / "package.json"
    WEBPACK_CONFIG = APP / "webpack.config.js"
    APP_JSONS = [*APP.glob("*/package.json")]
    APP_NPM_IGNORE = APP / ".npmignore"

    # docs
    README = ROOT / "README.md"
    CONTRIBUTING = ROOT / "CONTRIBUTING.md"
    CHANGELOG = ROOT / "CHANGELOG.md"
    DOCS = ROOT / "docs"
    DOCS_ENV = DOCS / "environment.yml"
    DOCS_PY = [*DOCS.rglob("*.py")]
    DOCS_MD = [*DOCS.rglob("*.md"), README, CONTRIBUTING, CHANGELOG]

    # demo
    BINDER = ROOT / ".binder"
    BINDER_ENV = BINDER / "environment.yml"

    # CI
    CI = ROOT / ".github"


class D:
    # data
    APP = json.loads(P.APP_PACKAGE_JSON.read_text(**C.ENC))
    PACKAGE_JSONS = {
        p.parent.name: json.loads(p.read_text(**C.ENC)) for p in P.PACKAGE_JSONS
    }


P.PYOLITE_PACKAGES = [
    P.PACKAGES / pkg / pyp
    for pkg, pkg_data in D.PACKAGE_JSONS.items()
    for pyp in pkg_data.get("pyolite", {}).get("packages", [])
]


class L:
    # linting
    ALL_TS = [*P.PACKAGES.rglob("*/src/**/*.js"), *P.PACKAGES.rglob("*/src/**/*.ts")]
    ALL_JSON = [*P.PACKAGE_JSONS, *P.APP_JSONS, P.ROOT_PACKAGE_JSON, *ALL_TS]
    ALL_MD = [*P.CI.rglob("*.md"), *P.DOCS_MD]
    ALL_YAML = [*P.ROOT.glob("*.yml"), *P.BINDER.glob("*.yml"), *P.CI.rglob("*.yml")]
    ALL_PRETTIER = [*ALL_JSON, *ALL_MD, *ALL_YAML]
    ALL_BLACK = [
        *P.DOCS_PY,
        P.DODO,
        *sum([[*p.rglob("*.py")] for p in P.PYOLITE_PACKAGES], []),
    ]


class B:
    # built
    NODE_MODULES = P.ROOT / "node_modules"
    YARN_INTEGRITY = NODE_MODULES / ".yarn-integrity"
    META_BUILDINFO = P.PACKAGES / "_metapackage/tsconfig.tsbuildinfo"

    # built things
    BUILD = P.ROOT / "build"
    DIST = P.ROOT / "dist"
    APP_PACK = DIST / f"""jupyterlite-app-{D.APP["version"]}.tgz"""
    DOCS = P.DOCS / "_build"
    DOCS_HTML = DOCS / "html"
    DOCS_BUILDINFO = DOCS_HTML / ".buildinfo"

    OK = BUILD / "ok"
    OK_PRETTIER = OK / "prettier"
    OK_ESLINT = OK / "eslint"
    OK_BLACK = OK / "black"
    OK_JEST = OK / "jest"


class U:
    @staticmethod
    def do(*args, cwd=P.ROOT, **kwargs):
        """wrap a CmdAction for consistency"""
        return doit.tools.CmdAction(list(args), shell=False, cwd=str(Path(cwd)))

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
    "default_tasks": ["lint", "build"],
}
