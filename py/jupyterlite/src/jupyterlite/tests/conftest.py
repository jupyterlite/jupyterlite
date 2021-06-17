"""pytest configuration for jupyterlite"""

import pytest


@pytest.fixture
def an_empty_lite_dir(tmp_path):
    lite_dir = tmp_path / "a_lite_dir"
    lite_dir.mkdir()
    return lite_dir
