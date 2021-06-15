import json

from .base import BaseAddon
from ..constants import JUPYTERLITE_JSON, JUPYTERLITE_SCHEMA


class LiteAddon(BaseAddon):
    __all__ = ["build", "check", "status"]

    def status(self, manager):
        yield dict(
            name=JUPYTERLITE_JSON,
            actions=[
                lambda: print(
                    f"""    {JUPYTERLITE_JSON}: {len(self.lite_jsons)} files"""
                )
            ],
        )

    def build(self, manager):
        lite_dir = manager.lite_dir
        output_dir = manager.output_dir

        lite_jsons = self.lite_jsons
        for jupyterlite_json in lite_jsons:
            rel = jupyterlite_json.relative_to(lite_dir)
            dest = output_dir / rel
            yield dict(
                name=f"patch:{rel}",
                file_dep=[jupyterlite_json],
                actions=[
                    (self.merge_one_jupyterlite, [dest, [dest, jupyterlite_json]])
                ],
            )

    def check(self, manager):
        schema = manager.output_dir / JUPYTERLITE_SCHEMA
        validator = self.get_validator(schema)

        for lite_json in manager.output_dir.rglob(JUPYTERLITE_JSON):
            stem = lite_json.relative_to(manager.output_dir)
            yield dict(
                name=f"validate:{stem}",
                file_dep=[schema, lite_json],
                actions=[(self.validate_one_json_file, [validator, lite_json])],
            )

    @property
    def lite_jsons(self):
        return [
            p
            for p in self.manager.lite_dir.rglob(JUPYTERLITE_JSON)
            if not str(p).startswith(str(self.manager.output_dir))
        ]

    def merge_one_jupyterlite(self, out_path, in_paths):
        config = {}

        for in_path in in_paths:
            in_config = json.loads(in_path.read_text(encoding="utf-8"))

            for k, v in in_config.items():
                if k in ["disabledExtensions", "federated_extensions"]:
                    config[k] = [*config.get("k", []), *v]
                elif k in ["settingsOverrides"]:
                    config[k] = config.get(k, {})
                    for pkg, pkg_config in v.items():
                        config[k][pkg] = config[k].get(pkg, {})
                        config[k][pkg].update(pkg_config)
                else:
                    config[k] = v

        out_path.write_text(
            json.dumps(config, indent=2, sort_keys=True), encoding="utf-8"
        )
