"""tests for the display-only extension manager addon"""

import json

from pytest import mark

AN_EXTENSION = "@org/an-extension"

A_PACKAGE_JSON = {
    "name": AN_EXTENSION,
    "version": "0.1.0",
    "jupyterlab": {"_build": {"load": "static/remoteEntry.abc123.js"}},
}

#: a federated extension with all the optional metadata fields populated
AN_ENRICHED_EXTENSION = "@org/enriched-extension"

AN_ENRICHED_PACKAGE_JSON = {
    "name": AN_ENRICHED_EXTENSION,
    "version": "1.2.3",
    "description": "An enriched extension",
    "homepage": "https://example.test/home",
    "license": "BSD-3-Clause",
    "author": {"name": "A Person"},
    "repository": {"type": "git", "url": "https://example.test/repo"},
    "bugs": {"url": "https://example.test/issues"},
    "jupyterlab": {"_build": {"load": "static/remoteEntry.def456.js"}},
}

#: the plugin whose settings are overridden to enable the display-only manager
EXTENSION_MANAGER_PLUGIN = "@jupyterlab/extensionmanager-extension:plugin"


def build_one_extension(lite_dir, script_runner, package_json, jupyterlite_json=None):
    """build a site shipping a single federated extension, return the ``_output`` dir"""
    ext_dir = lite_dir / "an-extension"
    ext_dir.mkdir()
    (ext_dir / "package.json").write_text(json.dumps(package_json))

    config = {"LiteBuildConfig": {"federated_extensions": ["an-extension"], "apps": ["lab"]}}
    (lite_dir / "jupyter_lite_config.json").write_text(json.dumps(config))

    if jupyterlite_json is not None:
        (lite_dir / "jupyter-lite.json").write_text(json.dumps(jupyterlite_json))

    build = script_runner.run(["jupyter", "lite", "build"], cwd=str(lite_dir))
    assert build.success

    return lite_dir / "_output"


@mark.parametrize(
    "disabled_extensions,expect_listed",
    [
        ([], True),
        ([AN_EXTENSION], False),
        ([f"{AN_EXTENSION}:plugin"], True),
    ],
)
def test_extension_manager_disabled(
    an_empty_lite_dir, script_runner, disabled_extensions, expect_listed
):
    """disabled extensions are excluded from ``lab/api/extensions``

    A bare package name disables the whole extension (dropped from the listing);
    a ``<name>:<plugin>`` entry only disables that plugin (extension still listed).
    """
    output = build_one_extension(
        an_empty_lite_dir,
        script_runner,
        A_PACKAGE_JSON,
        jupyterlite_json={"jupyter-config-data": {"disabledExtensions": disabled_extensions}},
    )

    assert (output / "extensions" / AN_EXTENSION).is_dir()

    entries = json.loads((output / "lab" / "api" / "extensions").read_text(encoding="utf-8"))
    listed = {entry["name"] for entry in entries}
    assert (AN_EXTENSION in listed) == expect_listed


def test_extension_manager_metadata(an_empty_lite_dir, script_runner):
    """the build configures the manager as a display-only listing in ``jupyter-lite.json``"""
    output = build_one_extension(an_empty_lite_dir, script_runner, A_PACKAGE_JSON)

    config_data = json.loads((output / "jupyter-lite.json").read_text(encoding="utf-8"))[
        "jupyter-config-data"
    ]

    assert config_data["extensionManager"] == {
        "name": "JupyterLite",
        "can_install": False,
        "install_path": None,
    }

    plugin_overrides = config_data["settingsOverrides"][EXTENSION_MANAGER_PLUGIN]
    assert plugin_overrides["enabled"] is True
    assert plugin_overrides["disclaimed"] is True


def test_extension_manager_entry(an_empty_lite_dir, script_runner):
    """a federated extension is mapped to a read-only, prebuilt extension entry"""
    output = build_one_extension(an_empty_lite_dir, script_runner, AN_ENRICHED_PACKAGE_JSON)

    entries = json.loads((output / "lab" / "api" / "extensions").read_text(encoding="utf-8"))
    entry = next(entry for entry in entries if entry["name"] == AN_ENRICHED_EXTENSION)

    # federated extensions are bundled with the site: read-only and always present
    assert entry["installed"] is True
    assert entry["enabled"] is True
    assert entry["allowed"] is True
    assert entry["approved"] is False
    assert entry["status"] == "ok"
    assert entry["pkg_type"] == "prebuilt"

    # there is a single, fixed version: the one shipped with the site
    assert entry["latest_version"] == "1.2.3"
    assert entry["installed_version"] == "1.2.3"

    # the remaining metadata is mapped from the ``package.json``
    assert entry["description"] == "An enriched extension"
    assert entry["homepage_url"] == "https://example.test/home"
    assert entry["license"] == "BSD-3-Clause"
    assert entry["author"] == "A Person"
    assert entry["repository_url"] == "https://example.test/repo"
    assert entry["bug_tracker_url"] == "https://example.test/issues"
