"""documentation for jupyterlite"""
import os
import json
import datetime
from pathlib import Path

HERE = Path(__file__).parent
ROOT = HERE.parent
APP_PKG = ROOT / "app/package.json"
APP_DATA = json.loads(APP_PKG.read_text(encoding="utf-8"))

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
    "myst_nb",
]

autosectionlabel_prefix_document = True
myst_heading_anchors = 3
suppress_warnings = ["autosectionlabel.*"]

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


if os.environ.get("READTHEDOCS"):
    import subprocess

    subprocess.check_call(["doit", "build", "docs:typedoc:mystify"], cwd=str(ROOT))
