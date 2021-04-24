import os
import doit
import json
import tempfile
import tarfile
import shutil
from pathlib import Path


def task_setup():
    yield dict(
        name="js",
        file_dep=[P.YARN_LOCK, *P.PACKAGE_JSONS, P.ROOT_PACKAGE_JSON],
        actions=[U.do("jlpm", "--prefer-offline", "--ignore-optional")],
        targets=[B.YARN_INTEGRITY],
    )


def task_lint():
    yield U.ok(
        B.OK_PRETTIER,
        name="prettier",
        file_dep=[*L.ALL_PRETTIER, B.YARN_INTEGRITY],
        actions=[U.do("jlpm", "prettier")],
    )

    yield U.ok(
        B.OK_ESLINT,
        name="eslint",
        file_dep=[B.OK_PRETTIER],
        actions=[U.do("jlpm", "eslint")],
    )

    yield U.ok(
        B.OK_BLACK,
        name="black",
        file_dep=L.ALL_BLACK,
        actions=[U.do("black", *L.ALL_BLACK)],
    )


def task_build():
    yield dict(
        name="js:lib",
        file_dep=[*L.ALL_TS, P.ROOT_PACKAGE_JSON, *P.PACKAGE_JSONS, B.YARN_INTEGRITY],
        actions=[
            U.do("jlpm", "build:lib"),
        ],
        targets=[B.META_BUILDINFO],
    )

    for py_pkg in P.PYOLITE_PACKAGES:
        yield dict(
            name=f"py:{py_pkg.parent.name}",
            file_dep=[*py_pkg.rglob("*.py")],
            actions=[
                doit.tools.CmdAction(["flit", "build"], shell=False, cwd=py_pkg)
            ]
        )

    for app_json in P.APP_JSONS:
        app = app_json.parent
        app_data = json.loads(app_json.read_text(**C.ENC))
        yield dict(
            name=f"js:app:{app.name}",
            file_dep=[B.META_BUILDINFO, app_json, P.WEBPACK_CONFIG, app / "index.js"],
            actions=[
                U.do("yarn", "lerna", "run", "build:prod", "--scope", app_data["name"])
            ],
            targets=[app / "build/bundle.js"],
        )

    yield dict(
        name="js:pack",
        file_dep=[B.META_BUILDINFO, *P.APP.glob("*/build/bundle.js")],
        actions=[
            (doit.tools.create_folder, [B.DIST]),
            U.do("npm", "pack", "../app", cwd=B.DIST),
        ],
        targets=[B.APP_PACK],
    )


class C:
    NAME = "jupyterlite"
    APPS = ["classic", "lab"]
    ENC = dict(encoding="utf-8")


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

    # docs
    README = ROOT / "README.md"
    CONTRIBUTING = ROOT / "CONTRIBUTING.md"

    # demo
    BINDER = ROOT / ".binder"

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
    ALL_MD = [P.CONTRIBUTING, P.README, *P.CI.rglob("*.md")]
    ALL_YAML = [*P.BINDER.glob("*.yml"), *P.CI.rglob("*.yml")]
    ALL_PRETTIER = [*ALL_JSON, *ALL_MD, *ALL_YAML]
    ALL_BLACK = [P.DODO, *sum([[*p.rglob("*.py")] for p in P.PYOLITE_PACKAGES], [])]


class B:
    # built
    NODE_MODULES = P.ROOT / "node_modules"
    YARN_INTEGRITY = NODE_MODULES / ".yarn-integrity"
    META_BUILDINFO = P.PACKAGES / "_metapackage/tsconfig.tsbuildinfo"

    # built things
    BUILD = P.ROOT / "build"
    DIST = P.ROOT / "dist"
    APP_PACK = DIST / f"""jupyterlite-app-{D.APP["version"]}.tgz"""

    OK = BUILD / "ok"
    OK_PRETTIER = OK / "prettier"
    OK_ESLINT = OK / "eslint"
    OK_BLACK = OK / "black"
    OK_PIP_E = OK / "pip-e"


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
