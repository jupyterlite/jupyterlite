"""Handle efficient discovery of """
import sys
import warnings
from functools import lru_cache

from ..constants import ADDON_ENTRYPOINT

# See compatibility note on `group` keyword in
# https://docs.python.org/3/library/importlib.metadata.html#entry-points
if sys.version_info < (3, 10):
    from importlib_metadata import entry_points
else:
    from importlib.metadata import entry_points


def add_addon_aliases_and_flags(aliases, flags):
    """Update CLI aliases and flags from addons."""
    for name, impl in get_addon_implementations().items():
        addon_aliases = getattr(impl, "aliases", {})
        addon_flags = getattr(impl, "flags", {})

        for alias, trait_name in addon_aliases.items():
            if alias in aliases:
                warnings.warn(f"[lite] [{name}] alias --{alias} cannot be redefined")
                continue
            aliases[alias] = trait_name

        for flag, config_help in addon_flags.items():
            if flag not in flags:
                flags[flag] = config_help
            else:
                config, help = config_help
                for cls_name, traits in config.items():
                    if cls_name in flags[flag][0]:
                        warnings.warn(
                            f"[lite] [{name}] --{flag} cannot redefine {cls_name}"
                        )
                        continue
                    flags[flag][0][cls_name] = traits
                flags[flag][1] = "\n".join([flags[flag][1], help])


@lru_cache
def get_addon_implementations():
    """Load (and cache) addon implementations."""
    addon_implementations = {}
    for name, entry_point in get_addon_entry_points().items():
        try:
            addon_implementations[name] = entry_point.load()
        except Exception as err:
            warnings.warn(f"[lite] [{name}] failed to load: {err}")
    return addon_implementations


@lru_cache
def get_addon_entry_points():
    """Discover (and cache) modern entrypoints as a ``dict`` with sorted keys."""
    all_entry_points = {}
    for entry_point in entry_points(group=ADDON_ENTRYPOINT):
        name = entry_point.name
        if name in all_entry_points:
            warnings.warn(f"[lite] [{name}] addon already registered.")
            continue
        all_entry_points[name] = entry_point
    return dict(sorted(all_entry_points.items()))
