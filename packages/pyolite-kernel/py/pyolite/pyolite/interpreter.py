import builtins
import getpass
import sys

from IPython.core.application import BaseIPythonApplication
from IPython.core.history import HistoryManager
from IPython.core.interactiveshell import InteractiveShell
from IPython.core.shellapp import InteractiveShellApp

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
        self.Completer.use_jedi = False
        self._last_traceback = None
        self._input = None
        self._getpass = None

    @property
    def input(self):
        return self._input

    @input.setter
    def input(self, value):
        self._input = value
        # self._input is an unhashable JsProxy and can break things
        builtins.input = lambda *args, **kwargs: value(*args, **kwargs)

    @property
    def getpass(self):
        return self._getpass

    @getpass.setter
    def getpass(self, value):
        self._getpass = value
        getpass.getpass = self._getpass

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
