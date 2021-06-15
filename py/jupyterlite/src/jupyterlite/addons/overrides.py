"""a jupyterlite addon for supporting federated_extensions"""
import textwrap
import json

from .base import BaseAddon
from ..constants import OVERRIDES_JSON, JUPYTERLITE_JSON


class OverridesAddon(BaseAddon):
    """sync the as-installed `overrides.json` and update `jupyter-lite.json`"""

    __all__ = ["pre_build", "post_build"]

    def pre_build(self, manager):
        for app in [None, *manager.apps]:
            app_dir = manager.lite_dir / app if app else manager.lite_dir
            app_output_dir = manager.output_dir / app if app else manager.output_dir
            overrides_json = app_dir / OVERRIDES_JSON
            if not overrides_json.exists():
                continue
            dest = app_output_dir / overrides_json.name
            yield dict(
                name=f"copy:{app}/",
                file_dep=[overrides_json],
                targets=[dest],
                actions=[(manager.copy_one, [overrides_json, dest])],
            )

    def post_build(self, manager):
        """add settings from `overrides.json` per app where they exist"""
        for app in [None, *manager.apps]:
            app_output_dir = manager.output_dir / app if app else manager.output_dir
            jupyterlite_json = app_output_dir / JUPYTERLITE_JSON
            overrides_json = app_output_dir / OVERRIDES_JSON
            if not overrides_json.exists():
                continue

            yield dict(
                name="patch",
                file_dep=[overrides_json, jupyterlite_json],
                actions=[
                    (self.patch_one_overrides, [jupyterlite_json, overrides_json])
                ],
            )

    def patch_one_overrides(self, jupyterlite_json, overrides_json):
        """update and normalize settingsOverrides"""
        try:
            config = json.loads(jupyterlite_json.read_text(encoding="utf-8"))
        except:
            config = {"jupyter-config-data": {}}

        overrides = config["jupyter-config-data"].get("settingsOverrides", {})

        from_json = json.loads(overrides_json.read_text(encoding="utf-8"))
        for k, v in from_json.items():
            if k in overrides:
                overrides[k].update(v)
            else:
                overrides[k] = v

        config["jupyter-config-data"]["settingsOverrides"] = overrides

        json.dumps(config, indent=2, sort_keys=True)
