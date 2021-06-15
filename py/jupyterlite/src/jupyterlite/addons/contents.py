"""a jupyterlite addon for jupyter contents"""
from .base import BaseAddon
import json
import datetime
from ..constants import ALL_JSON, API_CONTENTS


class ContentsAddon(BaseAddon):
    __all__ = ["build", "post_build", "check", "status"]

    def status(self, manager):
        yield dict(
            name="contents",
            actions=[lambda: print(f"""    contents: {len(self.files)} files""")],
        )

    def build(self, manager):
        for src_file, dest_file in zip(self.files, self.file_targets):
            stem = src_file.relative_to(self.files_dir)
            yield dict(
                name=f"copy:{stem}",
                doc=f"copy {stem} to be distributed as files",
                file_dep=[src_file],
                targets=[dest_file],
                actions=[(self.copy_one, [src_file, dest_file])],
            )

    def post_build(self, manager):
        output_file_dirs = [
            d for d in self.output_files_dir.rglob("*") if d.is_dir()
        ] + [self.output_files_dir]
        for output_file_dir in output_file_dirs:
            stem = output_file_dir.relative_to(self.output_files_dir)
            api_path = self.api_dir / stem / ALL_JSON

            yield dict(
                name=f"contents:{stem}",
                doc=f"create a Jupyter Contents API response for {stem}",
                actions=[(self.one_contents_path, [output_file_dir, api_path])],
                file_dep=[p for p in output_file_dir.rglob("*") if not p.is_dir()],
                targets=[api_path],
            )

    def check(self, manager):
        for all_json in self.api_dir.rglob(ALL_JSON):
            stem = all_json.relative_to(self.api_dir)
            yield dict(
                name=f"validate:{stem}",
                doc=f"(eventually) validate {stem} with the Jupyter Contents API",
                file_dep=[all_json],
                actions=[(self.validate_one_json_file, [None, all_json])],
            )

    @property
    def api_dir(self):
        return self.manager.output_dir / API_CONTENTS

    @property
    def files_dir(self):
        return self.manager.lite_dir / "files"

    @property
    def output_files_dir(self):
        return self.manager.output_dir / "files"

    @property
    def files(self):
        return [p for p in self.files_dir.rglob("*") if not p.is_dir()]

    @property
    def file_targets(self):
        for dep in self.files:
            yield self.output_files_dir / dep.relative_to(self.files_dir)

    def one_contents_path(self, output_file_dir, api_path):
        """A lazy reuse of a `jupyter_server` Contents API generator

        Ideally we'd have a fallback, schema-verified generator, which we could
        later port to e.g. JS
        """
        try:
            from jupyter_server.services.contents.filemanager import FileContentsManager
        except ImportError as err:
            self.log.warning(
                "[lite] [contents] `jupyter_server` was not importable, cannot index contents"
            )
            return

        fm = FileContentsManager(root_dir=str(self.output_files_dir), parent=self)

        all_json = (
            self.manager.output_dir
            / API_CONTENTS
            / output_file_dir.relative_to(self.output_files_dir)
            / ALL_JSON
        )
        all_json.parent.mkdir(parents=True, exist_ok=True)
        listing_path = str(
            output_file_dir.relative_to(self.output_files_dir).as_posix()
        )
        if listing_path.startswith("."):
            listing_path = listing_path[1:]
        all_json.write_text(
            json.dumps(
                fm.get(listing_path), indent=2, sort_keys=True, cls=DateTimeEncoder
            ),
            encoding="utf-8",
        )


class DateTimeEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, datetime.datetime):
            return o.isoformat()

        return json.JSONEncoder.default(self, o)
