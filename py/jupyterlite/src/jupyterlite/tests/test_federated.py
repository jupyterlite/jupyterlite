"""tests of various mechanisms of providing federated_extensions"""
import json
import shutil

from pytest import mark

from .conftest import CONDA_PKGS, WHEELS


@mark.parametrize(
    "remote,kind",
    [[True, "wheel"], [True, "conda"], [False, "wheel"], [False, "conda"]],
)
def test_federated_extensions(
    an_empty_lite_dir, script_runner, remote, kind, a_fixture_server
):
    """can we include a single extension from an archive"""
    ext = CONDA_PKGS[0] if kind == "conda" else WHEELS[0]

    if remote:
        federated_extensions = [f"{a_fixture_server}/{ext.name}"]
    else:
        shutil.copy2(ext, an_empty_lite_dir / ext.name)
        federated_extensions = [ext.name]

    config = {
        "LiteBuildConfig": {
            "federated_extensions": federated_extensions,
            "ignore_sys_prefix": True,
            "overrides": ["overrides.json"],
            "apps": ["lab"],
        }
    }
    overrides = {"the-smallest-extension:plugin": {}}

    (an_empty_lite_dir / "jupyter_lite_config.json").write_text(json.dumps(config))
    (an_empty_lite_dir / "overrides.json").write_text(json.dumps(overrides))

    build = script_runner.run("jupyter", "lite", "build", cwd=str(an_empty_lite_dir))
    assert build.success

    check = script_runner.run("jupyter", "lite", "check", cwd=str(an_empty_lite_dir))
    assert check.success

    output = an_empty_lite_dir / "_output"
    lite_json = output / "jupyter-lite.json"
    lite_data = json.loads(lite_json.read_text(encoding="utf-8"))
    smallest_dir = output / "lab/extensions/the-smallest-extension"
    assert smallest_dir.exists()
    lite_ext = lite_data["jupyter-config-data"]["federated_extensions"]
    smallest = lite_ext[0]
    assert (smallest_dir / smallest["load"]).exists()
    assert "extension" in smallest
    assert "mimeExtension" in smallest
    assert "style" in smallest

    lab_build = output / "lab/build"
    assert (lab_build / "themes/the-smallest-extension/index.css").exists()
