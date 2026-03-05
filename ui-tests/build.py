from pathlib import Path
from subprocess import run

import jupyterlab

extra_labextensions_path = str(Path(jupyterlab.__file__).parent / "galata")

# Build the main UI tests app with content
cmd = f"jupyter lite build --FederatedExtensionAddon.extra_labextensions_path={extra_labextensions_path}"
run(
    cmd,
    check=True,
    shell=True,
)

# Build a no-content version to test for 404 errors
# This build doesn't need Galata extensions since the test uses raw Playwright
no_content_cmd = "jupyter lite build --config=jupyter_lite_config_no_content.json"
run(
    no_content_cmd,
    check=True,
    shell=True,
)
