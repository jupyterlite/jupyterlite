def patch_matplotlib():
    import os
    from io import BytesIO

    # before importing matplotlib
    # to avoid the wasm backend (which needs `js.document`, not available in worker)
    os.environ["MPLBACKEND"] = "AGG"

    import matplotlib.pyplot
    from IPython.display import display

    from .display import Image

    _old_show = matplotlib.pyplot.show
    assert _old_show, "matplotlib.pyplot.show"

    def show(*,block=None):
        buf = BytesIO()
        matplotlib.pyplot.savefig(buf, format="png")
        buf.seek(0)
        display(Image(buf.read()))
        matplotlib.pyplot.clf()

    matplotlib.pyplot.show = show


def patch_pillow():
    import base64

    from PIL import Image as PILImage

    _old_repr_png = PILImage.Image._repr_png_
    assert _old_repr_png

    def _repr_png_(self):
        byte = _old_repr_png(self)
        return base64.b64encode(byte).decode("utf-8")

    PILImage.Image._repr_png_ = _repr_png_


ALL_PATCHES = [
    patch_pillow,
    patch_matplotlib,
]


def apply_patches():
    import warnings

    for patch in ALL_PATCHES:
        try:
            patch()
        except Exception as err:
            warnings.warn("failed to apply patch", patch, err)
