import base64
import os
from io import BytesIO

os.environ["MPLBACKEND"] = "AGG"

import matplotlib.pyplot
from IPython.display import display
from PIL import Image as PILImage

from .display import Image


def ensure_matplotlib_patch():
    _old_show = matplotlib.pyplot.show
    assert _old_show

    def show():
        buf = BytesIO()
        matplotlib.pyplot.savefig(buf, format="png")
        buf.seek(0)
        display(Image(buf.read()))
        matplotlib.pyplot.clf()

    matplotlib.pyplot.show = show


def ensure_pil_patch():
    _old_repr_png = PILImage.Image._repr_png_
    assert _old_repr_png

    def _repr_png_(self):
        byte = _old_repr_png(self)
        return base64.b64encode(byte).decode("utf-8")

    PILImage.Image._repr_png_ = _repr_png_
