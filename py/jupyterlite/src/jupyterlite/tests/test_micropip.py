"""tests of various mechanisms of providing federated_extensions"""
import json
import shutil

from pytest import mark

from .conftest import WHEELS


@mark.parametrize(
    "remote,folder",
    [[True, False], [False, False], [False, True]],
)
def test_micropip_wheels(
    an_empty_lite_dir, script_runner, remote, folder, a_fixture_server
):
    """can we include a single wheel?"""
    ext = WHEELS[0]

    if remote:
        micropip_wheels = [f"{a_fixture_server}/{ext.name}"]
    else:
        shutil.copy2(WHEELS[0], an_empty_lite_dir)
        if folder:
            micropip_wheels = ["."]
        else:
            micropip_wheels = [WHEELS[0].name]

    config = {
        "LiteBuildConfig": {
            "ignore_sys_prefix": True,
            "micropip_wheels": micropip_wheels,
            "apps": ["lab"],
        }
    }
    print("CONFIG", config)

    (an_empty_lite_dir / "jupyter_lite_config.json").write_text(json.dumps(config))

    build = script_runner.run("jupyter", "lite", "build", cwd=str(an_empty_lite_dir))
    assert build.success

    check = script_runner.run("jupyter", "lite", "check", cwd=str(an_empty_lite_dir))
    assert check.success

    output = an_empty_lite_dir / "_output"

    lite_json = output / "jupyter-lite.json"
    lite_data = json.loads(lite_json.read_text(encoding="utf-8"))
    assert lite_data["jupyter-config-data"]["litePluginSettings"][
        "@jupyterlite/pyolite-kernel-extension:kernel"
    ]["micropipUrls"], "bad wheel urls"

    wheel_out = output / "lab/build/wheels"
    assert (wheel_out / WHEELS[0].name).exists()
    wheel_index = output / "lab/build/wheels/all.json"
    wheel_index_text = wheel_index.read_text(encoding="utf-8")
    assert WHEELS[0].name in wheel_index_text, wheel_index_text
    # smallest_dir = output / "lab/extensions/the-smallest-extension"
    # assert smallest_dir.exists()
    # lite_ext = lite_data["jupyter-config-data"]["federated_extensions"]
    # smallest = lite_ext[0]
    # assert (smallest_dir / smallest["load"]).exists()
    # assert "extension" in smallest
    # assert "mimeExtension" in smallest
    # assert "style" in smallest

    # lab_build = output / "lab/build"
    # assert (lab_build / "themes/the-smallest-extension/index.css").exists()
