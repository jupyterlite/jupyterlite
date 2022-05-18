# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.import click

# Heavily inspired by:
# - https://github.com/jupyterlab/jupyterlab/blob/master/buildutils/src/bumpversion.ts
# - https://github.com/jupyterlab/retrolab/blob/main/buildutils/src/release-bump.ts
# - https://github.com/voila-dashboards/voila/blob/master/scripts/bump-version.py

import json
from pathlib import Path

import click
from jupyter_releaser.util import run

ENC = dict(encoding="utf-8")
ROOT = Path(__file__).parent.parent
APP_PACKAGE_JSON = ROOT / "app" / "package.json"


@click.command()
@click.option("--force", default=False, is_flag=True)
@click.argument("spec", nargs=1)
def bump(force):
    status = run("git status --porcelain").strip()
    if len(status) > 0:
        raise Exception("Must be in a clean git state with no untracked files")

    # bump the JS packages
    app_json = json.loads(APP_PACKAGE_JSON.read_text(**ENC))
    new_version = app_json["version"]
    cmd = f"yarn run lerna version --force-publish --no-push --no-git-tag-version {new_version}"
    if force:
        cmd += " --yes"
    run(cmd)


if __name__ == "__main__":
    bump()
