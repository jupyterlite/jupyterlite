from jupyter_core.application import JupyterApp

from ._version import __version__

class LiteApp(JupyterApp):
    version = __version__

main = launch_new_instance = LiteApp.launch_instance