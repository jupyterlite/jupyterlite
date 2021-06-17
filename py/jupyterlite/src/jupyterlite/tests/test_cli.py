import time

import pytest

from jupyterlite import __version__
from jupyterlite.constants import HOOKS

# TOOD: others?
LITE_INVOCATIONS = [
    ["jupyter-lite"],
    ["jupyter", "lite"],
]

TRASH = [".jupyterlite.doit.db"]

A_GOOD_BUILD = [
    *TRASH,
    "_output/package.json",
    "_output/jupyter-lite.json",
    "_output/index.html",
]

FAST_HOOKS = ["list", "status"]
NOT_SERVE_HOOK = [h for h in HOOKS if h != "serve"]


@pytest.mark.parametrize("lite_args", LITE_INVOCATIONS)
@pytest.mark.script_launch_mode("subprocess")
def test_cli_version(script_runner, lite_args):
    """do various invocations work"""
    returned_version = script_runner.run(*lite_args, "--version")
    assert returned_version.success
    assert __version__ in returned_version.stdout
    assert returned_version.stderr == ""


@pytest.mark.script_launch_mode("subprocess")
@pytest.mark.parametrize("lite_hook", ["list", "status"])
def test_cli_status_null(an_empty_lite_dir, script_runner, lite_hook):
    """do the "side-effect-free" commands create exactly one file?"""
    returned_status = script_runner.run(
        "jupyter", "lite", lite_hook, cwd=an_empty_lite_dir
    )
    assert returned_status.success
    files = set(an_empty_lite_dir.rglob("*"))
    # we would expect to see our build cruft sqlite
    assert len(files) == 1
    dododb = an_empty_lite_dir / ".jupyterlite.doit.db"
    assert files == {dododb}


@pytest.mark.script_launch_mode("subprocess")
@pytest.mark.parametrize("lite_hook", NOT_SERVE_HOOK)
def test_cli_check(an_empty_lite_dir, script_runner, lite_hook):
    expected_files = TRASH if lite_hook in FAST_HOOKS else A_GOOD_BUILD
    started = time.time()
    returned_status = script_runner.run(
        "jupyter", "lite", lite_hook, cwd=an_empty_lite_dir
    )
    duration_1 = time.time() - started
    assert returned_status.success
    files = set(an_empty_lite_dir.rglob("*"))
    assert len(files) >= 1
    for expected in expected_files:
        assert (an_empty_lite_dir / expected).exists()

    if lite_hook not in FAST_HOOKS:
        # re-run, be faster
        restarted = time.time()
        rereturned_status = script_runner.run(
            "jupyter", "lite", lite_hook, cwd=an_empty_lite_dir
        )
        duration_2 = time.time() - restarted
        assert rereturned_status.success
        assert duration_1 > duration_2

        # force
        forced_status = script_runner.run(
            "jupyter", "lite", lite_hook, "--force", cwd=an_empty_lite_dir
        )
        assert forced_status.success


@pytest.mark.script_launch_mode("subprocess")
def test_cli_raw_doit(an_empty_lite_dir, script_runner):
    returned_status = script_runner.run(
        "jupyter", "lite", "doit", "--", "--help", cwd=an_empty_lite_dir
    )
    assert returned_status.success
    assert "http://pydoit.org" in returned_status.stdout
