"""An ipykernel mock"""

__version__ = "6.9.2"
__all__ = ["Comm", "CommManager", "__version__"]

from .comm import Comm, CommManager
