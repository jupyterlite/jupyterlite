"""an observable configuration object for the JupyterLite lifecycle

.. todo::

    Move to a canonical JSON schema?

"""
import os
from pathlib import Path

from traitlets import CInt, Tuple, default
from traitlets.config import LoggingConfigurable

from . import constants as C
from .trait_types import CPath


class LiteBuildConfig(LoggingConfigurable):
    """the description of a JupyterLite build

    This is most likely to be configured:
    - from environment variables
    - in a `pyproject.toml`
    - from the command line
    With direct instantiation a distant last place.

    This is conceptually similar in scale to `jupyter_server_config.json`, and will
    piggy-back off of the `{sys.prefix}/share/jupyter_{notebook,server}_config.d/`
    loader paths
    """

    disable_addons = Tuple(
        allow_none=True,
        help=("skip loading `entry_point` for these addons. TODO: should be a dict"),
    ).tag(config=True)

    apps = Tuple(
        help=(
            f"""the Lite apps: currently {C.JUPYTERLITE_APPS}. """
            f"""Required: {C.JUPYTERLITE_APPS_REQUIRED}"""
        ),
    ).tag(config=True)

    # a bunch of paths
    app_archive: Path = CPath(
        help=(f"""The app archive to use, default: {C.DEFAULT_APP_ARCHIVE}""")
    ).tag(config=True)

    lite_dir: Path = CPath(help=("""The root folder of a JupyterLite project""")).tag(
        config=True
    )

    output_dir: Path = CPath(help=("""Where to build the JupyterLite site""")).tag(
        config=True
    )

    output_archive: Path = CPath(help="Archive to create").tag(config=True)

    # actually some more paths
    files = Tuple(allow_none=True).tag(config=True)

    overrides = Tuple(allow_none=True, help=("Specific overrides.json to include")).tag(
        config=True
    )

    # patterns
    ignore_files = Tuple(
        allow_none=True, help="Path patterns that should never be included"
    ).tag(config=True)

    source_date_epoch = CInt(
        allow_none=True,
        min=1,
        help="Trigger reproducible builds, clamping timestamps to this value",
    ).tag(config=True)

    @default("apps")
    def _default_apps(self):
        return C.JUPYTERLITE_APPS

    @default("disable_addons")
    def _default_disable_addons(self):
        """the addons that are disabled by default."""
        return []

    @default("output_dir")
    def _default_output_dir(self):
        return Path(
            os.environ.get("JUPYTERLITE_OUTPUT_DIR")
            or self.lite_dir / C.DEFAULT_OUTPUT_DIR
        )

    @default("lite_dir")
    def _default_lite_dir(self):
        return Path.cwd()

    @default("files")
    def _default_files(self):
        lite_files = self.lite_dir / "files"

        if lite_files.is_dir():
            return [lite_files]

        return []

    @default("overrides")
    def _default_overrides(self):
        all_overrides = []
        for app in [None, *self.apps]:
            app_dir = self.lite_dir / app if app else self.lite_dir
            overrides_json = app_dir / C.OVERRIDES_JSON
            if overrides_json.exists():
                all_overrides += [overrides_json]
        return all_overrides

    @default("ignore_files")
    def _default_ignore_files(self):
        return [
            ".*\.pyc" "/\.git/",
            "/\.gitignore",
            "/\.ipynb_checkpoints/",
            "/build/",
            "/lib/",
            "/dist/",
            ".*doit.db",
            "/node_modules/",
            "/envs/",
            "/venvs/",
            "/\.env",
            C.JUPYTERLITE_JSON.replace(".", "\\."),
            C.JUPYTERLITE_IPYNB.replace(".", "\\."),
            "untitled.*",
            "Untitled.*",
            f"/{self.output_dir.name}/",
        ]

    @default("app_archive")
    def _default_app_archive(self):
        return Path(os.environ.get("JUPYTERLITE_APP_ARCHIVE") or C.DEFAULT_APP_ARCHIVE)

    @default("output_archive")
    def _default_output_archive(self):
        return Path(
            os.environ.get("JUPYTERLITE_OUTPUT_ARCHIVE")
            or self.output_dir / f"{self.lite_dir.name}-jupyterlite.tgz"
        )

    @default("source_date_epoch")
    def _default_source_date_epoch(self):
        if C.SOURCE_DATE_EPOCH not in os.environ:
            return None
        sde = int(os.environ[C.SOURCE_DATE_EPOCH])
        return sde
