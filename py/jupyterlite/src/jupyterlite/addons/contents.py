"""a jupyterlite addon for jupyter contents"""
from . import BaseAddon
import json
import datetime
import shutil


class ContentsAddon(BaseAddon):
    __all__ = ["post_build"]

    async def post_build(self, manager):
        """A lazy reuse of a `jupyter_server` Contents API generator

        Ideally we'd have a fallback, schema-verified generator, which we could
        later port to e.g. JS
        """
        try:
            from jupyter_server.services.contents.filemanager import FileContentsManager
        except ImportError as err:
            self.log.warn(
                "[lite] [contents] `jupyter_server` was not importable, cannot index contents"
            )
            return

        files_dir = manager.lite_dir / "files"

        if not files_dir.is_dir():
            self.log.debug(
                f"""[lite] [contents] No files found in {files_dir}, skipping...
            """
            )
            self.log.info(
                """<💡/files/**/*> Add some files in {file_dir}, and they will be visible in the _File Manager_"""
            )
            return

        output_dir = manager.output_dir

        fm = FileContentsManager(root_dir=str(files_dir), parent=manager)

        shutil.copytree(files_dir, output_dir / "files")

        for file_dir in [files_dir, *files_dir.rglob("*")]:
            if not file_dir.is_dir():
                continue
            all_json = (
                output_dir
                / "api/contents"
                / file_dir.relative_to(files_dir)
                / "all.json"
            )
            all_json.parent.mkdir(parents=True, exist_ok=True)
            listing_path = str(file_dir.relative_to(files_dir).as_posix())
            if listing_path.startswith("."):
                listing_path = listing_path[1:]
            self.log.info(f"... indexing /api/contents/{listing_path}")
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
