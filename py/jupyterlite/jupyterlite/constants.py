"""re-export the core constants and addons from the core package.
"""

import warnings

warnings.warn(
    """
Importing from the jupyterlite package is deprecated.
You can depend on the jupyterlite-core package instead, and import from jupyterlite_core.
""",
    DeprecationWarning,
    stacklevel=2,
)

from jupyterlite_core.constants import *  # noqa
