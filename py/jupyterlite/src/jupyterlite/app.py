from pathlib import Path

from jupyter_core.application import JupyterApp, base_aliases
from traitlets import Instance, Tuple, Unicode, default

from . import __version__
from .constants import JUPYTERLITE_APPS, JUPYTERLITE_APPS_REQUIRED
from .manager import LiteManager

"""


    def list(self):
        self.doit_run("list", "--all", "--status")

    def status(self):
        self.doit_run("post_status")

    def init(self):
        self.doit_run("post_init")

    def build(self):
        self.doit_run("post_build")

    def check(self):
        self.doit_run("post_check")

    def publish(self):
        self.doit_run("post_publish")

    def serve(self):
        self.doit_run("serve")
"""


class BaseApp(JupyterApp):
    """TODO: An undescribed app"""

    version = __version__

    @property
    def description(self):
        return self.__doc__.splitlines()[0].strip()


class ManagedApp(BaseApp):
    lite_manager = Instance(LiteManager)
    apps = Tuple(
        allow_none=True,
        help=(
            f"""the Lite apps: currently {JUPYTERLITE_APPS}. """
            f"""Required: {JUPYTERLITE_APPS_REQUIRED}"""
        ),
    ).tag(config=True)
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
            "apps": "ManagedApp.apps",
            "files": "ManagedApp.files",
            "ignore-files": "ManagedApp.ignore_files",
            "lite-dir": "ManagedApp.lite_dir",
            "output-dir": "ManagedApp.output_dir",
            "overrides": "ManagedApp.overrides",
        },
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
        if self.apps:
            kwargs["apps"] = self.apps

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
