# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

"""Run the version bump script like the releaser would and check a few version markers."""

import json
import subprocess
import sys
from pathlib import Path

ENC = {"encoding": "utf-8"}
ROOT = Path(__file__).parent.parent

# an arbitrary version that should never be a real release
PY_VERSION = "9.8.7rc6"
JS_VERSION = "9.8.7-rc.6"


def read_json(path: str) -> dict:
    return json.loads((ROOT / path).read_text(**ENC))


def check_version_markers() -> None:
    # bumped by jupyter-releaser (tbump)
    assert read_json("package.json")["version"] == PY_VERSION

    # updated by the bump script directly
    app_config = read_json("app/jupyter-lite.json")["jupyter-config-data"]
    assert app_config["appVersion"] == JS_VERSION

    # workspace package versions and internal dependency ranges
    assert read_json("packages/application/package.json")["version"] == JS_VERSION
    lab = read_json("app/lab/package.json")
    assert lab["version"] == JS_VERSION
    assert lab["dependencies"]["@jupyterlite/application-extension"] == f"^{JS_VERSION}"


def main() -> None:
    status = subprocess.run(
        ["git", "status", "--porcelain"], cwd=ROOT, capture_output=True, text=True, check=True
    )
    if status.stdout.strip():
        sys.exit("The version bump check requires a clean git checkout")

    try:
        # the same command as the version-cmd of the jupyter-releaser config
        command = [sys.executable, "scripts/bump-version.py", PY_VERSION]
        subprocess.run(command, cwd=ROOT, check=True)
        check_version_markers()
    finally:
        subprocess.run(["git", "checkout", "--", "."], cwd=ROOT, check=True)

    print(f"\nBumping to {PY_VERSION} updated the version markers as expected")


if __name__ == "__main__":
    main()
