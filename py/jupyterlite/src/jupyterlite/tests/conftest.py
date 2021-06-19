"""pytest configuration for jupyterlite"""

from datetime import datetime

import pytest


@pytest.fixture
def an_empty_lite_dir(tmp_path):
    lite_dir = tmp_path / "a_lite_dir"
    lite_dir.mkdir()
    return lite_dir


@pytest.fixture
def source_date_epoch(monkeypatch):
    now = int(datetime.utcnow().timestamp())

    print("SOURCE_DATE_EPOCH is", now)

    monkeypatch.setenv("SOURCE_DATE_EPOCH", str(now))
    return now
