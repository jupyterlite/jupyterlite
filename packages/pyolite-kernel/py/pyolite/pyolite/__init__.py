"""A Python kernel backed by Pyodide"""

import sys

# 0. do early mocks that change `sys.modules`
from . import mocks

mocks.apply_mocks()
del mocks

# 1. do expensive patches that require imports
from . import patches

patches.apply_patches()
del patches

from ._version import __version__ as version

# 2. set up the rest of the IPython-like environment
from .display import LiteStream
from .interpreter import LitePythonShellApp

__version__ = version

stdout_stream = LiteStream("stdout")
stderr_stream = LiteStream("stderr")

ipython_shell_app = LitePythonShellApp()
ipython_shell_app.initialize()
ipython_shell = ipython_shell_app.shell
kernel_instance = ipython_shell.kernel

# 3. handle streams
sys.stdout = stdout_stream
sys.stderr = stderr_stream
