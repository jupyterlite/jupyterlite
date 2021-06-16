"""the JupyterLite CLI App(s)"""
from pathlib import Path

from jupyter_core.application import JupyterApp, base_aliases
from traitlets import Instance, default

from . import __version__
from .config import LiteBuildConfig
from .manager import LiteManager


class BaseApp(JupyterApp, LiteBuildConfig):
    """TODO: An undescribed app"""

    version = __version__

    # traitlets app stuff
    aliases = dict(
        **base_aliases,
        **{
            "app-archive": "LiteBuildConfig.app_archive",
            "apps": "LiteBuildConfig.apps",
            "files": "LiteBuildConfig.files",
            "ignore-files": "LiteBuildConfig.ignore_files",
            "lite-dir": "LiteBuildConfig.lite_dir",
            "output-dir": "LiteBuildConfig.output_dir",
            "output-archive": "LiteBuildConfig.output_archive",
            "overrides": "LiteBuildConfig.overrides",
        },
    )

    @property
    def description(self):
        return self.__doc__.splitlines()[0].strip()


class ManagedApp(BaseApp):
    lite_manager = Instance(LiteManager)

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
        if self.apps:
            kwargs["apps"] = self.apps
        if self.output_archive:
            kwargs["output_archive"] = Path(self.output_archive)
        if self.disable_addons:
            kwargs["disable_addons"] = self.disable_addons

        return LiteManager(**kwargs)

    def start(self):
        self.lite_manager.initialize()


class DoitApp(ManagedApp):
    _doit_cmd = None

    def start(self):
        super().start()
        self.lite_manager.doit_run(*self._doit_cmd)


class StatusApp(DoitApp):
    """report about what a JupyterLite build _might_ do"""

    _doit_cmd = ["post_status"]


class ListApp(DoitApp):
    """describe a JupyterLite folder"""

    _doit_cmd = ["list", "--all", "--status"]


class InitApp(DoitApp):
    """initialize a JupyterLite folder"""

    _doit_cmd = ["post_init"]


class BuildApp(DoitApp):
    """build a JupyterLite folder"""

    _doit_cmd = ["post_build"]


class CheckApp(DoitApp):
    """verify a JupyterLite folder"""

    _doit_cmd = ["post_check"]


class ServeApp(DoitApp):
    """verify a JupyterLite folder"""

    _doit_cmd = ["post_serve"]


class ArchiveApp(DoitApp):
    """build a JupyterLite app archive"""

    _doit_cmd = ["post_archive"]


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
        archive=(ArchiveApp, ArchiveApp.__doc__.splitlines()[0]),
    )


main = launch_new_instance = LiteApp.launch_instance
