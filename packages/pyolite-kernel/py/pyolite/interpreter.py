from asyncio import ensure_future

from pyodide.console import InteractiveConsole

class Interpreter(InteractiveConsole):
    def __init__(self):
        super().__init__(persistent_stream_redirection=False)

    def runcode(self, code):
        self.run_complete = ensure_future(
            self.load_packages_and_run(self.run_complete, code)
        )

    async def run(self, code):
        self.runcode(code)
        result = await self.run_complete
        return result
