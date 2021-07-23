import json
from pathlib import Path

__js__ = json.loads(
    (Path(__file__).parent.resolve() / "labextension/package.json").read_text(
        encoding="utf-8"
    )
)
__version__ = __js__["version"]
__all__ = ["__version__", "__js__"]
