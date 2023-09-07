import sys

from pathlib import Path
from subprocess import run

import jupyterlab

extra_labextensions_path = str(Path(jupyterlab.__file__).parent / "galata")


run(
    f"{sys.executable} -m jupyterlite build --FederatedExtensionAddon.extra_labextensions_path={extra_labextensions_path}",
    shell=True,
    check=True,
)
