"""feature tests of generated artifacts"""
import shutil
import tempfile
from hashlib import sha256
from pathlib import Path


def test_archive_is_reproducible(an_empty_lite_dir, script_runner, source_date_epoch):
    """do we build reproducible artifacts?"""
    # TODO: handle macro-scale reproducibility in CI
    args = "jupyter", "lite", "archive", "--debug", "--output-archive"
    cwd = dict(cwd=an_empty_lite_dir)

    before = an_empty_lite_dir.parent / "v1.tgz"
    initial = script_runner.run(*args, before, **cwd)
    assert initial.success

    # reset
    shutil.rmtree(an_empty_lite_dir)
    an_empty_lite_dir.mkdir()

    after = an_empty_lite_dir.parent / "v2.tgz"
    subsequent = script_runner.run(*args, after, **cwd)
    assert subsequent.success

    _assert_same_tarball(
        "two successive builds should be the same", script_runner, before, after
    )


def test_archive_is_idempotent(an_empty_lite_dir, script_runner, source_date_epoch):
    args = "jupyter", "lite", "archive", "--debug", "--output-archive"
    cwd = dict(cwd=an_empty_lite_dir)

    before = an_empty_lite_dir.parent / "v1.tgz"
    initial = script_runner.run(*args, before, **cwd)
    assert initial.success

    after = an_empty_lite_dir.parent / "v2.tgz"
    subsequent = script_runner.run(*args, after, "--app-archive", before, **cwd)
    assert subsequent.success

    _assert_same_tarball(
        "a build repeated should be the same", script_runner, before, after
    )


def _assert_same_tarball(message, script_runner, before, after):
    """helper function to compare two tarballs.

    TODO: the `diffoscope` HTML output is _definitely_ good enough for end users
          but is linux only...
    """
    fails = []

    hashes = {p: sha256(p.read_bytes()).hexdigest() for p in [before, after]}

    if len(set(hashes.values())) > 1:
        fails += [hashes]

    if fails:
        print("FAILS...", fails, flush=True)

    diffoscope = shutil.which("diffoscope")

    if diffoscope:
        with tempfile.TemporaryDirectory() as td:
            tdp = Path(td)
            print(tdp)

        diffoscope_result = script_runner.run(diffoscope, before, after)

        if not diffoscope_result.success:
            fails += [diffoscope_result.stdout, diffoscope_result.stderr]
            print(
                f"{message} DIFFOSCOPE",
                diffoscope_result.stdout,
                diffoscope_result.stderr,
            )
    else:
        print("on unix platforms, install diffoscope for **MUCH** clearer output")

    assert not fails, message
