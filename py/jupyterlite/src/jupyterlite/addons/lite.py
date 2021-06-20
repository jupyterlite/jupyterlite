"""a jupyterlite addon for jupyterlite-specific tasks"""


from ..constants import JUPYTERLITE_JSON, JUPYTERLITE_SCHEMA
from .base import BaseAddon


class LiteAddon(BaseAddon):
    """ensure jupyterlite files have been merged, and validate them"""

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
        """merge jupyter-lite.json into the output_dir"""
        lite_dir = manager.lite_dir
        output_dir = manager.output_dir

        lite_jsons = self.lite_jsons
        for jupyterlite_json in lite_jsons:
            rel = jupyterlite_json.relative_to(lite_dir)
            dest = output_dir / rel
            yield dict(
                name=f"patch:{rel}",
                file_dep=[jupyterlite_json, dest],
                actions=[
                    (self.merge_one_jupyterlite, [dest, [dest, jupyterlite_json]]),
                    (self.maybe_timestamp, [dest]),
                ],
            )

    def check(self, manager):
        """apply schema validation to all `jupyter-lite.json` in the `output_dir`"""
        schema = manager.output_dir / JUPYTERLITE_SCHEMA
        file_dep = []

        if not schema.exists():
            return

        validator = self.get_validator(schema)
        file_dep += [schema]

        for lite_json in manager.output_dir.rglob(JUPYTERLITE_JSON):
            stem = lite_json.relative_to(manager.output_dir)
            yield dict(
                name=f"validate:{stem}",
                file_dep=[schema, lite_json],
                actions=[(self.validate_one_json_file, [validator, lite_json])],
            )

    @property
    def lite_jsons(self):
        """all the source `jupyter-lite.json` files"""
        return [
            p
            for p in self.manager.lite_dir.rglob(JUPYTERLITE_JSON)
            if not str(p).startswith(str(self.manager.output_dir))
        ]
