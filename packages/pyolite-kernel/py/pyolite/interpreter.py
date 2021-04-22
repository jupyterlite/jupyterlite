from asyncio import ensure_future

from pyodide.console import _InteractiveConsole


def format_result(result):
    data = {"text/plain": repr(result)}
    if hasattr(result, "_repr_html_"):
        data["text/html"] = result._repr_html_()
    if hasattr(result, "_repr_svg_"):
        data["image/svg+xml"] = result._repr_svg_()
    if hasattr(result, "_repr_png_"):
        data["image/png"] = result._repr_png_()
    if hasattr(result, "_repr_latex_"):
        data["text/latex"] = result._repr_latex_()
    if hasattr(result, "_repr_json_"):
        data["application/json"] = result._repr_json_()
    bundle = {
        'data': data,
        'metadata': {}
    }
    return bundle


class Interpreter(_InteractiveConsole):
    def __init__(self):
        super().__init__(persistent_stream_redirection=False)
        self.display_callback = None

    def display(self, result):
        """
        Called with the result when code has finished executing.
        Override to prevent the default behavior
        """
        return

    def runcode(self, code):
        self.run_complete = ensure_future(
            self.load_packages_and_run(self.run_complete, code)
        )

    async def run(self, code):
        self.runcode(code)
        result = await self.run_complete
        return format_result(result)
