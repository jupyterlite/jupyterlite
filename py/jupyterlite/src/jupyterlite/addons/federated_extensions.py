"""a JupyterLite addon for supporting federated_extensions"""
import json
import sys
from pathlib import Path

from ..constants import (
    FEDERATED_EXTENSIONS,
    JUPYTER_CONFIG_DATA,
    JUPYTERLITE_JSON,
    LAB_EXTENSIONS,
)
from .base import BaseAddon

# TODO: improve this
ENV_EXTENSIONS = Path(sys.prefix) / "share/jupyter/labextensions"


class FederatedExtensionAddon(BaseAddon):
    """sync the as-installed federated_extensions and update `jupyter-lite.json`"""

    __all__ = ["pre_build", "post_build"]

    def env_extensions(self, root):
        """a list of all federated extensions"""
        return [
            *root.glob("*/package.json"),
            *root.glob("@*/*/package.json"),
        ]

    @property
    def output_env_extensions_dir(self):
        """where labextensions will go in the output folder"""
        return self.manager.output_dir / LAB_EXTENSIONS

    def pre_build(self, manager):
        """yield a doit task to copy each federated extension into the output_dir"""
        root = ENV_EXTENSIONS

        for pkg_json in self.env_extensions(root):
            yield self.copy_one_extension(pkg_json, root)

    def build(self, manager):
        """yield a doit task to copy each local extension into the output_dir"""
        root = self.manager.lite_dir / LAB_EXTENSIONS

        for pkg_json in self.env_extensions(root):
            yield self.copy_one_extension(pkg_json, root)

    def copy_one_extension(self, pkg_json, root):
        pkg = pkg_json.parent
        stem = pkg.relative_to(root)
        dest = self.output_env_extensions_dir / stem
        file_dep = [p for p in pkg.rglob("*") if not p.is_dir()]
        targets = [dest / p.relative_to(pkg) for p in file_dep]

        return dict(
            name=f"copy:ext:{stem}",
            file_dep=file_dep,
            targets=targets,
            actions=[(self.copy_one, [pkg, dest])],
        )

    def post_build(self, manager):
        """update the root jupyter-lite.json, and copy each output theme to each app

        .. todo::

            the latter per-app steps should be at least cut in half, if not
            avoided altogether.
            See https://github.com/jupyterlite/jupyterlite/issues/118
        """
        jupyterlite_json = manager.output_dir / JUPYTERLITE_JSON
        lab_extensions_root = manager.output_dir / LAB_EXTENSIONS
        lab_extensions = self.env_extensions(lab_extensions_root)

        yield dict(
            name="patch",
            doc=f"ensure {JUPYTERLITE_JSON} includes the federated_extensions",
            file_dep=[*lab_extensions, jupyterlite_json],
            actions=[(self.patch_jupyterlite_json, [jupyterlite_json])],
        )

        stems = [p.parent.relative_to(lab_extensions_root) for p in lab_extensions]

        for app in self.manager.apps:
            # this is _not_ hoisted to a global, as is hard-coded in webpack.config.js
            # but _could_ be changed
            app_themes = manager.output_dir / app / "build/themes"
            for stem in stems:
                pkg = lab_extensions_root / stem
                # this pattern appears to be canonical
                theme_dir = pkg / "themes" / stem
                if not theme_dir.is_dir():
                    continue
                # this may be a package or an @org/package... same result
                file_dep = sorted([p for p in theme_dir.rglob("*") if not p.is_dir()])
                dest = app_themes / stem
                targets = [dest / p.relative_to(theme_dir) for p in file_dep]
                yield dict(
                    name=f"copy:theme:{app}:{stem}",
                    doc=f"copy theme asset to {app} for {pkg}",
                    file_dep=file_dep,
                    targets=targets,
                    actions=[(self.copy_one, [theme_dir, dest])],
                )

    def patch_jupyterlite_json(self, jupyterlite_json):
        """add the federated_extensions to jupyter-lite.json

        .. todo::

            it _really_ doesn't like duplicate ids, probably need to catch it
            earlier... not possible with "pure" schema (but perhaps SHACL?)
        """
        config = json.loads(jupyterlite_json.read_text(encoding="utf-8"))

        extensions = config[JUPYTER_CONFIG_DATA].get(FEDERATED_EXTENSIONS, [])
        lab_extensions_root = self.manager.output_dir / LAB_EXTENSIONS

        for pkg_json in self.env_extensions(lab_extensions_root):
            pkg_data = json.loads(pkg_json.read_text(encoding="utf-8"))
            extensions += [
                dict(name=pkg_data["name"], **pkg_data["jupyterlab"]["_build"])
            ]

        self.dedupe_federated_extensions(config[JUPYTER_CONFIG_DATA])

        jupyterlite_json.write_text(json.dumps(config, indent=2, sort_keys=True))

        self.maybe_timestamp(jupyterlite_json)
