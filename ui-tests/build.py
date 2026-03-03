import stat
from pathlib import Path
from subprocess import run

import jupyterlab

# Make the readonly notebook read-only before building so the Contents API
# response sets "writable": false for this file.
readonly_notebook = Path(__file__).parent / "contents" / "readonly.ipynb"
readonly_notebook.chmod(stat.S_IRUSR | stat.S_IRGRP | stat.S_IROTH)

extra_labextensions_path = str(Path(jupyterlab.__file__).parent / "galata")
cmd = f"jupyter lite build --FederatedExtensionAddon.extra_labextensions_path={extra_labextensions_path}"

run(
    cmd,
    check=True,
    shell=True,
)
