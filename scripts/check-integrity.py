"""Ensure app yarn resolutions match installed versions.

This script ensures that the "resolutions" field in each app's package.json
is in sync with the versions installed in node_modules. It regenerates
resolutions from dependencies + singletonPackages.

Based on: https://github.com/jupyter/notebook/blob/main/buildutils/src/ensure-repo.ts

Usage:
    python scripts/check-integrity.py          # Update resolutions
    python scripts/check-integrity.py --check  # Check only (for CI)
"""

import argparse
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent
NODE_MODULES = REPO_ROOT / "node_modules"
APP_DIR = REPO_ROOT / "app"


def get_installed_version(package_name: str) -> str | None:
    """Get the installed version of a package from node_modules."""
    package_json = NODE_MODULES / package_name / "package.json"
    if not package_json.exists():
        return None
    with open(package_json) as f:
        data = json.load(f)
    return data.get("version")


def ensure_app_resolutions(app_path: Path, check_only: bool) -> list[str]:
    """Ensure resolutions match installed versions for an app.

    Collects all packages from dependencies + singletonPackages and
    sets resolutions to ~{installed_version} for each.

    Args:
        app_path: Path to the app directory (e.g., app/lab)
        check_only: If True, don't modify files, just report differences

    Returns:
        List of error/change messages
    """
    package_json_path = app_path / "package.json"
    if not package_json_path.exists():
        return []

    with open(package_json_path) as f:
        data = json.load(f)

    dependencies = data.get("dependencies", {})
    jupyterlab_config = data.get("jupyterlab", {})
    singleton_packages = jupyterlab_config.get("singletonPackages", [])

    # Collect all packages to include in resolutions
    packages = set(dependencies.keys()) | set(singleton_packages)

    # Build expected resolutions from installed versions
    expected_resolutions = {}
    for package_name in sorted(packages):
        version = get_installed_version(package_name)
        if version is None:
            # Package not installed - skip
            continue
        expected_resolutions[package_name] = f"~{version}"

    current_resolutions = data.get("resolutions", {})

    # Find differences
    changes = []
    for package_name, expected_spec in expected_resolutions.items():
        current_spec = current_resolutions.get(package_name)
        if current_spec != expected_spec:
            if current_spec is None:
                changes.append(f"  + {package_name}: {expected_spec}")
            else:
                changes.append(f"  {package_name}: {current_spec} -> {expected_spec}")

    # Check for removed packages (in resolutions but not in expected)
    for package_name in current_resolutions:
        if package_name not in expected_resolutions:
            changes.append(f"  - {package_name}: {current_resolutions[package_name]}")

    if changes and not check_only:
        data["resolutions"] = expected_resolutions
        with open(package_json_path, "w") as f:
            json.dump(data, f, indent=2)
            f.write("\n")
        print(f"Updated {app_path.name}/package.json")

    return changes


def print_changes(all_changes: list[tuple[str, list[str]]], header: str) -> None:
    """Print change messages grouped by app."""
    print(header)
    for app_name, changes in all_changes:
        print(f"\n{app_name}/package.json:")
        for change in changes:
            print(change)


def main():
    parser = argparse.ArgumentParser(
        description="Ensure app yarn resolutions match installed versions"
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Check only, don't modify files (exit 1 if changes needed)",
    )
    args = parser.parse_args()

    if not NODE_MODULES.exists():
        print("Error: node_modules not found. Run 'jlpm install' first.")
        sys.exit(1)

    app_dirs = sorted(p.parent for p in APP_DIR.glob("*/package.json"))
    if not app_dirs:
        print("Error: No app package.json files found")
        sys.exit(1)

    all_changes = []
    for app_path in app_dirs:
        changes = ensure_app_resolutions(app_path, args.check)
        if changes:
            all_changes.append((app_path.name, changes))

    if not all_changes:
        print("All resolutions are up to date.")
        return

    if args.check:
        print_changes(all_changes, "Resolution mismatches found:")
        print("\nRun 'jlpm integrity' to fix.")
        sys.exit(1)
    else:
        print_changes(all_changes, "Updated resolutions:")


if __name__ == "__main__":
    main()
