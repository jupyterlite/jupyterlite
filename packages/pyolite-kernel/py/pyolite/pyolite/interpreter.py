import sys

from IPython.core.application import BaseIPythonApplication
from IPython.core.history import HistoryManager
from IPython.core.interactiveshell import InteractiveShell
from IPython.core.shellapp import InteractiveShellApp
from IPython.utils.tokenutil import line_at_cursor
from pyodide_js import loadPackagesFromImports as _load_packages_from_imports

from .display import LiteDisplayHook, LiteDisplayPublisher
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

    def _showtraceback(self, etype, evalue, stb):
        self._last_traceback = {
            "ename": str(etype),
            "evalue": str(evalue),
            "traceback": stb,
        }

    def do_complete(self, code, cursor_pos):
        if cursor_pos is None:
            cursor_pos = len(code)
        line, offset = line_at_cursor(code, cursor_pos)
        line_cursor = cursor_pos - offset

        txt, matches = self.complete("", line, line_cursor)
        return {
            "matches": matches,
            "cursor_end": cursor_pos,
            "cursor_start": cursor_pos - len(txt),
            "metadata": {},
            "status": "ok",
        }

    async def run(self, code):
        self._last_traceback = None
        exec_code = self.transform_cell(code)
        await _load_packages_from_imports(exec_code)
        if self.should_run_async(code):
            self.result = await self.run_cell_async(code, store_history=True)
        else:
            self.result = self.run_cell(code, store_history=True)
        return self.result


class LitePythonShellApp(BaseIPythonApplication, InteractiveShellApp):
    def initialize(self, argv=None):
        super(LitePythonShellApp, self).initialize(argv)
        self.user_ns = {}
        self.init_path()
        self.init_shell()
        self.init_extensions()
        self.init_code()
        sys.stdout.flush()
        sys.stderr.flush()

    def init_shell(self):
        self.shell = Interpreter.instance(
            displayhook_class=LiteDisplayHook,
            display_pub_class=LiteDisplayPublisher,
            user_ns=self.user_ns,
        )

    def exit(self, exit_status=0):
        pass
