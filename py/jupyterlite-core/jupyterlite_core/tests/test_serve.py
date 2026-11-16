# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

"""Test that various serving options work"""

import json
import subprocess
import time
from unittest import mock

import pytest
from tornado import httpclient, httpserver, httputil, web

from jupyterlite_core.addons.serve import ServeAddon
from jupyterlite_core.manager import LiteManager

from .conftest import CI, DARWIN, LINUX, PYPY

if CI and DARWIN:  # pragma: no cover
    pytest.skip("skipping flaky MacOS tests", allow_module_level=True)

if CI and LINUX and PYPY:  # pragma: no cover
    pytest.skip("skipping flaky Linux/PyPy tests", allow_module_level=True)


@pytest.mark.parametrize("base_url", [None, "/@foo/"])
def test_serve(an_empty_lite_dir, script_runner, base_url, an_unused_port):  # pragma: no cover
    """verify that serving kinda works"""
    args = ["jupyter", "lite", "serve", "--port", f"{an_unused_port}"]

    http_headers = {"x-foo": "bar"}
    extra_http_headers = {"x-baz": "boo"}
    all_headers = {**http_headers, **extra_http_headers}

    config = {
        "LiteBuildConfig": {
            "http_headers": http_headers,
            "extra_http_headers": extra_http_headers,
        }
    }

    config_path = an_empty_lite_dir / "jupyter_lite_config.json"
    config_path.write_text(json.dumps(config), encoding="utf-8")

    if base_url:
        args += ["--base-url", base_url]
    else:
        base_url = "/"

    url = f"http://127.0.0.1:{an_unused_port}{base_url}"

    server = subprocess.Popen(args, cwd=str(an_empty_lite_dir))  # noqa: S603
    time.sleep(5)

    # Check if server process is still running
    if server.poll() is not None:
        raise RuntimeError(f"Server process exited early with code {server.returncode}")

    app_urls = [""]
    for app in ["lab", "tree", "repl"]:
        app_urls += [
            f"{app}",
            f"{app}/",
            f"{app}/index.html",
        ]

    maybe_errors = [
        _fetch_without_errors(f"{url}{frag}", expect_headers=all_headers) for frag in app_urls
    ]

    errors = [e for e in maybe_errors if e]

    try:
        assert not errors
        response = httpclient.HTTPClient().fetch(
            f"{url}notebooks?path=foo.ipynb", follow_redirects=False, raise_error=False
        )
        assert response.code == 301
        assert response.headers["Location"] == f"{base_url}notebooks/?path=foo.ipynb"
    finally:
        _fetch_without_errors(f"{url}shutdown")
        server.wait(timeout=10)


def test_serve_refuses_protocol_relative_redirect(tmp_path, monkeypatch):
    """the static handler refuses a ``//`` redirect itself, as tornado < 6.3.2 does not"""

    class CapturedAppError(Exception):
        pass

    class FakeServer:
        def __init__(self, app):
            raise CapturedAppError(app)

    monkeypatch.setattr(httpserver, "HTTPServer", FakeServer)
    addon = ServeAddon(LiteManager(output_dir=tmp_path))
    monkeypatch.setattr(addon, "_patch_mime", lambda: None)
    with pytest.raises(CapturedAppError) as captured:
        addon._serve_tornado()

    app = captured.value.args[0]
    rule = next(
        rule for rule in app.wildcard_router.rules if issubclass(rule.target, web.StaticFileHandler)
    )
    # tornado < 6.3.2 redirects this path when it names a directory inside the output directory
    uri = f"//evil.example/..{tmp_path.as_posix()}/lab"
    request = httputil.HTTPServerRequest(
        start_line=httputil.RequestStartLine("GET", uri, "HTTP/1.1"),
        headers=httputil.HTTPHeaders({"Host": "127.0.0.1"}),
        connection=mock.Mock(),
    )
    handler = rule.target(app, request, **rule.target_kwargs)
    # only reached without the guard: keep that failure a plain "DID NOT RAISE"
    monkeypatch.setattr(handler, "finish", lambda: None)

    # tornado >= 6.3.2 refuses this path before redirecting, so call the redirect it would make
    with pytest.raises(web.HTTPError) as error:
        handler.redirect(f"{request.path}/", permanent=True)

    assert error.value.status_code == 403
    assert "Location" not in handler._headers


def _fetch_without_errors(url, retries=15, expect_headers=None):  # pragma: no cover
    retries = 15
    errors = []

    while retries:
        retries -= 1
        response = None
        try:
            client = httpclient.HTTPClient()
            response = client.fetch(url)
            assert b"jupyter-config-data" in response.body
            # it worked, eventually: clear errors
            errors = []
            break
        except Exception as error:  # pragma: no cover
            print(f"{error}: {retries} retries left...")
            time.sleep(1.0)
            errors = [error]

    if response and expect_headers:
        errors = []
        for header, value in expect_headers.items():
            try:
                assert response.headers[header] == value
            except Exception as err:  # pragma: no cover
                errors += [err]

    return errors
