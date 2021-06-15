from pathlib import Path

ROOT = Path(__file__).parent
DEFAULT_APP_ARCHIVE = next(ROOT.glob("jupyterlite-app-*.tgz"))

# the extension point for addons, including core
ADDON_ENTRYPOINT = "jupyterlite.addon.v0"

### other parties' well-known paths
# a predictably-serveable HTML file
INDEX_HTML = "index.html"

# settings overrides. used JupyterLab build system, usually goes in
# $PREFIX/share/jupyter/lab/
OVERRIDES_JSON = "overrides.json"

# the generally-used listing of pip requirements
REQUIREMENTS_TXT = "requirements.txt"

# output equivalent to `sha256sum *` for providing a local bill-of-data
SHA256SUMS = "SHA256SUMS"

### jupyterlite "well-known" paths

# similar to `.binder`, this signals a minimum build environment with predictable names
JUPYTERLITE_PATH = ".jupyter-lite"

# our schema
JUPYTERLITE_SCHEMA = "jupyterlite.schema.v0.json"

# our configuration file
JUPYTERLITE_JSON = "jupyter-lite.json"
# TODO: the notebook opinions

# Needs a better canonical location
DEFAULT_OUTPUT_DIR = "_output"


# commonly-used filename for response fixtures, e.g. settings
ALL_JSON = "all.json"

### URLs

# the Jupyter API route for Contents API
API_CONTENTS = "api/contents"
LAB_EXTENSIONS = "lab/extensions"
