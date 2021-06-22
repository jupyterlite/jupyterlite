from pathlib import Path

from traitlets import TraitType


class CPath(TraitType):
    """A trait for casting to a Path. It might not actually exist yet"""

    def validate(self, obj, value) -> Path:
        if isinstance(value, Path):
            return value

        try:
            return Path(str(value))
        except Exception:
            self.error(obj, value)
