"""a jupyterlite addon for supporting extension settings"""
import json

from ..constants import JUPYTERLITE_JSON, LAB_EXTENSIONS, OVERRIDES_JSON
from .base import BaseAddon


class SettingsAddon(BaseAddon):
    """sync the as-installed `overrides.json` and update `jupyter-lite.json`"""

    __all__ = ["pre_build", "post_build", "check", "status"]

    def status(self, manager):
        apps = []
        for app in [None, *manager.apps]:
            app_dir = manager.lite_dir / app if app else manager.lite_dir
            overrides_json = app_dir / OVERRIDES_JSON
            if not overrides_json.exists():
                continue
            apps.append(overrides_json)

        yield dict(
            name="overrides",
            actions=[lambda: print(f"""    overrides.json: {len(apps)}""")],
        )

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
                actions=[(self.copy_one, [overrides_json, dest])],
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

    def check(self, manager):
        lab_extensions = self.output_env_extensions_dir

        for lite_json in manager.output_dir.rglob(JUPYTERLITE_JSON):
            config = json.loads(lite_json.read_text(encoding="utf-8"))
            overrides = config.get("jupyter-config-data", {}).get(
                "settingsOverrides", {}
            )
            for plugin_id, defaults in overrides.items():
                ext, plugin = plugin_id.split(":")
                schema = lab_extensions / ext / "schemas" / ext / f"{plugin}.json"
                if not schema.exists():
                    self.log.debug(
                        f"[lite] [settings] Missing {schema} (probably in `all.json`)"
                    )
                    continue

                validator = self.get_validator(schema)

                yield dict(
                    name=f"overrides:{plugin_id}",
                    file_dep=[lite_json, schema],
                    actions=[
                        (self.validate_one_json_file, [validator, None, defaults])
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

        jupyterlite_json.write_text(
            json.dumps(config, indent=2, sort_keys=True), encoding="utf-8"
        )

    @property
    def output_env_extensions_dir(self):
        """where labextensions will go in the output folder"""
        return self.manager.output_dir / LAB_EXTENSIONS
