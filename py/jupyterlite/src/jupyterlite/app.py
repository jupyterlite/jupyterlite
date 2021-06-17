"""the JupyterLite CLI App(s)"""
from pathlib import Path

from jupyter_core.application import JupyterApp, base_aliases, base_flags
from traitlets import Bool, Instance, default

from . import __version__
from .config import LiteBuildConfig
from .constants import PHASES
from .manager import LiteManager


class BaseLiteApp(JupyterApp, LiteBuildConfig):
    """TODO: An undescribed app"""

    version = __version__

    force = Bool(
        False, help="forget previous runs of task and re-run from the beginning"
    ).tag(config=True)

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

    flags = dict(
        **base_flags,
        **{
            "force": (
                {"BaseLiteApp": {"force": True}},
                force.help,
            ),
        },
    )

    @property
    def description(self):
        return self.__doc__.splitlines()[0].strip()


class ManagedApp(BaseLiteApp):
    """An app with a LiteManager that can do some config fixing"""

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


# doit stuff
class LiteDoitApp(ManagedApp):
    """Run the doit command"""

    _doit_cmd = None

    def start(self):
        super().start()
        if self.force:
            self._forget()
        self.lite_manager.doit_run(*self._doit_cmd)

    def _forget(self):
        self.lite_manager.doit_run("forget", *self._doit_cmd)


# list is a little special
class LiteListApp(LiteDoitApp):
    """describe a JupyterLite folder"""

    _doit_cmd = ["list", "--all", "--status"]


class LiteTaskApp(LiteDoitApp):
    _doit_task = None

    @property
    def _doit_cmd(self):
        return [f"{phase}{self._doit_task}" for phase in PHASES]

    def _forget(self):
        for phase in PHASES:
            self.lite_manager.doit_run("forget", f"{phase}{self._doit_task}")


class LiteStatusApp(LiteTaskApp):
    """report about what a JupyterLite build _might_ do"""

    _doit_task = "status"


class LiteInitApp(LiteTaskApp):
    """initialize a JupyterLite folder"""

    _doit_task = "init"


class LiteBuildApp(LiteTaskApp):
    """build a JupyterLite folder"""

    _doit_task = "build"


class LiteCheckApp(LiteTaskApp):
    """verify a JupyterLite folder"""

    _doit_task = "check"


class LiteServeApp(LiteTaskApp):
    """verify a JupyterLite folder"""

    _doit_task = "serve"


class LiteArchiveApp(LiteTaskApp):
    """build a JupyterLite app archive"""

    _doit_task = "archive"


class LiteApp(BaseLiteApp):
    """build ready-to-serve JupyterLite sites"""

    name = "lite"

    subcommands = dict(
        status=(LiteStatusApp, LiteStatusApp.__doc__.splitlines()[0]),
        list=(LiteListApp, LiteListApp.__doc__.splitlines()[0]),
        init=(LiteInitApp, LiteInitApp.__doc__.splitlines()[0]),
        build=(LiteBuildApp, LiteBuildApp.__doc__.splitlines()[0]),
        check=(LiteCheckApp, LiteCheckApp.__doc__.splitlines()[0]),
        serve=(LiteServeApp, LiteServeApp.__doc__.splitlines()[0]),
        archive=(LiteArchiveApp, LiteArchiveApp.__doc__.splitlines()[0]),
    )


main = launch_new_instance = LiteApp.launch_instance
