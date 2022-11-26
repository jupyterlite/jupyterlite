"""utilities for working with optional depednencies."""
import warnings
from functools import lru_cache
from typing import Optional


@lru_cache(100)
def has_optional_dependency(importable: str, hint: Optional[str] = None) -> bool:
    """whether a given optional dependency is even installed, with an optional hint"""
    try:
        __import__(importable)
        return True
    except Exception as error:
        if hint:
            warnings.warn(hint.format(error=error))
        return False
