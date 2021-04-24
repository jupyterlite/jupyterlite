import os
import doit
import json
import tempfile
import tarfile
import shutil
from pathlib import Path

os.environ.update(
    NODE_OPTS="--max-old-space-size=4096",
    PYTHONIOENCODING="utf-8",
    PIP_DISABLE_PIP_VERSION_CHECK="1",
    MAMBA_NO_BANNER="1",
)

DOIT_CONFIG = {
    "backend": "sqlite3",
    "verbosity": 2,
    "par_type": "thread",
    "default_tasks": ["lint", "build"],
}


def task_setup():
    yield dict(
        name="js",
        file_dep=[P.YARN_LOCK, *P.PACKAGE_JSONS, P.ROOT_PACKAGE_JSON],
        actions=[U.do("jlpm", "--prefer-offline", "--ignore-optional")],
        targets=[P.YARN_INTEGRITY],
    )


def task_lint():
    yield U.ok(
        B.OK_PRETTIER,
        name="prettier",
        file_dep=[*P.ALL_PRETTIER, P.YARN_INTEGRITY],
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
        file_dep=P.ALL_BLACK,
        actions=[U.do("black", *P.ALL_BLACK)],
    )


def task_build():
    yield dict(
        name="js:lib",
        file_dep=[*P.ALL_TS, P.ROOT_PACKAGE_JSON, *P.PACKAGE_JSONS, P.YARN_INTEGRITY],
        actions=[
            U.do("jlpm", "build:lib"),
        ],
        targets=[P.META_BUILDINFO],
    )

    for app_json in P.APP_JSONS:
        app = app_json.parent
        app_data = json.loads(app_json.read_text(encoding="utf-8"))
        yield dict(
            name=f"js:app:{app.name}",
            file_dep=[P.META_BUILDINFO, app_json, P.WEBPACK_CONFIG, app / "index.js"],
            actions=[
                U.do("yarn", "lerna", "run", "build:prod", "--scope", app_data["name"])
            ],
            targets=[app / "build/bundle.js"],
        )

    yield dict(
        name="js:pack",
        file_dep=[P.META_BUILDINFO, *P.APP.glob("*/build/bundle.js")],
        actions=[
            (doit.tools.create_folder, [B.DIST]),
            U.do("npm", "pack", "../app", cwd=B.DIST),
        ],
        targets=[B.APP_PACK],
    )


class C:
    NAME = "jupyterlite"
    APPS = ["classic", "lab"]


class P:
    DODO = Path(__file__)
    ROOT = DODO.parent
    PACKAGES = ROOT / "packages"
    PACKAGE_JSONS = [*PACKAGES.glob("*/package.json")]
    ROOT_PACKAGE_JSON = ROOT / "package.json"
    YARN_LOCK = ROOT / "yarn.lock"

    PY_SRC = ROOT / "src/jupyterlite"

    APP = ROOT / "app"
    APP_PACKAGE_JSON = APP / "package.json"
    WEBPACK_CONFIG = APP / "webpack.config.js"
    APP_JSONS = [*APP.glob("*/package.json"), APP_PACKAGE_JSON]

    # deploy
    STATIC = PY_SRC / "static"
    STATIC_INDEX = STATIC / "index.html"

    # built
    NODE_MODULES = ROOT / "node_modules"
    YARN_INTEGRITY = NODE_MODULES / ".yarn-integrity"
    META_BUILDINFO = PACKAGES / "_metapackage/tsconfig.tsbuildinfo"

    # linting
    ALL_TS = [*PACKAGES.rglob("*/src/**/*.js"), *PACKAGES.rglob("*/src/**/*.ts")]
    ALL_JSON = [*PACKAGE_JSONS, *APP_JSONS, ROOT_PACKAGE_JSON, *ALL_TS]
    ALL_PRETTIER = [*ALL_JSON]
    ALL_BLACK = [DODO]


class D:
    # DATA
    APP = json.loads(P.APP_PACKAGE_JSON.read_text(encoding="utf-8"))


class B:
    # built things
    BUILD = P.ROOT / "build"
    DIST = P.ROOT / "dist"
    BUNDLES_JS = [P.STATIC / app / "build/bundle.js" for app in C.APPS]
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
