from pyodide.console import InteractiveConsole

console = InteractiveConsole(
    persistent_stream_redirection=True
)


def locals():
    return console.locals


def foo():
    print('hello world')


async def eval(code):
    console.runcode(code)
    await console.run_complete
