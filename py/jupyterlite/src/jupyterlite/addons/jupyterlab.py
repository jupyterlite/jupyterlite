"""a jupyterlite addon for jupyterlab core"""
from pathlib import Path
import tarfile
import tempfile
import shutil
import os
from tornado.concurrent import run_on_executor
from concurrent.futures import ThreadPoolExecutor
from traitlets import Instance, default

from . import BaseAddon

MAX_WORKERS = 4

ROOT = Path(__file__).parent.parent
LITE_TARBALL = next(ROOT.glob("jupyterlite-app-*.tgz"))


class JupyterLabAddon(BaseAddon):
    executor = ThreadPoolExecutor(max_workers=MAX_WORKERS)

    lite_tarball = Instance(
        Path,
        help=(
            """The path to a custom npm-style tarball (e.g. with `package/package.json`). """
            """This may alternately be specified with the `$JUPYTERLITE_APP_TARBALL` """
            """environment variable."""
        ),
    ).tag(config=True)

    __all__ = ["pre_init", "init"]

    @default("lite_tarball")
    def _default_lite_tarball(self):
        tarball = os.environ.get("JUPYTERLITE_APP_TARBALL") or LITE_TARBALL
        self.log.debug(f"[lite] [jupyterlab] Tarball {tarball}")
        return Path(tarball)

    @run_on_executor
    def unpack(self):
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

    async def pre_init(self, manager):
        if manager.output_dir.exists():
            shutil.rmtree(manager.output_dir)
        manager.output_dir.mkdir(parents=True)

    async def init(self, manager):
        """copy the files into the directory"""
        unpacked = await self.unpack()
        manager.log.debug(f"UNPACKED: {unpacked}")
