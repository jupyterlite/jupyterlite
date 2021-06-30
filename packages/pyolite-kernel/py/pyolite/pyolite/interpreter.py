import sys

from IPython.core.application import BaseIPythonApplication
from IPython.core.history import HistoryManager
from IPython.core.interactiveshell import InteractiveShell
from IPython.core.shellapp import InteractiveShellApp
from pyodide_js import loadPackagesFromImports as _load_packages_from_imports

from .display import XDisplayHook, XDisplayPublisher
from .kernel import Pyolite

__all__ = ["Interpreter"]


class CustomHistoryManager(HistoryManager):
    def __init__(self, shell=None, config=None, **traits):
        self.enabled = False
        super(CustomHistoryManager, self).__init__(shell=shell, config=config, **traits)


class Interpreter(InteractiveShell):
    def __init__(self, *args, **kwargs):
        super(Interpreter, self).__init__(*args, **kwargs)
        self.kernel = Pyolite(interpreter=self)

    def init_history(self):
        self.history_manager = CustomHistoryManager(shell=self, parent=self)
        self.configurables.append(self.history_manager)

    def enable_gui(self, gui=None):
        """Not implemented yet."""
        pass

    async def run(self, code):
        exec_code = self.transform_cell(code)
        await _load_packages_from_imports(exec_code)
        self.result = self.run_cell(code)


class XPythonShellApp(BaseIPythonApplication, InteractiveShellApp):
    def initialize(self, argv=None):
        super(XPythonShellApp, self).initialize(argv)
        self.user_ns = {}
        self.init_path()
        self.init_shell()
        self.init_extensions()
        self.init_code()
        sys.stdout.flush()
        sys.stderr.flush()

    def init_shell(self):
        self.shell = Interpreter.instance(
            displayhook_class=XDisplayHook,
            display_pub_class=XDisplayPublisher,
            user_ns=self.user_ns,
        )

    def exit(self, exit_status=0):
        pass
