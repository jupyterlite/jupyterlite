import os
import tempfile

os.environ['MPLBACKEND'] = 'AGG'

import matplotlib.pyplot

from .display import display, Image


def ensure_matplotlib_patch():
    _old_show = matplotlib.pyplot.show

    def show():
        tmp_file = f"{tempfile.NamedTemporaryFile().name}.png"
        matplotlib.pyplot.savefig(tmp_file)
        with open(tmp_file, 'rb') as f:
            data = f.read()
        os.remove(tmp_file)
        display(Image(data))

    matplotlib.pyplot.show = show
