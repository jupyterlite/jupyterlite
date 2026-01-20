# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

# Heavily inspired by:
# - https://github.com/jupyterlab/jupyterlab/blob/master/buildutils/src/bumpversion.ts
# - https://github.com/voila-dashboards/voila/blob/master/scripts/bump-version.py

import json
from pathlib import Path

import click
from jupyter_releaser.util import bump_version as bump_py
from jupyter_releaser.util import run

ENC = dict(encoding="utf-8")
ROOT = Path(__file__).parent.parent
ROOT_PACKAGE_JSON = ROOT / "package.json"
APP_JUPYTERLITE_JSON = ROOT / "app" / "jupyter-lite.json"


@click.command()
@click.argument("spec", nargs=1)
def bump(spec):
    status = run("git status --porcelain").strip()
    if len(status) > 0:
        raise Exception("Must be in a clean git state with no untracked files")

    # bump Python version
    bump_py(spec, changelog_path="CHANGELOG.md")

    # read the new app version
    app_json = json.loads(ROOT_PACKAGE_JSON.read_text(**ENC))
    py_version = app_json["version"]
    js_version = py_version.replace("a", "-alpha.").replace("b", "-beta.").replace("rc", "-rc.")

    # save the new version to the app jupyter-lite.json
    jupyterlite_json = json.loads(APP_JUPYTERLITE_JSON.read_text(**ENC))
    jupyterlite_json["jupyter-config-data"]["appVersion"] = js_version
    APP_JUPYTERLITE_JSON.write_text(json.dumps(jupyterlite_json), **ENC)
    run(f"jlpm prettier --write {APP_JUPYTERLITE_JSON}")

    # bump all JS packages using yarn version plugin
    # this also auto-updates internal @jupyterlite/* dependencies
    run(f"jlpm workspaces foreach --all --exclude @jupyterlite/root exec jlpm version {js_version}")

    run("jlpm prettier --write '**/package.json'")


if __name__ == "__main__":
    bump()
