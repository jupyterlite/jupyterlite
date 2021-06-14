import json
import os
import re
import shutil
import subprocess
from pathlib import Path
import jsonschema
import sys
import textwrap

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
        wheel = py_pkg / f"dist/{name}-{version}-py3-none-any.whl"
        wheels += [wheel]
        yield dict(
            name=f"py:{name}",
            doc=f"build the {name} python package for the brower with flit",
            file_dep=[*py_pkg.rglob("*.py"), py_pkg / "pyproject.toml"],
            actions=[U.do("flit", "build", cwd=py_pkg)],
            # TODO: get version
            targets=[wheel],
        )

    app_deps = [B.META_BUILDINFO, P.WEBPACK_CONFIG, P.LITE_ICON, P.LITE_WORDMARK]
    all_app_wheels = []

    for app_json in P.APP_JSONS:
        app = app_json.parent
        app_data = json.loads(app_json.read_text(**C.ENC))
        app_wheels = [app / f"build/{w.name}" for w in wheels]
        all_app_wheels += app_wheels
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
            targets=[app / "build/bundle.js", *app_wheels],
        )

    yield dict(
        name="js:pack",
        doc="build the JupyterLite distribution",
        file_dep=[
            *all_app_wheels,
            *P.APP.glob("*/*/index.html"),
            *P.APP.glob("*/build/bundle.js"),
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
        name="extensions",
        doc="cache extensions from share/jupyter/labextensions",
        actions=[U.extend_docs],
        file_dep=[P.APP_JUPYTERLITE_JSON, P.DOCS_OVERRIDES],
        targets=[B.PATCHED_JUPYTERLITE_JSON],
    )

    yield dict(
        name="sphinx",
        doc="build the documentation site with sphinx",
        file_dep=[
            B.DOCS_TS_MYST_INDEX,
            *P.DOCS_MD,
            *P.DOCS_PY,
            B.APP_PACK,
            B.PATCHED_JUPYTERLITE_JSON,
        ],
        actions=[U.do("sphinx-build", "-j8", "-b", "html", P.DOCS, B.DOCS)],
        targets=[B.DOCS_BUILDINFO],
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

    config = json.loads(B.PATCHED_JUPYTERLITE_JSON.read_text(**C.ENC))
    overrides = config.get("jupyter-config-data", {}).get("settingsOverrides", {})
    for plugin_id, defaults in overrides.items():
        ext, plugin = plugin_id.split(":")
        schema_file = B.DOCS_LAB_EXTENSIONS / ext / "schemas" / ext / f"{plugin}.json"
        if not schema_file.exists():
            # this is probably in all.json
            continue
        yield dict(
            name=f"overrides:{plugin_id}",
            file_dep=[B.PATCHED_JUPYTERLITE_JSON, schema_file],
            actions=[(U.validate, [schema_file, None, defaults])],
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
            actions=[U.do("sphinx-autobuild", "-a", "-j8", P.DOCS, B.DOCS)],
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
    APPS = ["retro", "lab"]
    ENC = dict(encoding="utf-8")
    CI = bool(json.loads(os.environ.get("CI", "0")))
    RTD = bool(json.loads(os.environ.get("READTHEDOCS", "False").lower()))
    DOCS_ENV_MARKER = "### DOCS ENV ###"
    NO_TYPEDOC = ["_metapackage"]
    LITE_CONFIG_FILES = ["jupyter-lite.json", "jupyter-lite.ipynb"]
    DOCS_DISABLED_EXT = [
        "nbdime-jupyterlab",
        "@jupyterlab/server-proxy",
        "jupyterlab-server-proxy",
    ]


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

    # docs
    README = ROOT / "README.md"
    CONTRIBUTING = ROOT / "CONTRIBUTING.md"
    CHANGELOG = ROOT / "CHANGELOG.md"
    DOCS = ROOT / "docs"
    DOCS_ICON = DOCS / "_static/icon.svg"
    DOCS_WORDMARK = DOCS / "_static/wordmark.svg"
    DOCS_OVERRIDES = DOCS / "overrides.json"
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
        if isinstance(pg, Path):
            paths = [pg]
        else:
            paths = sorted(pg)
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
    APP_PACK = DIST / f"""jupyterlite-app-{D.APP["version"]}.tgz"""
    DOCS = Path(os.environ.get("JLITE_DOCS_OUT", P.DOCS / "_build"))
    DOCS_BUILDINFO = DOCS / ".buildinfo"
    DOCS_JUPYTERLITE_JSON = DOCS / "_static/jupyter-lite.json"
    DOCS_LAB_EXTENSIONS = DOCS / "_static/lab/extensions"

    PATCHED_STATIC = BUILD / "env-extensions"
    CACHED_LAB_EXTENSIONS = PATCHED_STATIC / "lab/extensions"
    PATCHED_JUPYTERLITE_JSON = PATCHED_STATIC / "jupyter-lite.json"

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
    def extend_docs():
        """before sphinx ensure a build directory of the lab extensions/themes and patch JSON"""
        if B.PATCHED_STATIC.exists():
            print(f"... Cleaning {B.PATCHED_STATIC}...")
            shutil.rmtree(B.PATCHED_STATIC)

        B.PATCHED_STATIC.mkdir(parents=True)

        print(f"... Copying {P.ENV_EXTENSIONS} to {B.CACHED_LAB_EXTENSIONS}...")
        shutil.copytree(P.ENV_EXTENSIONS, B.CACHED_LAB_EXTENSIONS)

        extensions = []
        all_package_json = [
            *B.CACHED_LAB_EXTENSIONS.glob("*/package.json"),
            *B.CACHED_LAB_EXTENSIONS.glob("@*/*/package.json"),
        ]
        # we might find themes
        app_themes = [
            B.PATCHED_STATIC / f"{app}/build/themes" for app in ["lab", "retro"]
        ]

        for pkg_json in all_package_json:
            print(
                f"... adding {pkg_json.parent.relative_to(B.CACHED_LAB_EXTENSIONS)}..."
            )
            pkg_data = json.loads(pkg_json.read_text(**C.ENC))
            extensions += [
                dict(name=pkg_data["name"], **pkg_data["jupyterlab"]["_build"])
            ]
            for app_theme in app_themes:
                for theme in pkg_json.parent.glob("themes/*"):
                    print(
                        f"... copying theme {theme.relative_to(B.CACHED_LAB_EXTENSIONS)}"
                    )

                    if not app_theme.exists():
                        app_theme.mkdir(parents=True)
                    print(f"... ... to {app_theme}")
                    shutil.copytree(theme, app_theme / theme.name)

        print(f"... Patching {P.APP_JUPYTERLITE_JSON}...")
        config = json.loads(P.APP_JUPYTERLITE_JSON.read_text(**C.ENC))
        print(f"... ... {len(extensions)} federated extensions...")
        config["jupyter-config-data"]["federated_extensions"] = extensions

        # add settings from `overrides.json`
        overrides = json.loads(P.DOCS_OVERRIDES.read_text(**C.ENC))
        print(f"... ... {len(overrides.keys())} settings overrides")
        config["jupyter-config-data"]["settingsOverrides"] = overrides

        # disable some extensions
        config["jupyter-config-data"].setdefault("disabledExtensions", []).extend(
            C.DOCS_DISABLED_EXT
        )

        print(f"... writing {B.PATCHED_JUPYTERLITE_JSON}")
        B.PATCHED_JUPYTERLITE_JSON.write_text(
            textwrap.indent(json.dumps(config, indent=2, sort_keys=True), " " * 4)
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
    "default_tasks": ["lint", "schema", "build"],
}
