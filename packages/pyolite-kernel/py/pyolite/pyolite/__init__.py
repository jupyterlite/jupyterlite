"""A Python kernel backed by Pyodide"""

__version__ = "0.1.0"

import sys
from .patches import ensure_matplotlib_patch

# Set the recursion limit, needed for altair
# for more details, see: https://github.com/jtpio/jupyterlite/pull/113#issuecomment-851072065
sys.setrecursionlimit(max(170, sys.getrecursionlimit()))

# apply patches for available modules
ensure_matplotlib_patch()

from .kernel import Pyolite

kernel_instance = Pyolite()
