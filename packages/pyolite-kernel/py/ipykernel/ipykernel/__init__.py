"""An ipykernel mock"""

__version__ = "5.5.5"
__all__ = ["Comm", "CommManager", "__version__"]

from .comm import Comm, CommManager
