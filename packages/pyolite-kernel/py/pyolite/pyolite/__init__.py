"""A Python kernel backed by Pyodide"""

__version__ = "0.1.0a3"

import sys
import types

# Set the recursion limit, needed for altair
# for more details, see: https://github.com/jtpio/jupyterlite/pull/113#issuecomment-851072065
sys.setrecursionlimit(max(170, sys.getrecursionlimit()))

termios_mock = types.ModuleType("termios")
termios_mock.TCSAFLUSH = 2

fcntl_mock = types.ModuleType("fcntl")
resource_mock = types.ModuleType("resource")

sys.modules["termios"] = termios_mock
sys.modules["fcntl"] = fcntl_mock
sys.modules["resource"] = resource_mock

from .patches import ensure_matplotlib_patch, ensure_pil_patch

# apply patches for available modules
ensure_matplotlib_patch()
ensure_pil_patch()

from .display import LiteStream
from .interpreter import LitePythonShellApp

stdout_stream = LiteStream("stdout")
stderr_stream = LiteStream("stderr")

m_ipython_shell_app = LitePythonShellApp()
m_ipython_shell_app.initialize()
m_ipython_shell = m_ipython_shell_app.shell
kernel_instance = m_ipython_shell.kernel

sys.stdout = stdout_stream
sys.stderr = stderr_stream
