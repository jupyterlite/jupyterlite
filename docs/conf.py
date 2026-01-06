"""documentation for jupyterlite"""

import json
import os
import sys
from pathlib import Path

os.environ.update(IN_SPHINX="1")

CONF_PY = Path(__file__)
HERE = CONF_PY.parent
ROOT = HERE.parent
APP_PKG = ROOT / "app/package.json"
APP_DATA = json.loads(APP_PKG.read_text(encoding="utf-8"))

# this is _not_ the way
sys.path += [str(ROOT / "py/jupyterlite/src")]

# metadata
author = APP_DATA["author"]
project = author.replace("Contributors", "").strip()
copyright = f"2021-, {author}"

# The full version, including alpha/beta/rc tags
release = APP_DATA["version"]

# The short X.Y version
version = ".".join(release.rsplit(".", 1))

# sphinx config
extensions = [
    # first-party sphinx extensions
    "sphinx.ext.todo",
    "sphinx.ext.autosectionlabel",
    # for routing
    "sphinxext.rediraffe",
    # for pretty schema
    "sphinx-jsonschema",
    # mostly markdown (some ipynb)
    "myst_nb",
    # autodoc-related stuff must be in order
    "sphinx.ext.autodoc",
    "sphinx.ext.napoleon",
    "sphinx_autodoc_typehints",
    "sphinxcontrib.mermaid",
]

autosectionlabel_prefix_document = True
myst_heading_anchors = 3
suppress_warnings = ["autosectionlabel.*"]

rediraffe_redirects = {
    "try/index": "_static/index",
    "try/lab/index": "_static/lab/index",
    "try/tree/index": "_static/tree/index",
    "try/repl/index": "_static/repl/index",
}

# files
templates_path = ["_templates"]
html_favicon = "../app/lab/favicon.ico"
# rely on the order of these to patch json, labextensions correctly
html_static_path = [
    # docs stuff
    "_static",
    # as-built assets for testing "hot" downstreams against a PR without rebuilding
    "../dist",
    # as-built application, extensions, contents, and patched jupyter-lite.json
    "../build/docs-app",
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
    ".jupyter_cache",
    "test/",
    "tsconfig.*",
    "rspack.config.*",
]
nb_execution_mode = "auto"

nb_execution_excludepatterns = [
    "_static/**/*",
]
html_css_files = [
    "theme.css",
]

# theme
html_theme = "pydata_sphinx_theme"
html_logo = "_static/wordmark.svg"
html_theme_options = {
    "github_url": APP_DATA["homepage"],
    "use_edit_page_button": True,
    "navbar_start": ["navbar-logo", "version-switcher"],
    "icon_links": [
        {
            "name": "PyPI",
            "url": "https://pypi.org/project/jupyterlite",
            "icon": "fa-solid fa-box",
        },
    ],
    "pygments_light_style": "github-light",
    "pygments_dark_style": "github-dark",
    "logo": {
        "alt_text": "JupyterLite",
        "image_light": "_static/wordmark.svg",
        "image_dark": "_static/wordmark-dark.svg",
    },
    "switcher": {
        "json_url": "/".join(
            ("https://jupyterlite.readthedocs.io/en", "latest", "_static/switcher.json")
        ),
        "version_match": os.environ.get("READTHEDOCS_VERSION", "latest"),
    },
    "check_switcher": False,
    "navigation_with_keys": False,
}

html_context = {
    "github_user": "jupyterlite",
    "github_repo": "jupyterlite",
    "github_version": "main",
    "doc_path": "docs",
}


def setup(app):
    # Enable Plausible.io stats
    app.add_js_file("https://plausible.io/js/pa-eNfnVmf5sGWJaB1mfLZJF.js", loading_method="async")
    app.add_js_file(
        filename=None,
        body="window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init({hashBasedRouting:true})",
    )
