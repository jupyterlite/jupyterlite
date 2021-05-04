"""documentation for jupyterlite"""
import os
import json
import datetime
import re
import subprocess
from pathlib import Path
from sphinx.application import Sphinx

HERE = Path(__file__).parent
ROOT = HERE.parent
APP_PKG = ROOT / "app/package.json"
APP_DATA = json.loads(APP_PKG.read_text(encoding="utf-8"))
RTD = json.loads(os.environ.get("READTHEDOCS", "False").lower())

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
    "try/classic/index": "_static/classic/tree/index",
}

# files
templates_path = ["_templates"]
html_favicon = "../app/lab/favicon.ico"
html_static_path = ["_static", "../app"]
exclude_patterns = [
    ".ipynb_checkpoints",
    "**/.ipynb_checkpoints",
    "**/~.*",
    "**/node_modules",
    "babel.config.*",
    "jest-setup.js",
    "jest.config.js",
    "test/",
    "tsconfig.*",
    "webpack.config.*",
]
html_css_files = [
    "theme.css",
]

# theme
html_theme = "pydata_sphinx_theme"
html_logo = "_static/icon.svg"
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


if RTD:
    subprocess.check_call(
        ["doit", "build", "docs:extensions", "docs:typedoc:mystify"], cwd=str(ROOT)
    )


def clean_schema(app: Sphinx, error):
    if error:
        return
    for schema_html in Path(app.builder.outdir).glob("schema-v*.html"):
        text = schema_html.read_text(encoding="utf-8")
        new_text = re.sub(r'<span id="([^"]*)"></span>', "", text)
        if text != new_text:
            schema_html.write_text(new_text, encoding="utf-8")

    # if RTD:
    #     subprocess.check_call(["doit", "docs:extensions"], cwd=str(ROOT))


def setup(app):
    app.connect("build-finished", clean_schema)
