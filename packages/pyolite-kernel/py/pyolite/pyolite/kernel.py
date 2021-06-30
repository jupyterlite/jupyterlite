# This is our ipykernel mock
from ipykernel import CommManager

from .custom_display import XDisplayHook, XDisplayPublisher
from .interpreter import Interpreter


class Pyolite:
    def __init__(self):
        self.interpreter = Interpreter(
            kernel=self,
            displayhook_class=XDisplayHook,
            display_pub_class=XDisplayPublisher,
        )
        self.comm_manager = CommManager(kernel=self)

    def comm_info(self, target_name=""):
        comms = {}

        for comm_id, comm in self.comm_manager.comms.items():
            if target_name == "" or comm.target_name == target_name:
                comms[comm_id] = dict(target_name=comm.target_name)

        return comms
