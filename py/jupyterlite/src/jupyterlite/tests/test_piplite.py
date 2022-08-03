"""tests of various mechanisms of providing federated_extensions"""
import json
import shutil

from pytest import mark

from .conftest import THE_NOTEBOOK_WHEEL, WHEELS


def has_wheel_after_build(an_empty_lite_dir, script_runner, ignore_notebook=False):
    """run a build, expecting the fixture wheel to be there"""
    build = script_runner.run("jupyter", "lite", "build", cwd=str(an_empty_lite_dir))
    assert build.success

    check = script_runner.run("jupyter", "lite", "check", cwd=str(an_empty_lite_dir))
    assert check.success

    output = an_empty_lite_dir / "_output"

    lite_json = output / "jupyter-lite.json"
    lite_data = json.loads(lite_json.read_text(encoding="utf-8"))
    assert lite_data["jupyter-config-data"]["litePluginSettings"][
        "@jupyterlite/pyolite-kernel-extension:kernel"
    ]["pipliteUrls"], "bad wheel urls"

    wheel_out = output / "pypi"
    assert (wheel_out / WHEELS[0].name).exists()
    wheel_index = output / "pypi/all.json"
    wheel_index_text = wheel_index.read_text(encoding="utf-8")
    assert WHEELS[0].name in wheel_index_text, wheel_index_text

    builtin_wheels = output / "build/pypi"
    builtin_index = builtin_wheels / "all.json"
    builtin_index_text = builtin_index.read_text(encoding="utf-8")

    if ignore_notebook:
        assert THE_NOTEBOOK_WHEEL not in builtin_index_text, builtin_index_text
        assert not (builtin_wheels / THE_NOTEBOOK_WHEEL).exists()
    else:
        assert THE_NOTEBOOK_WHEEL in builtin_index_text, builtin_index_text
        assert (builtin_wheels / THE_NOTEBOOK_WHEEL).exists()


@mark.parametrize(
    "remote,folder,ignore_notebook",
    [
        [True, False, None],
        [False, False, True],
        [False, True, None],
    ],
)
def test_piplite_urls(
    an_empty_lite_dir, script_runner, remote, folder, a_fixture_server, ignore_notebook
):
    """can we include a single wheel?"""
    ext = WHEELS[0]

    if remote:
        piplite_urls = [f"{a_fixture_server}/{ext.name}"]
    else:
        shutil.copy2(WHEELS[0], an_empty_lite_dir)
        if folder:
            piplite_urls = ["."]
        else:
            piplite_urls = [WHEELS[0].name]

    config = {
        "LiteBuildConfig": {
            "piplite_urls": piplite_urls,
            "apps": ["lab"],
            "ignore_sys_prefix": ["federated_extensions"],
        },
    }

    if ignore_notebook:
        config["LiteBuildConfig"]["ignore_piplite_builtins"] = ["notebook"]

    print("CONFIG", config)

    (an_empty_lite_dir / "jupyter_lite_config.json").write_text(json.dumps(config))

    has_wheel_after_build(an_empty_lite_dir, script_runner, ignore_notebook)


def test_lite_dir_wheel(an_empty_lite_dir, script_runner):
    wheel_dir = an_empty_lite_dir / "pypi"
    wheel_dir.mkdir()
    shutil.copy2(WHEELS[0], wheel_dir / WHEELS[0].name)

    has_wheel_after_build(an_empty_lite_dir, script_runner)


index_cmd = "jupyter", "lite", "pip", "index"


def test_piplite_cli_fail_missing(script_runner, tmp_path):
    path = tmp_path / "missing"
    build = script_runner.run(*index_cmd, str(path))
    assert not build.success


def test_piplite_cli_empty(script_runner, tmp_path):
    path = tmp_path / "empty"
    path.mkdir()
    build = script_runner.run(*index_cmd, str(path))
    assert not build.success


def test_piplite_cli_win(script_runner, tmp_path):
    path = tmp_path / "one"
    path.mkdir()
    shutil.copy2(WHEELS[0], path / WHEELS[0].name)
    build = script_runner.run(*index_cmd, str(path))
    assert build.success
    assert json.loads((path / "all.json").read_text(encoding="utf-8"))
