from io import BytesIO
import os

os.environ["MPLBACKEND"] = "AGG"

import matplotlib.pyplot

from .display import display, Image


def ensure_matplotlib_patch():
    _old_show = matplotlib.pyplot.show

    def show():
        buf = BytesIO()
        matplotlib.pyplot.savefig(buf, format="png")
        buf.seek(0)
        display(Image(buf.read()))
        matplotlib.pyplot.clf()

    matplotlib.pyplot.show = show
