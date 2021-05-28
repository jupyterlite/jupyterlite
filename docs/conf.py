"""documentation for jupyterlite"""
import os
import json
import datetime
import re
import shutil
import subprocess
from jupyter_server.services.contents.filemanager import FileContentsManager
from pathlib import Path
from sphinx.application import Sphinx


HERE = Path(__file__).parent
ROOT = HERE.parent
APP_PKG = ROOT / "app/package.json"
APP_DATA = json.loads(APP_PKG.read_text(encoding="utf-8"))
RTD = json.loads(os.environ.get("READTHEDOCS", "False").lower())
EXAMPLE_FILES = [
    ROOT / "README.md",
    ROOT / "docs/_static/icon.svg",
    ROOT / "app/jupyter-lite.json",
    ROOT / "app/jupyterlite.schema.v0.json",
    *[
        example
        for example in (ROOT / "examples").rglob("*.*")
        if not ".ipynb_checkpoints" in str(example)
        and "__pycache__" not in str(example)
    ],
]

# metadata
author = APP_DATA["author"]
project = author.replace("Contributors", "").strip()
copyright = f"{datetime.date.today().year}, {author}"

# The full version, including alpha/beta/rc tags
release = APP_DATA["version"]

# The short X.Y version
version = ".".join(release.rsplit(".", 1))

# sphinx config
extensions = [
    "sphinx.ext.autosectionlabel",
    "sphinxext.rediraffe",
    "sphinx.ext.autodoc",
    "sphinx-jsonschema",
    "myst_nb",
]

autosectionlabel_prefix_document = True
myst_heading_anchors = 3
suppress_warnings = ["autosectionlabel.*"]

rediraffe_redirects = {
    "try/index": "_static/index",
    "try/lab/index": "_static/lab/index",
    "try/retro/index": "_static/retro/tree/index",
}

# files
templates_path = ["_templates"]
html_favicon = "../app/lab/favicon.ico"
# rely on the order of these to patch json, labextensions correctly
html_static_path = [
    # docs stuff
    "_static",
    # the as-built application
    "../app",
    # extensions and patched jupyter-lite.json
    "../build/env-extensions",
]
exclude_patterns = [
    "_build",
    ".ipynb_checkpoints",
    "**/.ipynb_checkpoints",
    "**/~.*",
    "**/node_modules",
    "babel.config.*",
    "jest-setup.js",
    "jest.config.js",
    "jupyter_execute",
    "test/",
    "tsconfig.*",
    "webpack.config.*",
]
execution_excludepatterns = ["_static/**/*"]
html_css_files = [
    "theme.css",
]

# theme
html_theme = "pydata_sphinx_theme"
html_logo = "_static/wordmark.svg"
html_theme_options = {
    "github_url": APP_DATA["homepage"],
    "use_edit_page_button": True,
    "navbar_start": ["launch.html"],
    "navbar_center": ["navbar-logo.html", "navbar-nav.html"],
}

html_context = {
    "github_user": "jtpio",
    "github_repo": "jupyterlite",
    "github_version": "main",
    "doc_path": "docs",
}


def after_build(app: Sphinx, error):
    """sphinx-jsonschema makes duplicate ids. clean them"""
    print("jupyterlite: Cleaning generated ids in JSON schema html...", flush=True)
    outdir = Path(app.builder.outdir)
    for schema_html in outdir.glob("schema-v*.html"):
        print(f"... fixing: {schema_html.relative_to(outdir)}")
        text = schema_html.read_text(encoding="utf-8")
        new_text = re.sub(r'<span id="([^"]*)"></span>', "", text)
        if text != new_text:
            schema_html.write_text(new_text, encoding="utf-8")

    files_dir = outdir / "_static/files"
    print("Copying files to", files_dir)
    files_dir.mkdir(parents=True, exist_ok=True)

    class DateTimeEncoder(json.JSONEncoder):
        def default(self, o):
            if isinstance(o, datetime.datetime):
                return o.isoformat()

            return json.JSONEncoder.default(self, o)

    # all relative to ROOT
    for example_file in EXAMPLE_FILES:
        example_path = str(example_file.relative_to(ROOT))
        dest = files_dir / example_path
        dest.parent.mkdir(parents=True, exist_ok=True)
        print(f"... writing  /files/{example_path}")
        shutil.copy2(ROOT / example_path, dest)

    fm = FileContentsManager(root_dir=str(files_dir))

    for file_dir in [files_dir, *files_dir.rglob("*")]:
        if not file_dir.is_dir():
            continue
        all_json = (
            outdir
            / "_static/api/contents"
            / file_dir.relative_to(files_dir)
            / "all.json"
        )
        all_json.parent.mkdir(parents=True, exist_ok=True)
        listing_path = str(file_dir.relative_to(files_dir).as_posix())
        if listing_path.startswith("."):
            listing_path = listing_path[1:]
        print(f"... indexing /api/contents/{listing_path}")
        all_json.write_text(
            json.dumps(
                fm.get(listing_path), indent=2, sort_keys=True, cls=DateTimeEncoder
            ),
            encoding="utf-8",
        )


def before_rtd_build(app: Sphinx, error):
    """this performs the full frontend build, and ensures the typedoc"""
    print("jupyterlite: Ensuring built application...", flush=True)
    subprocess.check_call(
        ["doit", "-n4", "build", "docs:typedoc:mystify", "docs:extensions"],
        cwd=str(ROOT),
    )


def setup(app):
    app.connect("build-finished", after_build)
    if RTD:
        app.connect("config-inited", before_rtd_build)
