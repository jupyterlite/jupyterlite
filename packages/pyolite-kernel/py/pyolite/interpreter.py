from asyncio import ensure_future

from pyodide.console import _InteractiveConsole

from .display import display, format_result


class Interpreter(_InteractiveConsole):
    def __init__(self):
        super().__init__(persistent_stream_redirection=False)

    def display(self, result):
        """
        Called with the result when code has finished executing.
        Override to prevent the default behavior
        """
        return

    async def run(self, code):
        self.run_complete = ensure_future(
            self.load_packages_and_run(self.run_complete, code)
        )
        result = await self.run_complete
        if result is not None:
            return format_result(result)
