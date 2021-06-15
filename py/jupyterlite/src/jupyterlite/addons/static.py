"""a jupyterlite addon for jupyterlab core"""
from pathlib import Path
import tarfile
import tempfile
import shutil
import os
import doit

from traitlets import Instance, default

from .base import BaseAddon
from ..constants import JUPYTERLITE_JSON

ROOT = Path(__file__).parent.parent
LITE_TARBALL = next(ROOT.glob("jupyterlite-app-*.tgz"))


class StaticAddon(BaseAddon):

    lite_tarball = Instance(
        Path,
        help=(
            """The path to a custom npm-style tarball (e.g. with `package/package.json`). """
            """This may alternately be specified with the `$JUPYTERLITE_APP_TARBALL` """
            """environment variable."""
        ),
    ).tag(config=True)

    __all__ = ["pre_init", "init"]

    def pre_init(self, manager):
        """well before anything else, we need to ensure that the output_dir exists
        and is empty (if the baseline tarball has changed)
        """
        output_dir = manager.output_dir

        yield dict(
            name="output_dir",
            doc="clean out the lite directory",
            file_dep=[self.lite_tarball],
            actions=[
                lambda: [output_dir.exists() and shutil.rmtree(output_dir), None][-1],
                (doit.tools.create_folder, [output_dir]),
            ],
        )

    def init(self, manager):
        """unpack and copy the tarball files into the output_dir"""
        yield dict(
            name="unpack",
            actions=[(self._unpack, [])],
            file_dep=[self.lite_tarball],
            targets=[manager.output_dir / JUPYTERLITE_JSON],
        )

    @default("lite_tarball")
    def _default_lite_tarball(self):
        tarball = os.environ.get("JUPYTERLITE_APP_TARBALL") or LITE_TARBALL
        self.log.debug(f"[lite] [jupyterlab] Tarball {tarball}")
        return Path(tarball)

    def _unpack(self):
        output_dir = self.manager.output_dir

        with tempfile.TemporaryDirectory() as td:
            tdp = Path(td)
            with tarfile.open(str(self.lite_tarball), "r:gz") as tar:
                tar.extractall(td)
                for child in sorted((tdp / "package").glob("*")):
                    self.log.debug(f"[lite] [jupyterlab] copying {child}")
                    dest = output_dir / child.name
                    if not dest.parent.exists():
                        dest.parent.mkdir(exist_ok=True, parents=True)
                    try:
                        if child.is_dir():
                            shutil.copytree(child, dest)
                        else:
                            shutil.copy2(child, dest)
                    except Exception as err:
                        self.log.error(f"ERR copying {child} to {dest}: {err}")
