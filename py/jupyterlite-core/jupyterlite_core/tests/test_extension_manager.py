"""tests of disabled extensions in the display-only extension manager"""

import json

from pytest import mark

AN_EXTENSION = "@org/an-extension"

A_PACKAGE_JSON = {
    "name": AN_EXTENSION,
    "version": "0.1.0",
    "jupyterlab": {"_build": {"load": "static/remoteEntry.abc123.js"}},
}


@mark.parametrize(
    "disabled_extensions,expect_listed",
    [
        ([], True),
        ([AN_EXTENSION], False),
        ([f"{AN_EXTENSION}:plugin"], True),
    ],
)
def test_extension_manager_disabled(
    an_empty_lite_dir, script_runner, disabled_extensions, expect_listed
):
    """disabled extensions are excluded from ``lab/api/extensions``

    A bare package name disables the whole extension (dropped from the listing);
    a ``<name>:<plugin>`` entry only disables that plugin (extension still listed).
    """
    ext_dir = an_empty_lite_dir / "an-extension"
    ext_dir.mkdir()
    (ext_dir / "package.json").write_text(json.dumps(A_PACKAGE_JSON))

    config = {"LiteBuildConfig": {"federated_extensions": ["an-extension"], "apps": ["lab"]}}
    (an_empty_lite_dir / "jupyter_lite_config.json").write_text(json.dumps(config))

    lite_json = {"jupyter-config-data": {"disabledExtensions": disabled_extensions}}
    (an_empty_lite_dir / "jupyter-lite.json").write_text(json.dumps(lite_json))

    build = script_runner.run(["jupyter", "lite", "build"], cwd=str(an_empty_lite_dir))
    assert build.success

    output = an_empty_lite_dir / "_output"
    assert (output / "extensions" / AN_EXTENSION).is_dir()

    entries = json.loads((output / "lab" / "api" / "extensions").read_text(encoding="utf-8"))
    listed = {entry["name"] for entry in entries}
    assert (AN_EXTENSION in listed) == expect_listed
