"""Manager for JupyterLite
"""
from traitlets.config import LoggingConfigurable
import entrypoints
from pathlib import Path

from traitlets import Dict, default, Instance

from .constants import ADDON_ENTRYPOINT


class LiteManager(LoggingConfigurable):
    """a manager for building jupyterlite"""

    addons = Dict()
    lite_dir = Instance(Path)
    config = Dict()

    @property
    def log(self):
        return self.parent.log

    def initialize(self):
        # TODO: finish initialization
        self.log.debug("[lite] loading addons ...")
        self.log.debug(f"[lite] OK loaded {len(self.addons)} addon")

    @default("addons")
    def _default_addons(self):
        """initialize addons from entry_points"""
        addons = {}
        for name, addon in entrypoints.get_group_named(ADDON_ENTRYPOINT).items():
            self.log.debug(f"[lite] [{name}] addon init ...")
            try:
                addon_inst = addon.load()(manager=self)
                addons[name] = addon_inst
                self.log.debug(
                    f"""[lite] [{name}] {addon_inst.__class__.__name__} will {", ".join(addon_inst.__all__)}"""
                )
            except Exception as err:
                self.log.warning(f"[lite] Failed to load addon: {name}", exc_info=err)
        return addons

    @default("lite_dir")
    def _default_lite_dir(self):
        return Path.cwd()

    @default("config")
    def _default_config(self):
        return {}

    async def _run_addon_hook(self, hook):
        self.log.debug(f"[lite] [{hook}] ...")
        for stage in ["pre_", "", "post_"]:
            attr = f"{stage}{hook}"
            self.log.debug(f"[lite] [{hook}] [{stage}] ...")
            for name, addon in self.addons.items():
                self.log.debug(f"[lite] [{hook}] [{stage}] [{name}] []...")
                if attr in addon.__all__:
                    try:
                        self.log.debug(f"[lite] [{hook}] [{stage}] [{name}] [RUN] ...")
                        await getattr(addon, attr)(self)
                    except Exception as err:
                        self.log.error(
                            f"[lite] [{hook}] [{stage}] [{name}] [ERR] {err}"
                        )
                else:
                    self.log.debug(f"[lite] [{hook}] [{stage}] [{name}] NO")

            self.log.debug(f"[lite] [{hook}] [{stage}] OK")
        self.log.debug(f"[lite] [{hook}] OK")

    async def init(self):
        self.log.debug("[lite] [init] ...")
        await self._run_addon_hook("init")
        self.log.debug("[lite] [init] OK")

    async def validate(self):
        await self._run_addon_hook("validate")

    async def build(self):
        await self._run_addon_hook("build")

    async def check(self):
        await self._run_addon_hook("check")

    async def publish(self):
        await self._run_addon_hook("publish")
