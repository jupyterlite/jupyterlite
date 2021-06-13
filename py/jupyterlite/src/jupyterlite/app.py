from pathlib import Path
from traitlets import Instance, default, Unicode
from tornado import ioloop

from jupyter_core.application import JupyterApp, base_aliases, base_flags

from . import __version__
from .manager import LiteManager


class BaseApp(JupyterApp):
    """An undescribed app"""

    version = __version__

    @property
    def description(self):  # pragma: no cover
        return self.__doc__.splitlines()[0].strip()


class ManagedApp(BaseApp):
    lite_manager = Instance(LiteManager)
    lite_dir = Unicode().tag(config=True)
    io_loop = Instance(ioloop.IOLoop)

    aliases = dict(**base_aliases, **{"lite-dir": "ManagedApp.lite_dir"})

    @default("io_loop")
    def _default_io_loop(self):
        return ioloop.IOLoop.current()

    @default("lite_manager")
    def _default_manager(self):
        return LiteManager(parent=self, lite_dir=Path(self.lite_dir).resolve())

    def start(self):
        self.lite_manager.initialize()
        self.io_loop.add_callback(self.start_async)
        self.io_loop.start()

    def stop(self):
        def _stop():
            self.io_loop.stop()

        self.io_loop.add_callback(_stop)


class InitApp(ManagedApp):
    """initialize a JupyterLite folder"""

    async def start_async(self):
        try:
            await self.lite_manager.init()
        finally:
            self.stop()


class BuildApp(ManagedApp):
    """build a JupyterLite folder"""

    async def start_async(self):
        try:
            await self.lite_manager.build()
        finally:
            self.stop()


class CheckApp(ManagedApp):
    """verify a JupyterLite folder"""

    async def start_async(self):
        self.lite_manager.log.error("TODO: actually check")
        self.stop()
        self.lite_manager.log.error("TODO: stopped checking")


class LiteApp(BaseApp):
    """build ready-to-serve JupyterLite sites"""

    name = "lite"

    subcommands = dict(
        init=(InitApp, InitApp.__doc__.splitlines()[0]),
        build=(BuildApp, BuildApp.__doc__.splitlines()[0]),
        check=(CheckApp, CheckApp.__doc__.splitlines()[0]),
    )


main = launch_new_instance = LiteApp.launch_instance
