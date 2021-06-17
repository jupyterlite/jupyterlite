import pytest

from jupyterlite import __version__


@pytest.mark.parametrize(
    "lite_args",
    [
        ["jupyter-lite"],
        ["jupyter", "lite"],
    ],
)
@pytest.mark.script_launch_mode("subprocess")
def test_cli_version(tmp_path, script_runner, lite_args):
    ret = script_runner.run(*lite_args, "--version")
    assert ret.success
    assert __version__ in ret.stdout
    assert ret.stderr == ""
