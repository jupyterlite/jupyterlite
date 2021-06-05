from jupyter_core.application import JupyterApp
from .. import __version__

class LiteApp(JupyterApp):
    """build ready-to-serve JupyterLite sites"""
    pass


main = launch_new_instance = LiteApp.launch_instance
