"""Generate lock files and piplite_urls.

- requirements-demo.txt: from demo dependency group (for CI to install extensions)
- piplite_urls: from requirements-piplite.txt (packages used in demo notebooks)

Packages already bundled in Pyodide are excluded from piplite_urls.
The Pyodide version is read from jupyterlite-pyodide-kernel.

Supports both uv and pip-compile (from pip-tools) for resolving dependencies.
"""

import json
import re
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

import tomllib

REPO_ROOT = Path(__file__).parent.parent
PYPROJECT = REPO_ROOT / "pyproject.toml"
PIPLITE_REQUIREMENTS = REPO_ROOT / "examples" / "requirements-piplite.txt"
DEMO_LOCK_FILE = REPO_ROOT / "examples" / "requirements-demo.txt"
CONFIG_FILE = REPO_ROOT / "examples" / "jupyter_lite_config.json"
PYPI_API = "https://pypi.org/pypi/{package}/json"
PYODIDE_LOCK_URL = "https://cdn.jsdelivr.net/pyodide/v{version}/full/pyodide-lock.json"


def get_pyodide_version() -> str:
    """Get the Pyodide version from jupyterlite-pyodide-kernel."""
    try:
        from jupyterlite_pyodide_kernel.constants import PYODIDE_VERSION

        return PYODIDE_VERSION
    except ImportError:
        print("Error: jupyterlite-pyodide-kernel not installed")
        print("Install it with: pip install jupyterlite-pyodide-kernel")
        sys.exit(1)


def normalize_package_name(name: str) -> str:
    """Normalize package name according to PEP 503."""
    return re.sub(r"[-_.]+", "-", name).lower()


def get_pyodide_packages() -> set[str]:
    """Fetch list of packages bundled in Pyodide."""
    version = get_pyodide_version()
    url = PYODIDE_LOCK_URL.format(version=version)
    print(f"Fetching Pyodide {version} package list...")
    try:
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        print(f"  Warning: Could not fetch Pyodide lock file: {e}")
        return set()

    # Extract package names from the lock file
    packages = set()
    for name in data.get("packages", {}):
        packages.add(normalize_package_name(name))

    print(f"  Found {len(packages)} packages in Pyodide")
    return packages


def get_wheel_url(package: str) -> str | None:
    """Query PyPI API to find the best wheel URL for a package."""
    url = PYPI_API.format(package=package)
    try:
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        print(f"  Warning: Could not fetch {package}: {e}")
        return None

    # Get the latest version's URLs
    urls = data.get("urls", [])

    # Prefer py3-none-any.whl, then py2.py3-none-any.whl
    wheel_priorities = [
        lambda u: "py3-none-any.whl" in u["filename"],
        lambda u: "py2.py3-none-any.whl" in u["filename"],
        lambda u: u["filename"].endswith(".whl"),
    ]

    for priority in wheel_priorities:
        for file_info in urls:
            if priority(file_info):
                return file_info["url"]

    print(f"  Warning: No suitable wheel found for {package}")
    return None


def get_dependency_group(group: str) -> list[str]:
    """Extract dependencies from a dependency group in pyproject.toml."""
    with open(PYPROJECT, "rb") as f:
        data = tomllib.load(f)

    groups = data.get("dependency-groups", {})
    if group not in groups:
        print(f"Error: dependency group '{group}' not found in pyproject.toml")
        sys.exit(1)

    deps = []
    for item in groups[group]:
        if isinstance(item, str):
            deps.append(item)
        elif isinstance(item, dict) and "include-group" in item:
            # Recursively include another group
            deps.extend(get_dependency_group(item["include-group"]))
    return deps


def compile_dependency_group(group: str) -> str:
    """Compile a dependency group to a lock file.

    Tries uv first, falls back to pip-compile.

    Args:
        group: Name of the dependency group to compile.

    Returns:
        Raw compiled output (for saving as lock file)
    """
    # Try uv first
    try:
        print(f"Compiling {group} dependency group with uv...")
        result = subprocess.run(
            [
                "uv",
                "pip",
                "compile",
                str(PYPROJECT),
                "--group",
                group,
                "--prerelease=allow",
                "--no-header",
            ],
            capture_output=True,
            text=True,
            check=True,
        )
        return result.stdout
    except FileNotFoundError:
        pass  # uv not installed, try pip-compile
    except subprocess.CalledProcessError as e:
        print(f"Error running uv pip compile: {e.stderr}")
        sys.exit(1)

    # Fallback to pip-compile (doesn't support dependency groups,
    # so we extract deps and write to a temp file)
    try:
        print(f"Compiling {group} dependency group with pip-compile...")
        deps = get_dependency_group(group)
        with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as tmp:
            tmp.write("\n".join(deps))
            tmp_path = tmp.name

        try:
            result = subprocess.run(
                [
                    "pip-compile",
                    "--allow-unsafe",
                    "--no-header",
                    "--strip-extras",
                    "-o",
                    "-",
                    tmp_path,
                ],
                capture_output=True,
                text=True,
                check=True,
            )
            return result.stdout
        except subprocess.CalledProcessError as e:
            print(f"Error running pip-compile: {e.stderr}")
            sys.exit(1)
        finally:
            Path(tmp_path).unlink()
    except FileNotFoundError:
        print("Error: No compile tool found.")
        print("Install one of:")
        print("  - uv: https://docs.astral.sh/uv/")
        print("  - pip-tools: pip install pip-tools")
        sys.exit(1)


