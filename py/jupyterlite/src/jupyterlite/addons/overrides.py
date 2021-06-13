"""a jupyterlite addon for supporting federated_extensions"""
import textwrap
import json

from . import BaseAddon
from ..constants import OVERRIDES_JSON, JUPYTERLITE_JSON


class OverridesAddon(BaseAddon):
    """sync the as-installed `overrides.json` and update `jupyter-lite.json`"""

    __all__ = ["pre_build"]

    async def pre_build(self, manager):
        changed = False
        # add settings from `overrides.json`
        for app in [None, "lab", "retro"]:
            app_dir = manager.lite_dir / app if app else manager.lite_dir
            overrides_json = app_dir / OVERRIDES_JSON
            if not overrides_json.exists():
                self.log.debug(
                    f"""[lite] [overrides] No {OVERRIDES_JSON} found in {app or "root"}, skipping
                """
                )
                continue
            changed = True
            jupyterlite_json = app_dir / JUPYTERLITE_JSON
            overrides = json.loads(overrides_json.read_text(encoding="utf-8"))
            self.log.info(f"... ... {len(overrides.keys())} settings overrides")

            try:
                config = json.loads(jupyterlite_json.read_text(encoding="utf-8"))
            except:
                config = {"jupyter-config-data": {}}

            config["jupyter-config-data"]["settingsOverrides"] = overrides

            self.log.info(f"... writing {jupyterlite_json}")
            jupyterlite_json.write_text(
                textwrap.indent(json.dumps(config, indent=2, sort_keys=True), " " * 4)
            )

        if not changed:
            self.log.info(
                f"""<💡/*/overrides.json> Add <app/ or />{OVERRIDES_JSON} to change how extensions work."""
            )
