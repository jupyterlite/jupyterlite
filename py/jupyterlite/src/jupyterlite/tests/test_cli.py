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
def test_cli_version(lite_args, script_runner):
    """do various invocations work"""
    returned_version = script_runner.run(*lite_args, "--version")
    assert returned_version.success
    assert __version__ in returned_version.stdout
    assert returned_version.stderr == ""


@pytest.mark.parametrize("lite_args", LITE_INVOCATIONS)
@pytest.mark.parametrize("help", ["-h", "--help"])
@pytest.mark.script_launch_mode("subprocess")
def test_cli_help(lite_args, help, script_runner):
    """does help work"""
    returned_version = script_runner.run(*lite_args, help)
    assert returned_version.success
    assert returned_version.stderr == ""


@pytest.mark.script_launch_mode("subprocess")
@pytest.mark.parametrize("lite_hook", ["list", "status"])
def test_cli_status_null(lite_hook, an_empty_lite_dir, script_runner):
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
def test_cli_any_hook(lite_hook, an_empty_lite_dir, script_runner):
    """does all the hooks basically work"""
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

    if lite_hook in FAST_HOOKS:
        return

    # re-run, be faster
    restarted = time.time()
    rereturned_status = script_runner.run(
        "jupyter", "lite", lite_hook, cwd=an_empty_lite_dir
    )
    duration_2 = time.time() - restarted
    assert rereturned_status.success
    assert duration_1 > duration_2

    # force, detect files
    readme = an_empty_lite_dir / "README.md"
    readme.write_text("# hello world", encoding="utf-8")

    overrides = an_empty_lite_dir / "overrides.json"
    overrides.write_text("{}", encoding="utf-8")

    forced_status = script_runner.run(
        "jupyter",
        "lite",
        lite_hook,
        "--force",
        "--files",
        readme,
        "--overrides",
        overrides,
        cwd=an_empty_lite_dir,
    )

    if A_GOOD_BUILD[-1] in expected_files and lite_hook not in ["init"]:
        print(sorted(an_empty_lite_dir.rglob("_output")))
        assert (an_empty_lite_dir / "_output/files/README.md").exists()
        assert forced_status.success


@pytest.mark.script_launch_mode("subprocess")
def test_cli_raw_doit(an_empty_lite_dir, script_runner):
    """does raw doit work"""
    returned_status = script_runner.run(
        "jupyter", "lite", "doit", "--", "--help", cwd=an_empty_lite_dir
    )
    assert returned_status.success
    assert "http://pydoit.org" in returned_status.stdout
