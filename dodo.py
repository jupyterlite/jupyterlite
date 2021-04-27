import json
import os
import re
import shutil
from pathlib import Path

import doit
from collections import defaultdict


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
        actions=[U.do("black", *(["--check"] if C.CI else []), *L.ALL_BLACK)],
    )


def task_build():
    """build code and intermediate packages"""
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
        name="sphinx",
        doc="build the documentation site with sphinx",
        file_dep=[B.DOCS_TS_MYST_INDEX, *P.DOCS_MD, *P.DOCS_PY, B.APP_PACK],
        actions=[U.do("sphinx-build", "-b", "html", P.DOCS, B.DOCS)],
        targets=[B.DOCS_BUILDINFO],
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
                "--check-anchors",
                "--check-links-ignore",
                "^https?://",
            )
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
    RTD = bool(json.loads(os.environ.get("READTHEDOCS", "False").lower()))
    DOCS_ENV_MARKER = "### DOCS ENV ###"
    NO_TYPEDOC = ["_metapackage"]


class P:
    DODO = Path(__file__)
    ROOT = DODO.parent
    PACKAGES = ROOT / "packages"
    PACKAGE_JSONS = sorted(PACKAGES.glob("*/package.json"))
    ROOT_PACKAGE_JSON = ROOT / "package.json"
    YARN_LOCK = ROOT / "yarn.lock"

    # set later
    PYOLITE_PACKAGES = []

    APP = ROOT / "app"
    APP_PACKAGE_JSON = APP / "package.json"
    WEBPACK_CONFIG = APP / "webpack.config.js"
    APP_JSONS = sorted(APP.glob("*/package.json"))
    APP_NPM_IGNORE = APP / ".npmignore"

    # docs
    README = ROOT / "README.md"
    CONTRIBUTING = ROOT / "CONTRIBUTING.md"
    CHANGELOG = ROOT / "CHANGELOG.md"
    DOCS = ROOT / "docs"
    TSCONFIG_TYPEDOC = ROOT / "tsconfig.typedoc.json"
    TYPEDOC_JSON = ROOT / "typedoc.json"
    TYPEDOC_CONF = [TSCONFIG_TYPEDOC, TYPEDOC_JSON]
    DOCS_SRC_MD = sorted(
        [p for p in DOCS.rglob("*.md") if "docs/api/ts" not in str(p.as_posix())]
    )
    DOCS_ENV = DOCS / "environment.yml"
    DOCS_PY = sorted([*DOCS.rglob("*.py")])
    DOCS_MD = sorted([*DOCS_SRC_MD, README, CONTRIBUTING, CHANGELOG])

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
    ALL_ESLINT = [
        *P.PACKAGES.rglob("*/src/**/*.js"),
        *P.PACKAGES.rglob("*/src/**/*.ts"),
    ]
    ALL_JSON = set(
        [*P.PACKAGE_JSONS, *P.APP_JSONS, P.ROOT_PACKAGE_JSON, *P.ROOT.glob("*.json")]
    )
    ALL_JS = [*(P.ROOT / "scripts").glob("*.js"), *(P.APP).glob("*/index.js")]
    ALL_MD = [*P.CI.rglob("*.md"), *P.DOCS_MD]
    ALL_YAML = [*P.ROOT.glob("*.yml"), *P.BINDER.glob("*.yml"), *P.CI.rglob("*.yml")]
    ALL_PRETTIER = [*ALL_JSON, *ALL_MD, *ALL_YAML, *ALL_ESLINT, *ALL_JS]
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
    DOCS_BUILDINFO = DOCS / ".buildinfo"

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
    OK_PRETTIER = OK / "prettier"
    OK_ESLINT = OK / "eslint"
    OK_BLACK = OK / "black"
    OK_JEST = OK / "jest"


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
        return doit.tools.CmdAction([cmd, *args[1:]], shell=False, cwd=str(Path(cwd)))

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
                str((p.parent / "src/index.ts").relative_to(P.ROOT).as_posix())
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
