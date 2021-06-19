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
    """Adds contents from the `lite_dir` to the `output_dir` creates API output

    If `--source-date-epoch` (SDE) is set, a number of features
    will be enabled to improve reproducibility of the final artifact. In addition
    to timestamps newer than SDE being "clamped" to SDE, this will also adjust some
    permissions inside the tarball
    """

    __all__ = ["archive", "status"]

    def status(self, manager):
        tarball = manager.output_archive
        yield dict(
            name="archive",
            actions=[(self.log_archive, [tarball])],
        )

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
            actions=[
                (self.make_archive_stdlib, [tarball, output_dir, file_dep]),
                (self.log_archive, [tarball, "[lite] [archive] "]),
            ],
            targets=[tarball],
        )

    def make_archive_stdlib(self, tarball, root, members):
        """actually build the archive. This takes longer than any other hooks

        At present, and potentially into the future, an npm-compatible `.tgz`
        is the only supported format, as this is compatible with the upstream
        `webpack` build and its native packaged format.

        Furthermore, while this pure-python implementation needs to be maintained,
        a `libarchive`-based build might be preferrable for e.g. CI performance.
        """

        if tarball.exists():
            tarball.unlink()

        def _filter(tarinfo):
            tarinfo.uid = tarinfo.gid = 0
            tarinfo.uname = tarinfo.gname = JOVYAN
            if self.manager.source_date_epoch is not None:
                tarinfo.mtime = self.manager.source_date_epoch
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

    def log_archive(self, tarball, prefix=""):
        sde = self.manager.source_date_epoch
        if sde is not None:
            self.log.info(f"{prefix}SOURCE_DATE_EPOCH: {sde}")
        if not tarball.exists():
            self.log.info(f"{prefix}No archive (yet): {tarball.name}")
        else:
            stat = tarball.stat()
            size = stat.st_size / (1024 * 1024)
            self.log.info(f"{prefix}filename:   {tarball.name}")
            shasum = sha256(tarball.read_bytes()).hexdigest()
            self.log.info(f"{prefix}size:       {size} Mb")
            # extra details, for the curious
            self.log.debug(f"{prefix}created:  {stat.st_mtime}")
            self.log.debug(f"{prefix}modified: {stat.st_mtime}")
            self.log.debug(f"{prefix}SHA256:   {shasum}")
