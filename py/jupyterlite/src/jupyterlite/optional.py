"""utilities for working with optional depednencies."""
import warnings
from functools import lru_cache
from importlib.util import find_spec
from typing import Optional


@lru_cache(100)
def has_optional_dependency(importable: str, hint: Optional[str] = None) -> bool:
    """whether a given optional dependency is even installed, with an optional hint"""
    if find_spec(importable):
        return True
    if hint:
        warnings.warn(hint)
    return False
