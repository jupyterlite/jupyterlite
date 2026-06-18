"""a JupyterLite addon for a display-only extension manager

This reuses the JupyterLab extension manager (``@jupyterlab/extensionmanager``)
without a server: instead of querying a package registry such as PyPI, it serves
a static ``lab/api/extensions`` response built from the federated (prebuilt)
extensions shipped with the site. The extensions are presented read-only, with
their versions, and cannot be searched, installed, uninstalled, enabled or
disabled in the browser.
"""

import json
from pathlib import Path

from ..constants import (
    JSON_FMT,
    JUPYTER_CONFIG_DATA,
    JUPYTERLITE_JSON,
    LAB_EXTENSIONS,
    PACKAGE_JSON,
    SETTINGS_OVERRIDES,
    UTF8,
)
from .base import BaseAddon

#: the PageConfig option read by the JupyterLab extension manager
EXTENSION_MANAGER = "extensionManager"

#: the served path of the static extensions API: the JupyterLab extension
#: manager performs a GET against ``{baseUrl}lab/api/extensions``
EXTENSION_MANAGER_API = "lab/api/extensions"

#: the (non-PyPI) name shown in the extension manager header (``%1 Manager``)
EXTENSION_MANAGER_NAME = "JupyterLite"

#: the id of the JupyterLab extension manager plugin
EXTENSION_MANAGER_PLUGIN = "@jupyterlab/extensionmanager-extension:plugin"


class ExtensionManagerAddon(BaseAddon):
    """generate a static ``lab/api/extensions`` response and configure the
    extension manager as a display-only listing of the federated extensions"""

    __all__ = ["post_build"]

    @property
    def output_extensions(self):
        """where federated labextensions are copied in the output folder"""
        return self.manager.output_dir / LAB_EXTENSIONS

    def env_extensions(self):
        """the ``package.json`` of each federated extension in the output"""
        root = self.output_extensions
        if not root.is_dir():
            return []
        return sorted(
            [
                *root.glob(f"*/{PACKAGE_JSON}"),
                *root.glob(f"@*/*/{PACKAGE_JSON}"),
            ]
        )

    def post_build(self, manager):
        """yield a task to build the static API response and metadata"""
        jupyterlite_json = manager.output_dir / JUPYTERLITE_JSON
        api_extensions = manager.output_dir / EXTENSION_MANAGER_API
        lab_extensions = self.env_extensions()

        yield self.task(
            name="extensions",
            doc=f"generate {EXTENSION_MANAGER_API} from the federated extensions",
            file_dep=[*lab_extensions, jupyterlite_json],
            targets=[api_extensions],
            actions=[
                (self.patch_jupyterlite_json, [jupyterlite_json]),
                (self.build_api_extensions, [lab_extensions, api_extensions]),
            ],
        )

    def patch_jupyterlite_json(self, jupyterlite_json):
        """configure the extension manager as a display-only listing

        - set the metadata so the manager cannot install and does not reference
          PyPI
        - mark the security disclaimer as accepted: JupyterLite does not fetch
          from external web services nor install code, so it does not apply
        """
        config = json.loads(jupyterlite_json.read_text(**UTF8))
        config_data = config[JUPYTER_CONFIG_DATA]

        config_data[EXTENSION_MANAGER] = {
            "name": EXTENSION_MANAGER_NAME,
            "can_install": False,
            "install_path": None,
        }

        overrides = config_data.setdefault(SETTINGS_OVERRIDES, {})
        plugin_overrides = overrides.setdefault(EXTENSION_MANAGER_PLUGIN, {})
        plugin_overrides.setdefault("enabled", True)
        plugin_overrides.setdefault("disclaimed", True)

        jupyterlite_json.write_text(json.dumps(config, **JSON_FMT), **UTF8)
        self.maybe_timestamp(jupyterlite_json)

    def build_api_extensions(self, lab_extensions, api_extensions):
        """write the static ``IEntry[]`` response served to the extension manager"""
        entries = sorted(
            (self.to_entry(pkg_json) for pkg_json in lab_extensions),
            key=lambda entry: entry["name"],
        )
        api_extensions.parent.mkdir(parents=True, exist_ok=True)
        api_extensions.write_text(json.dumps(entries, **JSON_FMT), **UTF8)
        self.maybe_timestamp(api_extensions)

    def to_entry(self, pkg_json):
        """map a federated extension's ``package.json`` to an extension entry"""
        pkg = json.loads(Path(pkg_json).read_text(**UTF8))

        author = pkg.get("author")
        if isinstance(author, dict):
            author = author.get("name")

        repository = pkg.get("repository")
        if isinstance(repository, dict):
            repository = repository.get("url")

        bugs = pkg.get("bugs")
        bug_tracker_url = bugs.get("url") if isinstance(bugs, dict) else None

        version = pkg.get("version", "")

        return {
            "name": pkg["name"],
            "description": pkg.get("description", ""),
            "homepage_url": pkg.get("homepage", ""),
            # federated extensions are bundled with the site: always present
            # and allowed, never (un)installable from the browser
            "installed": True,
            "enabled": True,
            "allowed": True,
            "approved": False,
            "status": "ok",
            "latest_version": version,
            "installed_version": version,
            "pkg_type": "prebuilt",
            "author": author,
            "license": pkg.get("license"),
            "bug_tracker_url": bug_tracker_url,
            "repository_url": repository,
        }
