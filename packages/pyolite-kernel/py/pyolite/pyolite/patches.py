import base64
import os
from io import BytesIO

os.environ["MPLBACKEND"] = "AGG"

from IPython.display import display

from .display import Image

import importhook


def register_patch(module_name, path, method_name, function):
    @importhook.on_import(module_name)
    def on_pil_import(module):
        new_module = importhook.copy_module(module)
        obj = new_module
        for item in path.split("."):
            obj = getattr(obj, item)
        original = getattr(obj, method_name)
        setattr(obj, "__wrapped__", original)
        setattr(obj, method_name, function)
        return new_module


def matplotlib_show(self):
    buf = BytesIO()
    self.savefig(buf, format="png")
    buf.seek(0)
    display(Image(buf.read()))
    self.clf()


def image_repr_png(self):
    byte = self.__wrapped__()
    return base64.b64encode(byte).decode("utf-8")


def register_patches():
    register_patch("PIL.Image", "Image", "_repr_png_", image_repr_png)
    register_patch("matplotlib", "pyplot", "show", matplotlib_show)
