from pyodide.console import InteractiveConsole

class Interpreter(InteractiveConsole):
    def __init__(self):
        super().__init__(persistent_stream_redirection=True)

    def display(self, result):
        """
        Called with the result when code has finished executing.
        """
        print('RESULT')
        print(result)

    def runcode(self, code, stdout_callback, stderr_callback):
        self.stdout_callback = stdout_callback
        self.stderr_callback = stderr_callback
        super().runcode(code)
