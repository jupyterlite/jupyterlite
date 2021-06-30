# This is our ipykernel mock
from ipykernel import CommManager


class Pyolite:
    def __init__(self, interpreter):
        self.interpreter = interpreter
        self.comm_manager = CommManager(kernel=self)

    def comm_info(self, target_name=""):
        comms = {}

        for comm_id, comm in self.comm_manager.comms.items():
            if target_name == "" or comm.target_name == target_name:
                comms[comm_id] = dict(target_name=comm.target_name)

        return comms
