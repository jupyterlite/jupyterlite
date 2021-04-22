"""A Python kernel backed by Pyodide"""

__version__ = "0.1.0"

from .kernel import Pyolite

kernel_instance = Pyolite()
