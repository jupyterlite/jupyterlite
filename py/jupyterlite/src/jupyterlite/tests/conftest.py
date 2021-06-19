"""pytest configuration for jupyterlite"""

import time

import pytest


@pytest.fixture
def an_empty_lite_dir(tmp_path):
    lite_dir = tmp_path / "a_lite_dir"
    lite_dir.mkdir()
    return lite_dir


@pytest.fixture
def source_date_epoch(monkeypatch):
    source_date_epoch_ = int(time.time())
    print("SOURCE_DATE_EPOCH is", source_date_epoch_)

    monkeypatch.setenv("SOURCE_DATE_EPOCH", str(source_date_epoch_))
    return source_date_epoch_
