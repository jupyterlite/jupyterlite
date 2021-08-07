"""the JupyterLite CLI App(s)"""
from pathlib import Path

from jupyter_core.application import JupyterApp, base_aliases, base_flags
from traitlets import Bool, Instance, Unicode, default

from . import __version__
from .config import LiteBuildConfig
from .constants import PHASES
from .manager import LiteManager


class BaseLiteApp(JupyterApp, LiteBuildConfig):
    """TODO: An undescribed app"""

    version = __version__

    config_file_name = Unicode("jupyter_lite_config").tag(config=True)

    # traitlets app stuff
    aliases = dict(
        **base_aliases,
        **{
            "app-archive": "LiteBuildConfig.app_archive",
            "apps": "LiteBuildConfig.apps",
            "contents": "LiteBuildConfig.contents",
            "ignore-contents": "LiteBuildConfig.ignore_contents",
            "lite-dir": "LiteBuildConfig.lite_dir",
            "output-dir": "LiteBuildConfig.output_dir",
            "output-archive": "LiteBuildConfig.output_archive",
            "settings-overrides": "LiteBuildConfig.settings_overrides",
            "source-date-epoch": "LiteBuildConfig.source_date_epoch",
            # addon-specific things
            "port": "LiteBuildConfig.port",
            "base-url": "LiteBuildConfig.base_url",
        },
    )

    flags = dict(
        **base_flags,
        **{
            "ignore-sys-prefix": (
                {"LiteBuildConfig": {"ignore_sys_prefix": True}},
                "Do not copy any extensions from sys.prefix",
            )
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
            kwargs["lite_dir"] = self.lite_dir
        if self.app_archive:
            kwargs["app_archive"] = self.app_archive
        if self.output_dir:
            kwargs["output_dir"] = self.output_dir
        if self.contents:
            kwargs["contents"] = [Path(p) for p in self.contents]
        if self.ignore_contents:
            kwargs["ignore_contents"] = self.ignore_contents
        if self.settings_overrides:
            kwargs["settings_overrides"] = [Path(p) for p in self.settings_overrides]
        if self.apps:
            kwargs["apps"] = self.apps
        if self.output_archive:
            kwargs["output_archive"] = Path(self.output_archive)
        if self.disable_addons:
            kwargs["disable_addons"] = self.disable_addons
        if self.source_date_epoch is not None:
            kwargs["source_date_epoch"] = self.source_date_epoch
        if self.port is not None:
            kwargs["port"] = self.port
        if self.base_url is not None:
            kwargs["base_url"] = self.base_url
        if self.federated_extensions is not None:
            kwargs["federated_extensions"] = self.federated_extensions
        if self.ignore_sys_prefix is not None:
            kwargs["ignore_sys_prefix"] = self.ignore_sys_prefix

        return LiteManager(**kwargs)

    def start(self):
        self.lite_manager.initialize()


# doit stuff
class LiteDoitApp(ManagedApp):
    """Run the doit command"""

    _doit_cmd = None

    def start(self):
        super().start()
        self.lite_manager.doit_run(*self._doit_cmd)


# special non-task apps
class LiteRawDoitApp(LiteDoitApp):
    """use the full doit CLI, see https://pydoit.org/contents.html

    tell jupyter to not parse the arguments with --, e.g.

        jupyter-lite doit -- --help
    """

    def parse_command_line(self, argv=None):
        super().parse_command_line(argv)
        self._doit_cmd = [*(self.extra_args or [])]


class LiteListApp(LiteDoitApp):
    """describe a JupyterLite site"""

    _doit_cmd = ["list", "--all", "--status"]


# task app base class
class LiteTaskApp(LiteDoitApp):
    """run a doit task, optionally with --force"""

    force = Bool(
        False, help="forget previous runs of task and re-run from the beginning"
    ).tag(config=True)

    flags = dict(
        **base_flags,
        **{
            "force": (
                {"LiteTaskApp": {"force": True}},
                force.help,
            ),
        },
    )

    _doit_task = None

    @property
    def _doit_cmd(self):
        return [f"{phase}{self._doit_task}" for phase in PHASES]

    def start(self):
        super().start()
        if self.force:
            for phase in PHASES:
                self.lite_manager.doit_run("forget", f"{phase}{self._doit_task}")


# the tasks
class LiteStatusApp(LiteTaskApp):
    """report about what a JupyterLite build _might_ do"""

    _doit_task = "status"


class LiteInitApp(LiteTaskApp):
    """initialize a JupyterLite site from an app archive baseline"""

    _doit_task = "init"


class LiteBuildApp(LiteTaskApp):
    """build a JupyterLite site, including user content"""

    _doit_task = "build"


class LiteCheckApp(LiteTaskApp):
    """verify a JupyterLite site, using available schema and rules"""

    _doit_task = "check"


class LiteServeApp(LiteTaskApp):
    """serve a JupyterLite site, using best available HTTP server"""

    _doit_task = "serve"


class LiteArchiveApp(LiteTaskApp):
    """build a JupyterLite app archive, which can be used as a baseline"""

    _doit_task = "archive"


class LiteApp(BaseLiteApp):
    """build ready-to-serve (or -publish) JupyterLite sites"""

    subcommands = {
        k: (v, v.__doc__.splitlines()[0].strip())
        for k, v in dict(
            # special apps
            list=LiteListApp,
            # task apps
            status=LiteStatusApp,
            init=LiteInitApp,
            build=LiteBuildApp,
            check=LiteCheckApp,
            serve=LiteServeApp,
            archive=LiteArchiveApp,
            # more special apps
            doit=LiteRawDoitApp,
        ).items()
    }


main = launch_new_instance = LiteApp.launch_instance
