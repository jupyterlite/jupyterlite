# This is our ipykernel mock
from ipykernel import CommManager
from IPython.utils.tokenutil import line_at_cursor
from pyodide_js import loadPackagesFromImports as _load_packages_from_imports


class Pyolite:
    def __init__(self, interpreter):
        self.interpreter = interpreter
        self.comm_manager = CommManager(kernel=self)
        self._parent_header = None

    def get_parent(self):
        # TODO mimick ipykernel's get_parent signature
        # (take a channel parameter)
        return self._parent_header

    def comm_info(self, target_name=""):
        comms = {}

        for comm_id, comm in self.comm_manager.comms.items():
            if target_name == "" or comm.target_name == target_name:
                comms[comm_id] = dict(target_name=comm.target_name)

        return comms

    def complete(self, code, cursor_pos):
        if cursor_pos is None:
            cursor_pos = len(code)
        line, offset = line_at_cursor(code, cursor_pos)
        line_cursor = cursor_pos - offset

        txt, matches = self.interpreter.complete("", line, line_cursor)
        return {
            "matches": matches,
            "cursor_end": cursor_pos,
            "cursor_start": cursor_pos - len(txt),
            "metadata": {},
            "status": "ok",
        }

    async def run(self, code):
        self.interpreter._last_traceback = None
        exec_code = self.interpreter.transform_cell(code)
        await _load_packages_from_imports(exec_code)
        if self.interpreter.should_run_async(code):
            self.result = await self.interpreter.run_cell_async(
                code, store_history=True
            )
        else:
            self.result = self.interpreter.run_cell(code, store_history=True)

        results = {}
        results["payload"] = self.interpreter.payload_manager.read_payload()
        self.interpreter.payload_manager.clear_payload()

        if self.interpreter._last_traceback is None:
            results["status"] = "ok"
        else:
            last_traceback = self.interpreter._last_traceback
            results["status"] = "error"
            results["ename"] = last_traceback["ename"]
            results["evalue"] = last_traceback["evalue"]
            results["traceback"] = last_traceback["traceback"]

        return results
