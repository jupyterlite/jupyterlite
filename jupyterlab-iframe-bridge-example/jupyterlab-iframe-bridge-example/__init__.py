from ._version import __version__


def _jupyter_labextension_paths():
    return [{
        "src": "labextension",
        "dest": "jupyterlab-iframe-bridge-example"
    }]

