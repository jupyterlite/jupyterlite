"""a jupyterlite addon for generating app archives which can be used as input"""
import gzip
import os
import tarfile
import tempfile
from hashlib import sha256
from pathlib import Path

from ..constants import JOVYAN
from .base import BaseAddon


class ArchiveAddon(BaseAddon):
    """Adds contents from the `lite_dir` to the `output_dir` creates API output"""

    __all__ = ["archive"]

    def archive(self, manager):
        """add all files created prior to `pre_archive` to an archive"""
        output_dir = manager.output_dir

        tarball = self.manager.output_archive

        file_dep = [
            p for p in output_dir.rglob("*") if not p.is_dir() and p not in [tarball]
        ]

        yield dict(
            name=f"archive:{tarball.name}",
            doc="generate a new app archive",
            file_dep=file_dep,
            actions=[(self.make_archive, [tarball, output_dir, file_dep])],
            targets=[tarball],
        )

    def make_archive(self, tarball, root, members):
        if tarball.exists():
            tarball.unlink()

        def _filter(tarinfo):
            tarinfo.uid = 0
            tarinfo.gid = 0
            tarinfo.uname = tarinfo.gname = JOVYAN
            return tarinfo

        with tempfile.TemporaryDirectory() as td:
            temp_ball = Path(td) / tarball.name
            with os.fdopen(
                os.open(temp_ball, os.O_WRONLY | os.O_CREAT, 0o644), "wb"
            ) as tar_gz:
                with gzip.GzipFile("wb", fileobj=tar_gz, mtime=0) as gz:
                    with tarfile.open(fileobj=gz, mode="w:") as tar:
                        for path in sorted(root.rglob("*")):
                            if path.is_dir():
                                continue
                            tar.add(
                                path,
                                arcname=f"package/{path.relative_to(root)}",
                                filter=_filter,
                                recursive=False,
                            )
                            print(".", end="", flush=True)

            self.copy_one(temp_ball, tarball)

        stat = tarball.stat()
        size = stat.st_size / (1024 * 1024)
        shasum = sha256(tarball.read_bytes()).hexdigest()
        self.log.info(f"[lite] [archive] {tarball} created:  {stat.st_mtime}")
        self.log.info(f"[lite] [archive] {tarball} modified: {stat.st_mtime}")
        self.log.info(f"[lite] [archive] {tarball} SHA256:   {shasum}")
        self.log.info(f"[lite] [archive] {tarball} size:     {size} Mb")
