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
        self._last_traceback = None

    def init_history(self):
        self.history_manager = CustomHistoryManager(shell=self, parent=self)
        self.configurables.append(self.history_manager)

    def enable_gui(self, gui=None):
        """Not implemented yet."""
        pass

    def showtraceback(
        self,
        exc_tuple=None,
        filename=None,
        tb_offset=None,
        exception_only=False,
        running_compiled_code=False,
    ):
        try:
            etype, value, tb = self._get_exc_info(exc_tuple)
        except ValueError:
            print("No traceback available to show.", file=sys.stderr)
            return

        self._last_traceback = {"ename": etype, "evalue": value, "traceback": tb}

    async def run(self, code):
        self._last_traceback = None
        exec_code = self.transform_cell(code)
        await _load_packages_from_imports(exec_code)
        if self.should_run_async(code):
            self.result = await self.run_cell_async(code)
        else:
            self.result = self.run_cell(code)
        return self.result


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
