def patch_matplotlib():
    import os

    if not os.environ.get("MPLBACKEND"):
        os.environ["MPLBACKEND"] = "module://matplotlib_inline.backend_inline"


ALL_PATCHES = [
    patch_matplotlib,
]


def apply_patches():
    import warnings

    for patch in ALL_PATCHES:
        try:
            patch()
        except Exception as err:
            warnings.warn("failed to apply patch", patch, err)
