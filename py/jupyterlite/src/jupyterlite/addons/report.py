"""a jupyterlite addon for generating hashes"""
from hashlib import sha256

from .base import BaseAddon
from ..constants import SHA256SUMS


class ReportAddon(BaseAddon):
    """update static listings of the site contents in various formats

    having these in various formats down the line can be handy for various publishing
    tasks
    """

    __all__ = ["post_build"]

    def post_build(self, manager):
        sha256sums = manager.output_dir / SHA256SUMS

        file_dep = [
            p
            for p in manager.output_dir.rglob("*")
            if not p.is_dir() and p != sha256sums
        ]

        yield dict(
            name=SHA256SUMS,
            doc="hash all of the files",
            actions=[(self.hash_all, [sha256sums, manager.output_dir, file_dep])],
            file_dep=file_dep,
            targets=[sha256sums],
        )

    def hash_all(self, hashfile, root, paths):
        lines = [
            "  ".join(
                [sha256(p.read_bytes()).hexdigest(), p.relative_to(root).as_posix()]
            )
            for p in sorted(paths)
        ]
        hashfile.write_text("\n".join(lines))
