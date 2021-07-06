import os
from io import BytesIO

os.environ["MPLBACKEND"] = "AGG"

import matplotlib.pyplot
from IPython.display import display

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
