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

    @default("addons")
    def _default_addons(self):
        """initialize addons from entry_points"""
        addons = {}
        for name, addon in entrypoints.get_group_named(ADDON_ENTRYPOINT).items():
            try:
                addons[name] = addon.load()
            except Exception as err:
                self.log.warning(f"Failed to load addon: {name} {err}")
        return addons

    @default("lite_dir")
    def _default_lite_dir(self):
        return Path.cwd()

    @default("config")
    def _default_config(self):
        return {}

    async def _run_addon_hook(self, hook):
        for stage in ["pre_", "", "_post"]:
            attr = f"{stage}_{hook}"
            for name, addon in self.addons.items():
                if hasattr(addon, attr):
                    try:
                        await getattr(addon, attr)(self)
                    except Exception as err:
                        self.log.warning(f"[{attr}] Error in {name}: {err}")

    async def init(self):
        await self._run_addon_hook("init")

    async def validate(self):
        await self._run_addon_hook("validate")

    async def build(self):
        await self._run_addon_hook("build")

    async def check(self):
        await self._run_addon_hook("check")

    async def publish(self):
        await self._run_addon_hook("publish")
