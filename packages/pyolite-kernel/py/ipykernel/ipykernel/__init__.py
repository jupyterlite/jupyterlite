"""An ipykernel mock"""

__version__ = "6.15.1"
__all__ = ["Comm", "CommManager", "__version__"]

from .comm import Comm, CommManager
