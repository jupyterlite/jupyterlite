"""tests of various mechanisms of using pyodide"""
import os
import shutil
import subprocess
from pathlib import Path

import pytest

ENV_VAR = "JUPYTERLITE_PYODIDE_URL"

TEST_PYODIDE_URL = os.environ.get(f"TEST_{ENV_VAR}")

if TEST_PYODIDE_URL is None:  # pragma: no cover
    pytest.skip("skipping pyodide tests", allow_module_level=True)


@pytest.fixture
def a_pyodide_server(an_unused_port):
    """serve up the pyodide archive"""
    root = Path(TEST_PYODIDE_URL).parent
    assert root.exists()

    p = subprocess.Popen(
        ["python", "-m", "http.server", "-b", "127.0.0.1", f"{an_unused_port}"],
        cwd=str(root),
    )
    url = f"http://localhost:{an_unused_port}"
    yield url
    p.terminate()


@pytest.mark.parametrize(
    "approach,path,kind",
    [
        ["cli", "local", "archive"],
        ["cli", "local", "folder"],
        ["cli", "remote", "archive"],
        ["env", "local", "archive"],
        ["env", "local", "folder"],
        ["env", "remote", "archive"],
        ["wellknown", None, None],
    ],
)
def test_pyodide(
    an_empty_lite_dir, script_runner, a_pyodide_server, approach, path, kind
):
    """can we fetch a pyodide archive, or use a local copy?"""
    env = dict(os.environ)
    pargs = []

    if approach == "wellknown":
        static = an_empty_lite_dir / "static"
        static.mkdir(parents=True, exist_ok=True)
        shutil.copytree(
            Path(TEST_PYODIDE_URL).parent / "pyodide/pyodide",
            static / "pyodide",
        )
    else:
        url = TEST_PYODIDE_URL

        if path == "remote":
            url = f"{a_pyodide_server}/{Path(url).name}"
        elif kind == "folder":
            url = str(Path(url).parent / "pyodide")

        if approach == "env":
            env[ENV_VAR] = url
        else:
            pargs += ["--pyodide", url]

    kwargs = dict(cwd=str(an_empty_lite_dir), env=env)

    status = script_runner.run("jupyter", "lite", "status", *pargs, **kwargs)
    assert status.success, "status did NOT succeed"

    build = script_runner.run("jupyter", "lite", "build", *pargs, **kwargs)
    assert build.success, "the build did NOT succeed"

    pyodide_path = an_empty_lite_dir / "_output/static/pyodide/pyodide.js"
    assert pyodide_path.exists(), "pyodide.js does not exist"

    check = script_runner.run("jupyter", "lite", "check", *pargs, **kwargs)
    assert check.success, "the check did NOT succeed"
