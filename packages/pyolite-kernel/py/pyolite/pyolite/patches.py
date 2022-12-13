def patch_matplotlib():
    import os

    if not os.environ.get("MPLBACKEND"):
        os.environ["MPLBACKEND"] = "module://matplotlib_inline.backend_inline"


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
