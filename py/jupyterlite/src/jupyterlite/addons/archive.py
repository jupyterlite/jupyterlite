"""a jupyterlite addon for generating app archives which can be used as input"""
import tarfile

from .base import BaseAddon


class ArchiveAddon(BaseAddon):
    """Adds contents from the `lite_dir` to the `output_dir` creates API output"""

    __all__ = ["archive"]

    def archive(self, manager):
        output_dir = manager.output_dir

        # TODO: parametrize
        tarball = output_dir / "my-jupyterlite.tgz"

        file_dep = [
            p for p in output_dir.rglob("*") if not p.is_dir() and p not in [tarball]
        ]

        yield dict(
            name="archive",
            doc="generate a new app archive",
            file_dep=file_dep,
            actions=[(self.make_archive, [tarball, output_dir, file_dep])],
            targets=[tarball],
        )

    def make_archive(self, tarball, root, members):
        if tarball.exists():
            tarball.unlink()

        with tarfile.open(str(tarball), "w:gz") as tf:
            tf.add(root, filter=lambda x: [print(x), x][-1])
