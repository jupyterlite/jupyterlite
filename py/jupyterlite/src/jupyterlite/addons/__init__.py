from traitlets.config import LoggingConfigurable
from traitlets import Instance

from ..manager import LiteManager


class BaseAddon(LoggingConfigurable):
    """A base class for addons to the JupyterLite build chain

    This is entirely optional: really just needs to be a function of the form:

    def the_addon_in_entry_point(manager: LiteManager):
        return {
            "__all__": ["pre_init"],
            "pre_init": lambda m: print(f"do something to m.lite_dir")
        }
    """

    manager = Instance(LiteManager)

    @property
    def log(self):
        return self.manager.log