def compile_piplite_requirements() -> list[str]:
    """Compile requirements-piplite.txt to get resolved packages.

    Tries uv first, falls back to pip-compile.

    Returns:
        List of package names (including transitive dependencies)
    """
    if not PIPLITE_REQUIREMENTS.exists():
        print(f"Error: {PIPLITE_REQUIREMENTS} not found")
        sys.exit(1)

    # Try uv first
    try:
        print(f"Compiling {PIPLITE_REQUIREMENTS.name} with uv...")
        result = subprocess.run(
            [
                "uv",
                "pip",
                "compile",
                str(PIPLITE_REQUIREMENTS),
                "--no-header",
            ],
            capture_output=True,
            text=True,
            check=True,
        )
    except FileNotFoundError:
        # uv not installed, try pip-compile
        try:
            print(f"Compiling {PIPLITE_REQUIREMENTS.name} with pip-compile...")
            result = subprocess.run(
                [
                    "pip-compile",
                    "--allow-unsafe",
                    "--no-header",
                    "--strip-extras",
                    "-o",
                    "-",
                    str(PIPLITE_REQUIREMENTS),
                ],
                capture_output=True,
                text=True,
                check=True,
            )
        except FileNotFoundError:
            print("Error: No compile tool found.")
            print("Install one of:")
            print("  - uv: https://docs.astral.sh/uv/")
            print("  - pip-tools: pip install pip-tools")
            sys.exit(1)
        except subprocess.CalledProcessError as e:
            print(f"Error running pip-compile: {e.stderr}")
            sys.exit(1)
    except subprocess.CalledProcessError as e:
        print(f"Error running uv pip compile: {e.stderr}")
        sys.exit(1)

    # Parse the compiled output to get package names
    packages = []
    for raw_line in result.stdout.splitlines():
        stripped = raw_line.strip()
        # Skip comments, empty lines, and options
        if not stripped or stripped.startswith("#") or stripped.startswith("-"):
            continue
        # Extract package name (before ==)
        if "==" in stripped:
            package = stripped.split("==")[0].strip()
            packages.append(package)

    return packages


def update_config(config_path: Path, piplite_urls: list[str]) -> None:
    """Update jupyter_lite_config.json with piplite_urls."""
    if config_path.exists():
        with open(config_path) as f:
            config = json.load(f)
    else:
        config = {}

    if "PipliteAddon" not in config:
        config["PipliteAddon"] = {}
    config["PipliteAddon"]["piplite_urls"] = piplite_urls

    with open(config_path, "w") as f:
        json.dump(config, f, indent=2)
        f.write("\n")


def main():
    # 1. Generate demo lock file (for CI to install extensions)
    demo_output = compile_dependency_group("demo")
    print(f"Saving demo lock file: {DEMO_LOCK_FILE}")
    with open(DEMO_LOCK_FILE, "w") as f:
        f.write(demo_output)

    # 2. Get packages already in Pyodide (to exclude from piplite_urls)
    pyodide_packages = get_pyodide_packages()

    # 3. Generate piplite_urls from requirements-piplite.txt
    all_packages = compile_piplite_requirements()
    print(f"Found {len(all_packages)} packages (including dependencies)")

    # Filter out packages already in Pyodide
    packages = [p for p in all_packages if normalize_package_name(p) not in pyodide_packages]
    skipped = len(all_packages) - len(packages)
    print(f"Skipping {skipped} packages already in Pyodide")
    print(f"Fetching wheel URLs for {len(packages)} packages...")

    piplite_urls = []
    for package in packages:
        print(f"  Fetching wheel URL for: {package}")
        url = get_wheel_url(package)
        if url:
            piplite_urls.append(url)

    print(f"\nFound {len(piplite_urls)} wheel URLs")
    print(f"Updating config: {CONFIG_FILE}")
    update_config(CONFIG_FILE, piplite_urls)

    print("\nDone! Generated files:")
    print(f"  - {DEMO_LOCK_FILE}")
    print(f"  - {CONFIG_FILE}")


if __name__ == "__main__":
    main()
