from jupyter_core.application import JupyterApp

class LiteApp(JupyterApp):
    pass

main = launch_new_instance = LiteApp.launch_instance