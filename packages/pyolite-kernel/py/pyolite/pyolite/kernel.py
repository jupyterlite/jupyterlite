# This is our ipykernel mock
from ipykernel import CommManager

from .display import display_publisher
from .interpreter import Interpreter


class Pyolite:
    def __init__(self):
        self.interpreter = Interpreter()
        self.display_publisher = display_publisher
        self.comm_manager = CommManager(kernel=self)
