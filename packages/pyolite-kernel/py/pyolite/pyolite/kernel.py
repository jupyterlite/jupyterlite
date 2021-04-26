from .display import display_publisher
from .interpreter import Interpreter


class Pyolite:
    def __init__(self):
        self.interpreter = Interpreter()
        self.display_publisher = display_publisher
