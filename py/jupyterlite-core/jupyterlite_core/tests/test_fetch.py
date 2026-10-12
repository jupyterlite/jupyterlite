"""tests for fetching remote files"""

import io
import os
import time
import urllib.request
from pathlib import Path

import pytest

from jupyterlite_core.addons.base import BaseAddon
from jupyterlite_core.manager import LiteManager

# Wed, 01 Jan 2020 00:00:00 GMT
A_LAST_MODIFIED = "Wed, 01 Jan 2020 00:00:00 GMT"
A_LAST_MODIFIED_EPOCH = 1577836800

# time zones east and west of UTC, so a local-time reading of a GMT header
# lands on either side of the right answer
SOME_TIME_ZONES = ["UTC", "America/Toronto", "Australia/Sydney"]

NOT_A_DATE = "the beginning of time"


class _FakeResponse(io.BytesIO):
    def __init__(self, headers):
        super().__init__(b"hello")
        self.headers = headers

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()


@pytest.fixture
def an_addon(an_empty_lite_dir):
    return BaseAddon(manager=LiteManager(lite_dir=an_empty_lite_dir))


def _fetch(monkeypatch, an_addon, tmp_path, headers, tz):
    monkeypatch.setattr(urllib.request, "urlopen", lambda req: _FakeResponse(headers))
    monkeypatch.setenv("TZ", tz)
    time.tzset()
    dest = Path(tmp_path) / tz.replace("/", "_") / "a-file.tgz"
    an_addon.fetch_one("https://example.com/a-file.tgz", dest)
    return dest


@pytest.mark.skipif(not hasattr(time, "tzset"), reason="needs POSIX tzset")
@pytest.mark.parametrize("tz", SOME_TIME_ZONES)
def test_fetch_one_last_modified(monkeypatch, an_addon, tmp_path, tz):
    """``Last-Modified`` should give the same mtime whatever the machine's time zone."""
    dest = _fetch(monkeypatch, an_addon, tmp_path, {"Last-Modified": A_LAST_MODIFIED}, tz)
    assert dest.exists()
    assert dest.stat().st_mtime == A_LAST_MODIFIED_EPOCH


@pytest.mark.skipif(not hasattr(time, "tzset"), reason="needs POSIX tzset")
def test_fetch_one_last_modified_with_offset(monkeypatch, an_addon, tmp_path):
    """A header may carry an offset other than GMT."""
    dest = _fetch(
        monkeypatch,
        an_addon,
        tmp_path,
        {"Last-Modified": "Tue, 31 Dec 2019 19:00:00 -0500"},
        "UTC",
    )
    assert dest.stat().st_mtime == A_LAST_MODIFIED_EPOCH


@pytest.mark.skipif(not hasattr(time, "tzset"), reason="needs POSIX tzset")
@pytest.mark.parametrize("headers", [{}, {"Last-Modified": NOT_A_DATE}])
def test_fetch_one_without_usable_last_modified(monkeypatch, an_addon, tmp_path, headers):
    """A missing or unparsable header leaves the file alone instead of failing."""
    before = time.time()
    dest = _fetch(monkeypatch, an_addon, tmp_path, headers, "UTC")
    assert dest.read_bytes() == b"hello"
    assert dest.stat().st_mtime >= before - 60


@pytest.fixture(autouse=True)
def _restore_tz():
    tz = os.environ.get("TZ")
    yield
    if tz is None:
        os.environ.pop("TZ", None)
    else:
        os.environ["TZ"] = tz
    if hasattr(time, "tzset"):
        time.tzset()
