"""tests for more kinds of contents"""
import json

import pytest


@pytest.mark.parametrize("allow_hidden", [True, False])
def test_contents_with_dot(allow_hidden, an_empty_lite_dir, script_runner):
    """Can hidden files be exposed with contents?"""
    (an_empty_lite_dir / "jupyter_lite_config.json").write_text(
        """{
        "LiteBuildConfig": {"ignore_sys_prefix": true},
        "ContentsManager": {"allow_hidden": %s}
    }"""
        % json.dumps(allow_hidden)
    )
    dot_binder = an_empty_lite_dir / ".binder"
    dot_binder.mkdir()
    postbuild = dot_binder / "postBuild"
    postbuild.write_text("#!/usr/bin/env bash\necho ok")

    result = script_runner.run(
        "jupyter", "lite", "build", "--contents", ".", cwd=str(an_empty_lite_dir)
    )
    if allow_hidden:
        assert result.success

        out = an_empty_lite_dir / "_output"

        assert (out / "files/.binder/postBuild").exists()

        contents = json.loads(
            (out / "api/contents/.binder/all.json").read_text(encoding="utf-8")
        )

        assert contents["content"][0]["name"] == "postBuild", contents
    else:
        assert not result.success
        assert "jupyter_lite_config" in result.stdout
