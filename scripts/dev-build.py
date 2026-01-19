#!/usr/bin/env python
"""Build JupyterLite site, optionally watching for content changes."""

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

from watchfiles import DefaultFilter
from watchfiles import watch as watchfiles_watch

# Paths
ROOT = Path(__file__).parent.parent
APP_DIR = ROOT / "app"
EXAMPLES_DIR = ROOT / "examples"
SITE_DIR = ROOT / "_site"


def setup_site():
    """Set up _site with app files and symlink to app/build.

    This copies the app directory to _site (excluding build/ and node_modules/),
    then creates a symlink from _site/build to app/build. This allows webpack
    watch to update app/build while _site/build reflects those changes immediately.
    """
    build_link = SITE_DIR / "build"

    # If symlink already exists, site is already set up
    if build_link.is_symlink():
        print("[setup] _site already configured")
        return False

    print("[setup] Setting up _site from app/...")

    # Copy app files to _site, excluding build/ and node_modules/
    if SITE_DIR.exists():
        shutil.rmtree(SITE_DIR)

    def ignore_patterns(directory, files):
        if Path(directory) == APP_DIR:
            return ["build", "node_modules"]
        return []

    shutil.copytree(APP_DIR, SITE_DIR, ignore=ignore_patterns)

    # Create symlink: _site/build -> ../app/build
    build_link.symlink_to(Path("..") / "app" / "build")
    print("[setup] Created symlink: _site/build -> ../app/build")

    # Symlink JS files that may be edited during development
    for js_file in ["config-utils.js", "service-worker.js"]:
        site_file = SITE_DIR / js_file
        site_file.unlink()
        site_file.symlink_to(Path("..") / "app" / js_file)
        print(f"[setup] Created symlink: _site/{js_file} -> ../app/{js_file}")

    return True


def build():
    """Run jupyter lite build with static addon disabled.

    Since _site is pre-populated with app files and build/ is symlinked,
    we skip the static addon and only run content/extension processing.
    """
    print("\n[build] Building JupyterLite...")

    cmd = [
        "jupyter",
        "lite",
        "build",
        "--force",
        "--disable-addons",
        "static",
        "--lite-dir",
        "examples",
        "--output-dir",
        "_site",
    ]

    try:
        subprocess.run(cmd, cwd=ROOT, check=True)
        print("[ok] Build complete")
        return True
    except subprocess.CalledProcessError as e:
        print(f"[error] Build failed: {e}")
        return False


def watch():
    """Watch examples directory and rebuild on changes."""
    print(f"\n[watch] Watching {EXAMPLES_DIR} for content changes...")
    print("Press Ctrl+C to stop\n")

    for _ in watchfiles_watch(
        EXAMPLES_DIR,
        watch_filter=DefaultFilter(ignore_entity_patterns=(r"\.jupyterlite\.doit\.db$",)),
        debounce=1000,
        step=100,
        raise_interrupt=False,
    ):
        build()


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Build JupyterLite site for development")
    parser.add_argument(
        "--watch",
        action="store_true",
        help="Watch for content changes and rebuild automatically",
    )
    args = parser.parse_args()

    if not EXAMPLES_DIR.exists():
        print(f"Error: {EXAMPLES_DIR} does not exist")
        sys.exit(1)

    if not APP_DIR.exists():
        print(f"Error: {APP_DIR} does not exist. Run 'jlpm build' first.")
        sys.exit(1)

    # Set up _site with app files and symlink
    setup_site()

    # Always do initial build
    if not build():
        sys.exit(1)

    # If watch mode, start watching for changes
    if args.watch:
        watch()


if __name__ == "__main__":
    main()
