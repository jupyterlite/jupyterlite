"""A Python kernel backed by Pyodide"""

__version__ = "0.1.0a0"

import sys
import types

from .patches import ensure_matplotlib_patch

# Set the recursion limit, needed for altair
# for more details, see: https://github.com/jtpio/jupyterlite/pull/113#issuecomment-851072065
sys.setrecursionlimit(max(170, sys.getrecursionlimit()))

# apply patches for available modules
ensure_matplotlib_patch()

import pyolite

from .kernel import Pyolite

kernel_instance = Pyolite()


# TODO: Make an ipython module mock
class IPMock:
    def __init__(self, kernel):
        self.kernel = kernel


class InteractiveShellMock:
    pass


ip_mock = IPMock(kernel_instance)

ip = types.ModuleType("IPython")
ip.get_ipython = lambda: ip_mock
ip.InteractiveShell = InteractiveShellMock

sys.modules["IPython.display"] = pyolite.display
sys.modules["IPython"] = ip
sys.modules["IPython.core.getipython"] = ip
sys.modules["IPython.core.interactiveshell"] = ip
