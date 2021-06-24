"""Well-known (and otherwise) constants used by JupyterLite"""
from pathlib import Path

#: a locale for reproducible file sorting
C_LOCALE = "C"

ROOT = Path(__file__).parent

#: all of the archives
ALL_APP_ARCHIVES = sorted(ROOT.glob("jupyterlite-*.tgz"))

#: our baseline archive.
DEFAULT_APP_ARCHIVE = ALL_APP_ARCHIVES[-1]

#: the extension point for addons, including core
ADDON_ENTRYPOINT = "jupyterlite.addon.v0"

### other parties' well-known paths
#: a predictably-serveable HTML file
INDEX_HTML = "index.html"

#: settings overrides. used JupyterLab build system, usually goes in
#: $PREFIX/share/jupyter/lab/
OVERRIDES_JSON = "overrides.json"

#: the generally-used listing of pip requirements
REQUIREMENTS_TXT = "requirements.txt"

#: output equivalent to `sha256sum *` for providing a local bill-of-data
SHA256SUMS = "SHA256SUMS"

#: a script DOM ID on most jupyter pages
JUPYTER_CONFIG_DATA = "jupyter-config-data"
FEDERATED_EXTENSIONS = "federated_extensions"
DISABLED_EXTENSIONS = "disabledExtensions"
SETTINGS_OVERRIDES = "settingsOverrides"

### jupyterlite "well-known" paths

#: our schema
JUPYTERLITE_SCHEMA = "jupyterlite.schema.v0.json"

#: a set of apps we currently know _might_ be in an app archive
JUPYTERLITE_APPS = ["lab", "retro"]
JUPYTERLITE_APPS_REQUIRED = ["lab"]

#: our configuration file
JUPYTERLITE_JSON = "jupyter-lite.json"

#: our configuration file
JUPYTERLITE_IPYNB = "jupyter-lite.ipynb"
JUPYTERLITE_METADATA = "jupyter-lite"

#: Needs a better canonical location
DEFAULT_OUTPUT_DIR = "_output"


#: commonly-used filename for response fixtures, e.g. settings
ALL_JSON = "all.json"

### Environment Variables

#: a canonical environment variable for triggering reproducible builds
SOURCE_DATE_EPOCH = "SOURCE_DATE_EPOCH"

#: this is arrived at by inspection
NPM_SOURCE_DATE_EPOCH = 499162500

### URLs

#: the Jupyter API route for Contents API
API_CONTENTS = "api/contents"
LAB_EXTENSIONS = "lab/extensions"

#: our doit task-based plugin system
HOOKS = [
    "status",
    "init",
    "build",
    "check",
    "serve",
    "archive"
    # TODO: decide how much of publish to take one
    # "publish"
]

#: the name of the previous hook
HOOK_PARENTS = dict(
    build="init",
    check="build",
    serve="build",
    archive="build",
)

#: the lifecycle stages inside a hook
PHASES = ["pre_", "", "post_"]
