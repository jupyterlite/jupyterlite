import json
from pathlib import Path

from setuptools import find_packages, setup

HERE = Path(__file__).parent.resolve()
PY = "the_smallest_extension"
EXT = HERE / PY / "labextension"
__js__ = json.loads((EXT / "package.json").read_text(encoding="utf-8"))

NAME = __js__["name"]

SHARE = f"share/jupyter/labextensions/{NAME}"

setup_args = dict(
    name=NAME,
    version=__js__["version"],
    packages=find_packages(),
    data_files=[
        (
            f"{SHARE}/{str(p.parent.relative_to(EXT).as_posix())}",
            [str(p.relative_to(HERE).as_posix())],
        )
        for p in EXT.rglob("*")
        if not p.is_dir()
    ],
)

if __name__ == "__main__":
    setup(**setup_args)
