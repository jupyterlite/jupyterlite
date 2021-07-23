from ._version import __js__, __version__


def _jupyter_labextension_paths():
    return [{"src": "labextension", "dest": __js__["name"]}]


__all__ = ["_jupyter_labextension_paths", "__version__"]
