from traitlets.config import LoggingConfigurable
from traitlets import Instance

from ..manager import LiteManager


class BaseAddon(LoggingConfigurable):
    """A base class for addons to the JupyterLite build chain

    Subclassing this is optional, but provides some useful guidelines
    """

    manager = Instance(LiteManager)

    @property
    def log(self):
        return self.manager.log
