# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

"""tests of archive extraction"""

import io
import tarfile

import pytest

from jupyterlite_core.addons.base import BaseAddon
from jupyterlite_core.manager import LiteManager


def test_extract_rejects_sibling_path_traversal(tmp_path):
    """a tar member may not escape into a sibling folder that shares the destination prefix"""
    archive = tmp_path / "evil.tgz"
    dest = tmp_path / "dest"

    with tarfile.open(archive, "w:gz") as tar:
        tar.addfile(tarfile.TarInfo("../dest-sibling/evil.txt"), io.BytesIO(b""))

    addon = BaseAddon(LiteManager(no_libarchive=True))

    with pytest.raises(Exception, match="Attempted Path Traversal"):
        addon.extract_one(archive, dest)

    assert not (tmp_path / "dest-sibling").exists()
