# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

# Heavily inspired by:
# - https://github.com/jupyterlab/jupyterlab/blob/master/buildutils/src/bumpversion.ts
# - https://github.com/voila-dashboards/voila/blob/master/scripts/bump-version.py

import argparse
import json
from pathlib import Path

from jupyter_releaser.util import bump_version as bump_py
from jupyter_releaser.util import run

ENC = {"encoding": "utf-8"}
ROOT = Path(__file__).parent.parent
ROOT_PACKAGE_JSON = ROOT / "package.json"
APP_JUPYTERLITE_JSON = ROOT / "app" / "jupyter-lite.json"
PACKAGES_DIR = ROOT / "packages"
APP_DIR = ROOT / "app"


def get_internal_package_names() -> set[str]:
    """Get the names of all packages in this monorepo."""
    package_json_paths = list(PACKAGES_DIR.glob("*/package.json")) + list(
        APP_DIR.glob("*/package.json")
    )
    names = set()
    for package_json_path in package_json_paths:
        package_json = json.loads(package_json_path.read_text(**ENC))
        names.add(package_json["name"])
    return names


def update_internal_dependencies(js_version: str) -> None:
    """Update internal @jupyterlite/* dependency versions to the new version."""
    internal_packages = get_internal_package_names()

    package_json_paths = list(PACKAGES_DIR.glob("*/package.json")) + list(
        APP_DIR.glob("*/package.json")
    )

    for package_json_path in package_json_paths:
        package_json = json.loads(package_json_path.read_text(**ENC))
        modified = False

        for dep_type in ["dependencies", "devDependencies", "peerDependencies"]:
            if dep_type not in package_json:
                continue
            for dep_name in package_json[dep_type]:
                if dep_name in internal_packages:
                    package_json[dep_type][dep_name] = f"^{js_version}"
                    modified = True

        if modified:
            package_json_path.write_text(json.dumps(package_json, indent=2) + "\n", **ENC)


def bump(spec: str) -> None:
    """Bump version across Python and JavaScript packages."""
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

    # bump the JS package versions using npm workspaces
    run(f"npm version {js_version} --workspaces --no-git-tag-version --no-package-lock")

    # update internal @jupyterlite/* dependencies to the new version
    update_internal_dependencies(js_version)

    run("jlpm prettier --write '**/package.json'")


def main() -> None:
    parser = argparse.ArgumentParser(description="Bump JupyterLite version")
    parser.add_argument(
        "spec",
        help="Version spec: 'next', 'patch', 'minor', or explicit (e.g., 0.8.0a1)",
    )
    args = parser.parse_args()

    bump(args.spec)


if __name__ == "__main__":
    main()
