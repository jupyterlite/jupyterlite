"""a jupyterlite addon for jupyterlab core"""
from pathlib import Path
import tarfile
import tempfile
import shutil
from tornado.concurrent import run_on_executor
from concurrent.futures import ThreadPoolExecutor

from . import BaseAddon

MAX_WORKERS = 4

ROOT = Path(__file__).parent.parent
APP_TARBALL = next(ROOT.glob("jupyterlite-app-*.tgz"))


class JupyterLabAddon(BaseAddon):
    executor = ThreadPoolExecutor(max_workers=MAX_WORKERS)

    __all__ = ["pre_init"]

    @run_on_executor
    def unpack(self):
        lite_dir = Path(self.manager.lite_dir)

        with tempfile.TemporaryDirectory() as td:
            tdp = Path(td)
            with tarfile.open(str(APP_TARBALL), "r:gz") as tar:
                tar.extractall(td)
                for child in sorted((tdp / "package").glob("*")):
                    self.log.debug(f"[lite] [jupyterlab] copying {child}")
                    dest = lite_dir / child.name
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
        """copy the files into the directory"""
        self.log.error(f"[lab] [jupyterlab] {APP_TARBALL}")
        unpacked = await self.unpack()
        manager.log.error(f"UNPACKED: {unpacked}")
        manager.log.error(f"TODO: unpack the files tarball to {manager.lite_dir}")
