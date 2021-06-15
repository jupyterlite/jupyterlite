from pathlib import Path

from jupyter_core.application import JupyterApp, base_aliases
from traitlets import Instance, Tuple, Unicode, default

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
    lite_dir = Unicode(
        allow_none=True, help=("""The root folder of a JupyterLite project""")
    ).tag(config=True)
    app_archive = Unicode(allow_none=True, help=("""The app archive to use.""")).tag(
        config=True
    )
    output_dir = Unicode(
        allow_none=True, help=("""Where to build the JupyterLite site""")
    ).tag(config=True)
    files = Tuple(allow_none=True).tag(config=True)
    ignore_files = Tuple(
        allow_none=True, help="Path patterns that should never be included"
    ).tag(config=True)
    aliases = dict(
        **base_aliases,
        **{
            "app-archive": "ManagedApp.app_archive",
            "files": "ManagedApp.files",
            "ignore-files": "ManagedApp.ignore_files",
            "lite-dir": "ManagedApp.lite_dir",
            "output-dir": "ManagedApp.output_dir",
            "overrides": "ManagedApp.overrides",
        }
    )
    overrides = Tuple(allow_none=True, help=("Specific overrides.json to include")).tag(
        config=True
    )

    @default("lite_manager")
    def _default_manager(self):
        kwargs = dict(
            parent=self,
        )
        if self.lite_dir:
            kwargs["lite_dir"] = Path(self.lite_dir).resolve()
        if self.app_archive:
            kwargs["app_archive"] = Path(self.app_archive)
        if self.output_dir:
            kwargs["output_dir"] = Path(self.output_dir)
        if self.files:
            kwargs["files"] = [Path(p) for p in self.files]
        if self.ignore_files:
            kwargs["ignore_files"] = self.ignore_files
        if self.overrides:
            kwargs["overrides"] = [Path(p) for p in self.overrides]

        return LiteManager(**kwargs)

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


class ServeApp(ManagedApp):
    """verify a JupyterLite folder"""

    def start(self):
        super().start()
        self.lite_manager.serve()


class LiteApp(BaseApp):
    """build ready-to-serve JupyterLite sites"""

    name = "lite"

    subcommands = dict(
        status=(StatusApp, ListApp.__doc__.splitlines()[0]),
        list=(ListApp, ListApp.__doc__.splitlines()[0]),
        init=(InitApp, InitApp.__doc__.splitlines()[0]),
        build=(BuildApp, BuildApp.__doc__.splitlines()[0]),
        check=(CheckApp, CheckApp.__doc__.splitlines()[0]),
        serve=(ServeApp, ServeApp.__doc__.splitlines()[0]),
    )


main = launch_new_instance = LiteApp.launch_instance
