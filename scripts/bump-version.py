# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.import click

# Heavily inspired by:
# - https://github.com/jupyterlab/jupyterlab/blob/master/buildutils/src/bumpversion.ts
# - https://github.com/jupyterlab/retrolab/blob/main/buildutils/src/release-bump.ts
# - https://github.com/voila-dashboards/voila/blob/master/scripts/bump-version.py

import json
from pathlib import Path

import click
from jupyter_releaser.util import bump_version as bump_py
from jupyter_releaser.util import run

ENC = dict(encoding="utf-8")
ROOT = Path(__file__).parent.parent
ROOT_PACKAGE_JSON = ROOT / "package.json"
APP_PACKAGE_JSON = ROOT / "app" / "package.json"
APP_JUPYTERLITE_JSON = ROOT / "app" / "jupyter-lite.json"

PYOLITE_PACKAGE = ROOT / "packages" / "pyolite-kernel"
PYOLITE_PACKAGE_JSON = PYOLITE_PACKAGE / "package.json"
PYOLITE_PY_PACKAGE = PYOLITE_PACKAGE / "py" / "pyolite"
PIPLITE_PY_PACKAGE = PYOLITE_PACKAGE / "py" / "piplite"


@click.command()
@click.option("--force", default=False, is_flag=True)
@click.argument("spec", nargs=1)
def bump(force, spec):
    status = run("git status --porcelain").strip()
    if len(status) > 0:
        raise Exception("Must be in a clean git state with no untracked files")

    # bump Python version
    bump_py(spec, changelog_path="CHANGELOG.md")

    # read the new app version
    app_json = json.loads(ROOT_PACKAGE_JSON.read_text(**ENC))
    py_version = app_json["version"]
    js_version = (
        py_version.replace("a", "-alpha.").replace("b", "-beta.").replace("rc", "-rc.")
    )

    # bump pyolite js version
    pyolite_json = json.loads(PYOLITE_PACKAGE_JSON.read_text(**ENC))
    pyolite_json["pyolite"]["packages"]["py/pyolite"] = py_version
    pyolite_json["pyolite"]["packages"]["py/piplite"] = py_version
    PYOLITE_PACKAGE_JSON.write_text(json.dumps(pyolite_json), **ENC)
    run(f"yarn prettier --write {PYOLITE_PACKAGE_JSON}")

    # save the new version to the app jupyter-lite.json
    jupyterlite_json = json.loads(APP_JUPYTERLITE_JSON.read_text(**ENC))
    jupyterlite_json["jupyter-config-data"]["appVersion"] = js_version
    APP_JUPYTERLITE_JSON.write_text(json.dumps(jupyterlite_json), **ENC)
    run(f"yarn prettier --write {APP_JUPYTERLITE_JSON}")

    # bump the JS packages
    cmd = f"yarn run lerna version --force-publish --no-push --no-git-tag-version {js_version}"
    if force:
        cmd += " --yes"
    run(cmd)


if __name__ == "__main__":
    bump()
