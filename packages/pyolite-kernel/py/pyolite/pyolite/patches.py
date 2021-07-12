import base64
import os
from io import BytesIO
import types

os.environ["MPLBACKEND"] = "AGG"

import matplotlib.pyplot
from IPython.display import display
from PIL import Image as PILImage

from .display import Image

import importhook


def register_patch(module_name, path, method_name, function):
    @importhook.on_import(module_name)
    def on_import(module):
        new_module = importhook.copy_module(module)
        obj = new_module
        if path:
            for item in path.split("."):
                obj = getattr(obj, item)
        original = getattr(obj, method_name)
        # Save the original, in case we need it
        try:
            setattr(function, "__wrapped__", original)
        except Exception:
            pass
        # Set the new function/method:
        if isinstance(original, types.FunctionType):
            setattr(obj, method_name, function)
        else:
            setattr(obj, method_name, types.MethodType(function, obj))
        return new_module


def matplotlib_show(*args, **kwargs):
    from matplotlib import pyplot

    buf = BytesIO()
    pyplot.savefig(buf, format="png")
    buf.seek(0)
    display(Image(buf.read()))
    pyplot.clf()


def image_repr_png(self):
    byte = image_repr_png.__wrapped__(self)
    return base64.b64encode(byte).decode("utf-8")


def register_patches():
    register_patch("PIL.Image", "Image", "_repr_png_", image_repr_png)
    register_patch("matplotlib.pyplot", "", "show", matplotlib_show)
