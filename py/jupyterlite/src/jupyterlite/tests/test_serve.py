"""Test that various serving options work"""

import subprocess
import time

import pytest
from tornado import httpclient

from .conftest import CI, DARWIN, LINUX, PYPY

if CI and DARWIN:  # pragma: no cover
    pytest.skip("skipping flaky MacOS tests", allow_module_level=True)

if CI and LINUX and PYPY:  # pragma: no cover
    pytest.skip("skipping flaky Linux/PyPy tests", allow_module_level=True)


@pytest.mark.parametrize("base_url", [None, "/@foo/"])
def test_serve(
    an_empty_lite_dir, script_runner, base_url, an_unused_port
):  # pragma: no cover
    """verify that serving kinda works"""
    args = ["jupyter", "lite", "serve", "--port", f"{an_unused_port}"]

    if base_url:
        args += ["--base-url", base_url]
    else:
        base_url = "/"

    url = f"http://127.0.0.1:{an_unused_port}{base_url}"

    server = subprocess.Popen(args, cwd=str(an_empty_lite_dir))
    time.sleep(2)

    app_urls = [""]
    for app in ["lab", "retro"]:
        app_urls += [
            f"{app}/",
            f"{app}/index.html",
        ]
        if app == "retro":
            app_urls += [f"{app}/tree/", f"{app}/tree/index.html"]

    maybe_errors = [_fetch_without_errors(f"{url}{frag}") for frag in app_urls]

    errors = [e for e in maybe_errors if e is not None]

    try:
        assert not errors
    finally:
        server.terminate()
        server.wait(timeout=10)


def _fetch_without_errors(url, retries=10):  # pragma: no cover
    retries = 10
    last_error = None

    while retries:
        retries -= 1
        last_error = None
        try:
            client = httpclient.HTTPClient()
            r = client.fetch(url)
            assert b"jupyter-config-data" in r.body
            break
        except Exception as err:  # pragma: no cover
            print(f"{err}: {retries} retries left...")
            time.sleep(0.5)
            last_error = err
    return last_error
