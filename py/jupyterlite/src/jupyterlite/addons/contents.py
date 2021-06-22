"""a JupyterLite addon for Jupyter Server-compatible contents"""
import datetime
import json
import pprint
import re
from pathlib import Path

import doit

from ..constants import ALL_JSON, API_CONTENTS
from .base import BaseAddon


class ContentsAddon(BaseAddon):
    """Adds contents from the ``lite_dir`` to the ``output_dir``, creates API output"""

    __all__ = ["build", "post_build", "check", "status"]

    def status(self, manager):
        """yield some status information about the state of contentss"""
        yield dict(
            name="contents",
            actions=[
                lambda: self.log.debug(
                    "[lite] [contents] All Files %s",
                    pprint.pformat(
                        [
                            str(p[0].relative_to(manager.lite_dir))
                            for p in self.file_src_dest
                        ]
                    ),
                ),
                lambda: print(
                    f"""    contents: {len(list(self.file_src_dest))} files"""
                ),
            ],
        )

    def build(self, manager):
        """perform the main user build of pre-populating ``/files/``"""
        files = sorted(self.file_src_dest)
        all_dest_files = []
        for src_file, dest_file in files:
            all_dest_files += [dest_file]
            stem = dest_file.relative_to(self.output_files_dir)
            yield dict(
                name=f"copy:/files/{stem}",
                doc=f"copy {stem} to be distributed as files",
                file_dep=[src_file],
                targets=[dest_file],
                actions=[
                    (doit.tools.create_folder, [self.output_files_dir]),
                    (self.copy_one, [src_file, dest_file]),
                ],
            )

        if manager.source_date_epoch is not None:
            yield dict(
                name="timestamp",
                file_dep=all_dest_files,
                actions=[
                    (self.maybe_timestamp, [self.output_files_dir]),
                ],
            )

    def post_build(self, manager):
        """create a Contents API index for each subdirectory in ``/files/``"""
        if not self.output_files_dir.exists():
            return

        output_file_dirs = [
            d for d in self.output_files_dir.rglob("*") if d.is_dir()
        ] + [self.output_files_dir]
        for output_file_dir in output_file_dirs:
            stem = output_file_dir.relative_to(self.output_files_dir)
            api_path = self.api_dir / stem / ALL_JSON

            yield dict(
                name=f"contents:{stem}",
                doc=f"create a Jupyter Contents API response for {stem}",
                actions=[
                    (self.one_contents_path, [output_file_dir, api_path]),
                    (self.maybe_timestamp, [api_path]),
                ],
                file_dep=[p for p in output_file_dir.rglob("*") if not p.is_dir()],
                targets=[api_path],
            )

    def check(self, manager):
        """verify that all Contents API is valid (sorta)"""
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
    def output_files_dir(self):
        return self.manager.output_dir / "files"

    @property
    def file_src_dest(self):
        """the paits of files that will be copied"""
        for mgr_file in self.manager.files:
            path = Path(mgr_file)
            for from_path in self.maybe_add_one_path(path):
                stem = from_path.relative_to(self.manager.lite_dir)
                to_path = self.output_files_dir / stem
                yield from_path, to_path

    def maybe_add_one_path(self, path):
        """add a folder or directory (if not ignored)"""
        p_path = str(path.resolve().as_posix())

        for ignore in self.manager.ignore_files:
            if re.findall(ignore, p_path):
                return

        if path.is_dir():
            for child in path.glob("*"):
                for from_child in self.maybe_add_one_path(child):
                    yield from_child
        else:
            yield path.resolve()

    def one_contents_path(self, output_file_dir, api_path):
        """A lazy reuse of a ``jupyter_server`` Contents API generator

        .. todo::

            Ideally we'd have a fallback, schema-verified generator, which we could
            later port to e.g. JS
        """
        try:
            from jupyter_server.services.contents.filemanager import FileContentsManager
        except ImportError as err:  # pragma: no cover
            self.log.warning(
                f"[lite] [contents] `jupyter_server` was not importable, "
                f"cannot index contents {err}"
            )
            return

        if not self.output_files_dir.exists():
            return

        self.maybe_timestamp(self.output_files_dir)

        fm = FileContentsManager(root_dir=str(self.output_files_dir), parent=self)

        listing_path = str(
            output_file_dir.relative_to(self.output_files_dir).as_posix()
        )

        if listing_path.startswith("."):
            listing_path = listing_path[1:]

        listing = fm.get(listing_path)

        if self.manager.source_date_epoch is not None:
            listing = self.patch_listing_timestamps(listing)

        api_path.parent.mkdir(parents=True, exist_ok=True)

        api_path.write_text(
            json.dumps(listing, indent=2, sort_keys=True, cls=DateTimeEncoder),
            encoding="utf-8",
        )

        self.maybe_timestamp(api_path.parent)

    def patch_listing_timestamps(self, listing, sde=None):
        """clamp a contents listing's times to ``SOURCE_DATE_EPOCH``

        .. todo::

            pre-validated this structure with the ``jupyter_server`` API spec
        """
        sde = datetime.datetime.utcfromtimestamp(self.manager.source_date_epoch)

        if isinstance(listing, dict):
            for field in ["created", "last_modified"]:
                if field not in listing:  # pragma: no cover
                    continue
                value = listing[field]
                if isoformat(value) > isoformat(sde):
                    self.log.info(
                        f"""[lite][contents][patch] {field} on {listing["name"]}"""
                    )
                    listing[field] = sde
            if listing["type"] == "directory":
                for child in listing.get("content") or []:
                    self.patch_listing_timestamps(child, sde)

        else:  # pragma: no cover
            self.log.error(f"[lite][contents] Don't know how to patch {listing}")
            return None

        return listing


class DateTimeEncoder(json.JSONEncoder):
    """A custom date-aware JSON encoder"""

    def default(self, o):
        if isinstance(o, datetime.datetime):
            return isoformat(o)

        return json.JSONEncoder.default(self, o)


def isoformat(dt):
    """a small helper to user ``Z`` for UTC ISO strings"""
    return dt.isoformat().replace("+00:00", "Z")
