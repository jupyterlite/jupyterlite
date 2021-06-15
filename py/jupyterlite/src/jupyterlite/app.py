from pathlib import Path
from traitlets import Instance, default, Unicode

from jupyter_core.application import JupyterApp, base_aliases, base_flags

from . import __version__
from .manager import LiteManager


class BaseApp(JupyterApp):
    """TODO: An undescribed app"""

    version = __version__

    @property
    def description(self):
        return self.__doc__.splitlines()[0].strip()


class ManagedApp(BaseApp):
    lite_manager = Instance(LiteManager)
    lite_dir = Unicode().tag(config=True)

    aliases = dict(**base_aliases, **{"lite-dir": "ManagedApp.lite_dir"})

    @default("lite_manager")
    def _default_manager(self):
        return LiteManager(parent=self, lite_dir=Path(self.lite_dir).resolve())

    def start(self):
        self.lite_manager.initialize()


class StatusApp(ManagedApp):
    """report about what a JupyterLite build _might_ do"""

    def start(self):
        super().start()
        self.lite_manager.status()


class ListApp(ManagedApp):
    """describe a JupyterLite folder"""

    def start(self):
        super().start()
        self.lite_manager.list()


class InitApp(ManagedApp):
    """initialize a JupyterLite folder"""

    def start(self):
        super().start()
        self.lite_manager.init()


class BuildApp(ManagedApp):
    """build a JupyterLite folder"""

    def start(self):
        super().start()
        self.lite_manager.build()


class CheckApp(ManagedApp):
    """verify a JupyterLite folder"""

    def start(self):
        super().start()
        self.lite_manager.check()


class LiteApp(BaseApp):
    """build ready-to-serve JupyterLite sites"""

    name = "lite"

    subcommands = dict(
        status=(StatusApp, ListApp.__doc__.splitlines()[0]),
        list=(ListApp, ListApp.__doc__.splitlines()[0]),
        init=(InitApp, InitApp.__doc__.splitlines()[0]),
        build=(BuildApp, BuildApp.__doc__.splitlines()[0]),
        check=(CheckApp, CheckApp.__doc__.splitlines()[0]),
    )


main = launch_new_instance = LiteApp.launch_instance
