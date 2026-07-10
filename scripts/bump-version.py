# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

# Heavily inspired by:
# - https://github.com/jupyterlab/jupyterlab/blob/master/buildutils/src/bumpversion.ts
# - https://github.com/voila-dashboards/voila/blob/master/scripts/bump-version.py

import argparse
import json
import sys
from pathlib import Path

from jupyter_releaser.util import bump_version as bump_py
from jupyter_releaser.util import run

ENC = {"encoding": "utf-8"}
ROOT = Path(__file__).parent.parent
ROOT_PACKAGE_JSON = ROOT / "package.json"
APP_JUPYTERLITE_JSON = ROOT / "app" / "jupyter-lite.json"


def get_workspace_package_jsons() -> list[Path]:
    """Return the package.json path of every workspace member."""
    root_package_json = json.loads(ROOT_PACKAGE_JSON.read_text(**ENC))
    workspaces = root_package_json.get("workspaces", [])
    patterns = workspaces.get("packages", []) if isinstance(workspaces, dict) else workspaces

    package_json_paths: list[Path] = []
    seen: set[Path] = set()
    for pattern in patterns:
        for package_json_path in sorted(ROOT.glob(f"{pattern}/package.json")):
            if package_json_path not in seen:
                seen.add(package_json_path)
                package_json_paths.append(package_json_path)
    return package_json_paths


def get_internal_package_names() -> set[str]:
    """Get the names of all packages in this monorepo."""
    names = set()
    for package_json_path in get_workspace_package_jsons():
        package_json = json.loads(package_json_path.read_text(**ENC))
        names.add(package_json["name"])
    return names


def update_internal_dependencies(js_version: str) -> None:
    """Update internal @jupyterlite/* dependency versions to the new version."""
    internal_packages = get_internal_package_names()

    print(f"\nUpdating JavaScript dependencies to ^{js_version}", file=sys.stderr, flush=True)

    for package_json_path in get_workspace_package_jsons():
        package_json = json.loads(package_json_path.read_text(**ENC))
        changes: dict[str, list[str]] = {}

        for dep_type in ["dependencies", "devDependencies", "peerDependencies"]:
            if dep_type not in package_json:
                continue
            for dep_name in package_json[dep_type]:
                if dep_name in internal_packages:
                    old_version = package_json[dep_type][dep_name]
                    new_version = f"^{js_version}"
                    if old_version != new_version:
                        package_json[dep_type][dep_name] = new_version
                        if dep_type not in changes:
                            changes[dep_type] = []
                        changes[dep_type].append(dep_name)

        if changes:
            relative_path = package_json_path.relative_to(ROOT)
            print(f"  {relative_path}", file=sys.stderr, flush=True)
            for dep_type, dep_names in changes.items():
                print(
                    f"    {dep_type}: {', '.join(sorted(dep_names))}", file=sys.stderr, flush=True
                )
            package_json_path.write_text(json.dumps(package_json, indent=2) + "\n", **ENC)


def set_workspace_versions(js_version: str) -> None:
    """Set the ``version`` field of every workspace package.json."""
    print(f"\nBumping JS package versions to {js_version}...", file=sys.stderr, flush=True)
    for package_json_path in get_workspace_package_jsons():
        package_json = json.loads(package_json_path.read_text(**ENC))
        if package_json.get("version") == js_version:
            continue
        package_json["version"] = js_version
        package_json_path.write_text(json.dumps(package_json, indent=2) + "\n", **ENC)
        print(f"  {package_json_path.relative_to(ROOT)}", file=sys.stderr, flush=True)


def bump(spec: str) -> None:
    """Bump version across Python and JavaScript packages."""
    status = run("git status --porcelain").strip()
    if len(status) > 0:
        raise Exception("Must be in a clean git state with no untracked files")

    print(f"Bumping version with spec: {spec}", file=sys.stderr, flush=True)

    # bump Python version
    print("\nBumping Python version...", file=sys.stderr, flush=True)
    bump_py(spec, changelog_path="CHANGELOG.md")

    # read the new app version
    app_json = json.loads(ROOT_PACKAGE_JSON.read_text(**ENC))
    py_version = app_json["version"]
    js_version = py_version.replace("a", "-alpha.").replace("b", "-beta.").replace("rc", "-rc.")
    print(f"  Python version: {py_version}", file=sys.stderr, flush=True)
    print(f"  JS version: {js_version}", file=sys.stderr, flush=True)

    # save the new version to the app jupyter-lite.json
    print(f"\nUpdating {APP_JUPYTERLITE_JSON.relative_to(ROOT)}...", file=sys.stderr, flush=True)
    jupyterlite_json = json.loads(APP_JUPYTERLITE_JSON.read_text(**ENC))
    jupyterlite_json["jupyter-config-data"]["appVersion"] = js_version
    APP_JUPYTERLITE_JSON.write_text(json.dumps(jupyterlite_json), **ENC)
    run(f"jlpm prettier --write {APP_JUPYTERLITE_JSON}")

    # bump the JS package versions directly, as `npm version --workspaces` would
    # install the previously published packages and pollute node_modules
    set_workspace_versions(js_version)

    # update internal @jupyterlite/* dependencies to the new version
    update_internal_dependencies(js_version)

    print("\nFormatting package.json files...", file=sys.stderr, flush=True)
    run("jlpm prettier --write '**/package.json'")

    print("\nRunning integrity check to sync app resolutions...", file=sys.stderr, flush=True)
    run("jlpm integrity")

    print("\nVersion bump complete!", file=sys.stderr, flush=True)
    print("\nChanged files:", file=sys.stderr, flush=True)
    print(run("git diff --stat"), file=sys.stderr, flush=True)


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
