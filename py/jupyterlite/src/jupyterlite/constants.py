"""Well-known (and otherwise) constants used by JupyterLite"""
import shutil
from pathlib import Path

#: a locale for reproducible file sorting
C_LOCALE = "C"

#: the encoding for pretty much every file written and read by jupyterlite
UTF8 = dict(encoding="utf-8")
JSON_FMT = dict(sort_keys=True, indent=2)
ROOT = Path(__file__).parent

#: all of the archives
ALL_APP_ARCHIVES = sorted(ROOT.glob("jupyterlite-*.tgz"))

#: the extension point for addons, including core
ADDON_ENTRYPOINT = "jupyterlite.addon.v0"

### other parties' well-known paths
#: a predictably-serveable HTML file
INDEX_HTML = "index.html"

#: settings overrides. used JupyterLab build system, usually goes in
#: $PREFIX/share/jupyter/lab/
OVERRIDES_JSON = "overrides.json"

#: the canonical location within an env (or archive) for labextensions
SHARE_LABEXTENSIONS = "share/jupyter/labextensions"

#: the canonical location of labextension metadata
PACKAGE_JSON = "package.json"

#: the generally-used listing of pip requirements
REQUIREMENTS_TXT = "requirements.txt"

#: output equivalent to `sha256sum *` for providing a local bill-of-data
SHA256SUMS = "SHA256SUMS"

#: a script DOM ID on most jupyter pages
JUPYTER_CONFIG_DATA = "jupyter-config-data"
FEDERATED_EXTENSIONS = "federated_extensions"
DISABLED_EXTENSIONS = "disabledExtensions"
SETTINGS_OVERRIDES = "settingsOverrides"

#: the top-level key for lite plugin settings
LITE_PLUGIN_SETTINGS = "litePluginSettings"

#: the plugin id for the pyolite kernel
PYOLITE_PLUGIN_ID = "@jupyterlite/pyolite-kernel-extension:kernel"

### jupyterlite "well-known" paths

#: our schema
JUPYTERLITE_SCHEMA = "jupyterlite.schema.v0.json"

#: our configuration file
JUPYTERLITE_JSON = "jupyter-lite.json"

#: our configuration file
JUPYTERLITE_IPYNB = "jupyter-lite.ipynb"
JUPYTERLITE_METADATA = "jupyter-lite"
JUPYTER_LITE_CONFIG = "jupyter_lite_config.json"

#: Needs a better canonical location
DEFAULT_OUTPUT_DIR = "_output"


#: commonly-used filename for response fixtures, e.g. settings
ALL_JSON = "all.json"

### Environment Variables

#: a canonical environment variable for triggering reproducible builds
SOURCE_DATE_EPOCH = "SOURCE_DATE_EPOCH"

#: this is arrived at by inspection
NPM_SOURCE_DATE_EPOCH = 499162500

#: the only kind of noarch wheel piplite understands
NOARCH_WHL = "py3-none-any.whl"

#: the only kind of binary wheel piplite understands
WASM_WHL = "emscripten_wasm32.whl"

#: the only kinds of wheels piplite understands
ALL_WHL = [NOARCH_WHL, WASM_WHL]

### URLs

#: the Jupyter API route for Contents API
API_CONTENTS = "api/contents"
API_TRANSLATIONS = "api/translations"
LAB_EXTENSIONS = "extensions"

#: our doit task-based plugin system
HOOKS = [
    "status",
    "init",
    "build",
    "check",
    "serve",
    "archive",
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


#: extensions to be considered sourcemaps
SOURCEMAPS = [".js.map", ".mjs.map"]
SOURCEMAP_IGNORE_PATTERNS = shutil.ignore_patterns(*[f"*{p}" for p in SOURCEMAPS])
