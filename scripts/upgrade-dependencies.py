#!/usr/bin/env python3
"""
Script to upgrade JupyterLab and Notebook dependencies.

This script fetches releases from GitHub and updates:
- pyproject.toml: Python dependency version constraints
- All package.json files: @jupyterlab/*, @lumino/*, @jupyter/* dependencies
  (and @jupyter-notebook/* when --notebook-version is specified)

At least one of --jupyterlab-version or --notebook-version must be specified.
Packages without a version argument are left unchanged.

Usage:
    python scripts/upgrade-dependencies.py --jupyterlab-version latest  # JupyterLab only
    python scripts/upgrade-dependencies.py --notebook-version latest    # Notebook only
    python scripts/upgrade-dependencies.py --jupyterlab-version latest --notebook-version latest
    python scripts/upgrade-dependencies.py --jupyterlab-version next    # Pre-release
    python scripts/upgrade-dependencies.py --jupyterlab-version 4.6.0   # Specific version
    python scripts/upgrade-dependencies.py --jupyterlab-version latest --dry-run

Environment variables:
    GITHUB_TOKEN: Optional GitHub token to avoid API rate limiting
"""

import argparse
import json
import os
import re
import urllib.request
from pathlib import Path

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN")

ROOT = Path(__file__).parent.parent

# Directories to exclude when searching for source files
EXCLUDED_DIRS = {"node_modules", "_site", ".venv", ".yarn", "lib", "docs", "build"}


def find_pyproject_toml_files() -> list[Path]:
    """Find all pyproject.toml files, excluding build artifacts."""
    return sorted(
        path
        for path in ROOT.glob("**/pyproject.toml")
        if not any(part in EXCLUDED_DIRS or part.startswith(".") for part in path.parts)
    )


def find_package_json_files() -> list[Path]:
    """Find all source package.json files, excluding build artifacts."""
    return sorted(
        path
        for path in ROOT.glob("**/package.json")
        if not any(part in EXCLUDED_DIRS or part.startswith(".") for part in path.parts)
    )


def convert_python_version_to_npm(version: str) -> str:
    """Convert Python version format to npm semver format.

    e.g., 4.6.0a1 -> 4.6.0-alpha.1
    """
    version = re.sub(r"a(\d+)", r"-alpha.\1", version)
    version = re.sub(r"b(\d+)", r"-beta.\1", version)
    version = re.sub(r"rc(\d+)", r"-rc.\1", version)
    return version


def convert_npm_version_to_python(version: str) -> str:
    """Convert npm semver format to Python version format.

    e.g., 4.6.0-alpha.1 -> 4.6.0a1
    """
    version = re.sub(r"-alpha\.(\d+)", r"a\1", version)
    version = re.sub(r"-beta\.(\d+)", r"b\1", version)
    version = re.sub(r"-rc\.(\d+)", r"rc\1", version)
    return version


