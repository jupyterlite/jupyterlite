import pytest

HAS_JSMX = False
STATIC_ASSETS_PATH = None

try:
    from jupyter_server_mathjax.app import STATIC_ASSETS_PATH

    HAS_JSMX = True
except Exception:
    pass


EXCURSIONS = [
    [False, ["--ignore-sys-prefix"]],
    [False, ["--disable-addons", "mathjax"]],
]

if STATIC_ASSETS_PATH:
    EXCURSIONS += [
        [True, None],
        [True, ["--mathjax-dir", STATIC_ASSETS_PATH]],
    ]


@pytest.mark.parametrize("expected,extra_args", EXCURSIONS)
def test_mathjax(
    an_empty_lite_dir,
    script_runner,
    extra_args,
    expected,
):
    """does bundled mathjax work?"""
    extra_args = extra_args or []
    kwargs = dict(cwd=str(an_empty_lite_dir))

    status = script_runner.run("jupyter", "lite", "status", *extra_args, **kwargs)
    assert status.success, "the status did NOT succeed"

    build = script_runner.run("jupyter", "lite", "build", *extra_args, **kwargs)
    assert build.success, "the build did NOT succeed"

    mathjax_path = (
        an_empty_lite_dir / "_output/static/jupyter_server_mathjax/MathJax.js"
    )

    if expected:
        assert mathjax_path.exists(), f"{mathjax_path} was expected"
    else:
        assert not mathjax_path.exists(), f"{mathjax_path} was NOT expected"

    check = script_runner.run("jupyter", "lite", "check", *extra_args, **kwargs)
    assert check.success, "the build did NOT check out"
