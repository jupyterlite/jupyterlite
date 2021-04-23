"""A Python kernel backed by Pyodide"""

__version__ = "0.1.0"

from .patches import ensure_matplotlib_patch

# apply patches for available modules
ensure_matplotlib_patch()

from .kernel import Pyolite

kernel_instance = Pyolite()