def fetch_github_releases(repo: str) -> list:
    """Fetch releases from GitHub API."""
    url = f"https://api.github.com/repos/{repo}/releases"
    req = urllib.request.Request(url)
    req.add_header("Accept", "application/vnd.github.v3+json")
    req.add_header("User-Agent", "jupyterlite-upgrade-script")
    if GITHUB_TOKEN:
        req.add_header("Authorization", f"token {GITHUB_TOKEN}")

    with urllib.request.urlopen(req, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def fetch_upstream_package_json(repo: str, version: str, path: str) -> dict:
    """Fetch a package.json file from upstream repository."""
    url = f"https://raw.githubusercontent.com/{repo}/v{version}/{path}"
    req = urllib.request.Request(url)
    req.add_header("User-Agent", "jupyterlite-upgrade-script")
    if GITHUB_TOKEN:
        req.add_header("Authorization", f"token {GITHUB_TOKEN}")

    with urllib.request.urlopen(req, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def find_latest_release(releases: list, include_prereleases: bool = False) -> str | None:
    """Find the latest appropriate release version.

    Args:
        releases: List of releases from GitHub API.
        include_prereleases: If True, include pre-releases. If False, only stable.
    """
    for release in releases:
        tag = release["tag_name"]
        if not tag.startswith("v"):
            continue

        is_prerelease = release.get("prerelease", False)
        if is_prerelease and not include_prereleases:
            continue

        return tag[1:]  # Remove 'v' prefix

    return None


def find_version_in_releases(releases: list, target_version: str) -> str | None:
    """Find a specific version in releases."""
    for release in releases:
        tag = release["tag_name"]
        version = tag[1:] if tag.startswith("v") else tag
        if target_version in (version, tag):
            return version
    return None


PRERELEASE_MAP = {"alpha": "a", "beta": "b", "rc": "rc", "a": "a", "b": "b"}


def parse_version(version: str) -> dict:
    """Parse a version string into components."""
    match = re.match(r"^(\d+)\.(\d+)\.(\d+)(?:(a|b|rc)(\d+))?$", version)
    if not match:
        # Try npm format
        match = re.match(r"^(\d+)\.(\d+)\.(\d+)(?:-(alpha|beta|rc)\.(\d+))?$", version)
        if not match:
            msg = f"Invalid version format: {version}"
            raise ValueError(msg)

    groups = match.groups()
    result = {
        "major": int(groups[0]),
        "minor": int(groups[1]),
        "patch": int(groups[2]),
    }
    if groups[3] and groups[4]:
        prerelease_type = PRERELEASE_MAP.get(groups[3], groups[3])
        result["prerelease"] = f"{prerelease_type}{groups[4]}"
    return result


def get_version_range(version: str) -> str:
    """Get the Python version range string.

    e.g., 4.6.0a1 -> >=4.6.0a1,<4.7
    """
    parsed = parse_version(version)
    python_version = convert_npm_version_to_python(version)
    return f">={python_version},<{parsed['major']}.{parsed['minor'] + 1}"


def update_pyproject_toml(
    pyproject_path: Path,
    jupyterlab_version: str | None,
    notebook_version: str | None,
    dry_run: bool = False,
) -> bool:
    """Update version constraints in pyproject.toml."""
    content = pyproject_path.read_text()
    original = content

    if jupyterlab_version:
        version_range = get_version_range(jupyterlab_version)
        # Update jupyterlab version constraint (handles both "jupyterlab>=" and "jupyterlab >=")
        content = re.sub(
            r"(jupyterlab)( ?)(>=[\d.]+(?:a|b|rc)?\d*,<[\d.]+)",
            rf"\1\2{version_range}",
            content,
        )
        # Also update the pinned version in ui-tests group
        content = re.sub(
            r'("jupyterlab)==[\d.]+(?:a|b|rc)?\d*(")',
            rf"\g<1>=={jupyterlab_version}\2",
            content,
        )

    if notebook_version:
        version_range = get_version_range(notebook_version)
        # Update notebook version constraint (handles both "notebook>=" and "notebook >=")
        content = re.sub(
            r"(notebook)( ?)(>=[\d.]+(?:a|b|rc)?\d*,<[\d.]+)",
            rf"\1\2{version_range}",
            content,
        )
        # Also update the pinned version in ui-tests group
        content = re.sub(
            r'("notebook)==[\d.]+(?:a|b|rc)?\d*(")',
            rf"\g<1>=={notebook_version}\2",
            content,
        )

    if content != original:
        rel_path = pyproject_path.relative_to(ROOT)
        if dry_run:
            print(f"  [DRY RUN] Would update {rel_path}")
            # Show changed lines
            old_lines = original.splitlines()
            new_lines = content.splitlines()
            for old, new in zip(old_lines, new_lines, strict=True):
                if old != new:
                    print(f"    - {old.strip()}")
                    print(f"    + {new.strip()}")
        else:
            pyproject_path.write_text(content)
            print(f"  Updated {rel_path}")
        return True
    return False


def get_absolute_version(version: str) -> str:
    """Remove semver prefix (^, ~) from version."""
    return version.lstrip("^~") if version else version


def update_package_json_dependencies(
    package_json: dict,
    new_versions: dict,
    dependency_prefixes: list[str],
) -> list[tuple[str, str, str]]:
    """Update dependencies in a package.json dict.

    Returns a list of (package_name, old_version, new_version) tuples for changes made.
    """
    changes = []

    for section in ["dependencies", "devDependencies", "resolutions"]:
        if section not in package_json:
            continue

        for pkg, current_version in list(package_json[section].items()):
            # Skip packages that don't match our prefixes or aren't in new_versions
            if not any(pkg.startswith(p) for p in dependency_prefixes):
                continue
            if pkg not in new_versions:
                continue

            # Preserve the semver prefix (^, ~) if present
            new_version = get_absolute_version(new_versions[pkg])
            if current_version and current_version[0] in ("^", "~"):
                new_version = current_version[0] + new_version

            if package_json[section][pkg] != new_version:
                changes.append((pkg, current_version, new_version))
                package_json[section][pkg] = new_version

    return changes


def update_all_package_jsons(
    jupyterlab_version: str | None,
    notebook_version: str | None,
    dry_run: bool = False,
) -> bool:
    """Update all package.json files with new dependency versions."""
    changed = False
    new_versions = {}

    # Fetch upstream package.json files
    if jupyterlab_version:
        print(f"Fetching JupyterLab {jupyterlab_version} package.json files...")
        staging_pkg = fetch_upstream_package_json(
            "jupyterlab/jupyterlab",
            jupyterlab_version,
            "jupyterlab/staging/package.json",
        )
        galata_pkg = fetch_upstream_package_json(
            "jupyterlab/jupyterlab",
            jupyterlab_version,
            "galata/package.json",
        )

        # Combine devDependencies and resolutions from staging
        new_versions.update(staging_pkg.get("devDependencies", {}))
        new_versions.update(staging_pkg.get("resolutions", {}))
        # Add galata version
        if "name" in galata_pkg and "version" in galata_pkg:
            new_versions[galata_pkg["name"]] = galata_pkg["version"]

    if notebook_version:
        print(f"Fetching Notebook {notebook_version} package.json files...")
        nb_pkg = fetch_upstream_package_json(
            "jupyter/notebook",
            notebook_version,
            "app/package.json",
        )

        # Add @jupyter-notebook packages
        new_versions.update(nb_pkg.get("devDependencies", {}))
        new_versions.update(nb_pkg.get("resolutions", {}))

    if not new_versions:
        return False

    # Update all package.json files
    dependency_prefixes = ["@jupyterlab/", "@lumino/", "@jupyter/"]
    if notebook_version:
        dependency_prefixes.append("@jupyter-notebook/")

    for pkg_path in find_package_json_files():
        rel_path = pkg_path.relative_to(ROOT)
        pkg_json = json.loads(pkg_path.read_text())
        changes = update_package_json_dependencies(pkg_json, new_versions, dependency_prefixes)
        if changes:
            if dry_run:
                print(f"  [DRY RUN] Would update {rel_path}")
                for pkg, old_ver, new_ver in changes:
                    print(f"    {pkg}: {old_ver} -> {new_ver}")
            else:
                pkg_path.write_text(json.dumps(pkg_json, indent=2) + "\n")
                print(f"  Updated {rel_path}")
            changed = True

    return changed


def resolve_version(version_input: str, repo: str) -> str:
    """Resolve a version input.

    Args:
        version_input: One of 'latest' (stable), 'next' (pre-release), or a specific version.
        repo: GitHub repository in 'owner/repo' format.
    """
    print(f"Fetching releases from {repo}...")
    releases = fetch_github_releases(repo)

    if version_input in ("latest", "next"):
        include_prereleases = version_input == "next"
        version = find_latest_release(releases, include_prereleases)
        if not version:
            label = "pre-release" if include_prereleases else "stable"
            raise ValueError(f"Could not find a {label} release for {repo}")
    else:
        version = find_version_in_releases(releases, version_input)
        if not version:
            raise ValueError(f"Version {version_input} not found in {repo} releases")

    print(f"  Resolved version: {version}")
    return version


def update_all_pyproject_tomls(
    jupyterlab_version: str | None,
    notebook_version: str | None,
    dry_run: bool,
) -> None:
    """Update all pyproject.toml files with new version constraints."""
    print("\nUpdating pyproject.toml files...")
    changed = any(
        update_pyproject_toml(path, jupyterlab_version, notebook_version, dry_run)
        for path in find_pyproject_toml_files()
    )
    if not changed:
        print("  No changes to pyproject.toml files")


def main():
    parser = argparse.ArgumentParser(description="Upgrade JupyterLab and Notebook dependencies")
    parser.add_argument(
        "--jupyterlab-version",
        default=None,
        help="JupyterLab version: 'latest' (stable), 'next' (pre-release), "
        "or specific version. If not provided, JupyterLab is not updated.",
    )
    parser.add_argument(
        "--notebook-version",
        default=None,
        help="Notebook version: 'latest' (stable), 'next' (pre-release), "
        "or specific version. If not provided, Notebook is not updated.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be changed without writing files",
    )
    args = parser.parse_args()

    if args.dry_run:
        print("=== DRY RUN MODE - No files will be modified ===\n")

    # Check that at least one version is specified
    if not args.jupyterlab_version and not args.notebook_version:
        parser.error("At least one of --jupyterlab-version or --notebook-version must be specified")

    # Resolve versions (only if specified)
    jupyterlab_version = None
    notebook_version = None

    if args.jupyterlab_version:
        jupyterlab_version = resolve_version(
            args.jupyterlab_version,
            "jupyterlab/jupyterlab",
        )

    if args.notebook_version:
        notebook_version = resolve_version(
            args.notebook_version,
            "jupyter/notebook",
        )

    # Update all pyproject.toml files
    update_all_pyproject_tomls(jupyterlab_version, notebook_version, args.dry_run)

    # Update package.json files
    print("\nUpdating package.json files...")
    if update_all_package_jsons(jupyterlab_version, notebook_version, args.dry_run):
        print("\nPackage.json files updated")
    else:
        print("\nNo changes to package.json files")

    # Output summary
    print("\n" + "=" * 50)
    print("Summary:")
    if jupyterlab_version:
        print(f"  JupyterLab: {jupyterlab_version}")
    if notebook_version:
        print(f"  Notebook: {notebook_version}")
    print("\nNext steps:")
    print("  1. Run 'jlpm install' to update yarn.lock")
    print("  2. Run 'jlpm deduplicate' to clean up duplicates")
    print("  3. Run 'jlpm integrity' to update app resolutions")
    print("  4. Test the build with 'jlpm build'")


if __name__ == "__main__":
    main()
