"""tests of disabled extensions in the display-only extension manager"""

import json
import shutil

from pytest import mark

from .conftest import FIXTURES, WHEELS

A_WHEEL = WHEELS[0].name
A_WHEEL_EXTENSION = "the-smallest-extension"


@mark.parametrize(
    "disabled_extensions,expect_listed",
    [
        ([], True),
        ([A_WHEEL_EXTENSION], False),
        ([f"{A_WHEEL_EXTENSION}:plugin"], True),
    ],
)
def test_extension_manager_disabled(
    an_empty_lite_dir, script_runner, disabled_extensions, expect_listed
):
    """disabled extensions are excluded from ``lab/api/extensions``

    A bare package name disables the whole extension (dropped from the listing);
    a ``<name>:<plugin>`` entry only disables that plugin (extension still listed).
    """
    shutil.copy2(FIXTURES / A_WHEEL, an_empty_lite_dir / A_WHEEL)

    config = {
        "LiteBuildConfig": {
            "federated_extensions": [A_WHEEL],
            "ignore_sys_prefix": ["federated_extensions"],
            "apps": ["lab"],
        },
    }
    (an_empty_lite_dir / "jupyter_lite_config.json").write_text(json.dumps(config))

    lite_json = {"jupyter-config-data": {"disabledExtensions": disabled_extensions}}
    (an_empty_lite_dir / "jupyter-lite.json").write_text(json.dumps(lite_json))

    build = script_runner.run(["jupyter", "lite", "build"], cwd=str(an_empty_lite_dir))
    assert build.success

    output = an_empty_lite_dir / "_output"
    assert (output / "extensions" / A_WHEEL_EXTENSION).is_dir()

    entries = json.loads((output / "lab" / "api" / "extensions").read_text(encoding="utf-8"))
    listed = {entry["name"] for entry in entries}
    assert (A_WHEEL_EXTENSION in listed) == expect_listed
