"""a jupyterlite addon for supporting federated_extensions"""
from pathlib import Path
import sys
import shutil
import textwrap
import json

from . import BaseAddon

# TODO: improve this

ENV_EXTENSIONS = Path(sys.prefix) / "share/jupyter/labextensions"


class FederatedExtensionAddon(BaseAddon):
    """sync the as-installed federated_extensions and update `jupyter-lite.json`"""

    __all__ = ["pre_build"]

    async def pre_build(self, manager):
        PATCHED_STATIC = manager.lite_dir
        CACHED_LAB_EXTENSIONS = PATCHED_STATIC / "lab/extensions"

        if CACHED_LAB_EXTENSIONS.exists():
            self.log.info(f"... Cleaning {CACHED_LAB_EXTENSIONS}...")
            shutil.rmtree(CACHED_LAB_EXTENSIONS)

        self.log.info(f"... Copying {ENV_EXTENSIONS} to {CACHED_LAB_EXTENSIONS}...")
        shutil.copytree(ENV_EXTENSIONS, CACHED_LAB_EXTENSIONS)

        extensions = []

        all_package_json = [
            *CACHED_LAB_EXTENSIONS.glob("*/package.json"),
            *CACHED_LAB_EXTENSIONS.glob("@*/*/package.json"),
        ]

        # we might find themes, and need to put them in both apps
        app_themes = [
            PATCHED_STATIC / f"{app}/build/themes" for app in ["lab", "retro"]
        ]

        for pkg_json in all_package_json:
            self.log.info(
                f"... adding {pkg_json.parent.relative_to(CACHED_LAB_EXTENSIONS)}..."
            )
            pkg_data = json.loads(pkg_json.read_text(encoding="utf-8"))
            extensions += [
                dict(name=pkg_data["name"], **pkg_data["jupyterlab"]["_build"])
            ]
            for app_theme in app_themes:
                for theme in pkg_json.parent.glob("themes/*"):
                    self.log.info(
                        f"... copying theme {theme.relative_to(CACHED_LAB_EXTENSIONS)}"
                    )

                    if not app_theme.exists():
                        app_theme.mkdir(parents=True)
                    self.log.info(f"... ... to {app_theme}")
                    shutil.copytree(theme, app_theme / theme.name)

        APP_JUPYTERLITE_JSON = manager.lite_dir / "jupyter-lite.json"
        PATCHED_JUPYTERLITE_JSON = APP_JUPYTERLITE_JSON
        print(f"... Patching {APP_JUPYTERLITE_JSON}...")
        config = json.loads(APP_JUPYTERLITE_JSON.read_text(encoding="utf-8"))
        print(f"... ... {len(extensions)} federated extensions...")
        config["jupyter-config-data"]["federated_extensions"] = extensions

        print(f"... writing {PATCHED_JUPYTERLITE_JSON}")
        PATCHED_JUPYTERLITE_JSON.write_text(
            textwrap.indent(json.dumps(config, indent=2, sort_keys=True), " " * 4)
        )
