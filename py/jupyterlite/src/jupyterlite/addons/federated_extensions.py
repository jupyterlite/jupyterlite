"""a jupyterlite addon for supporting federated_extensions"""
from pathlib import Path
import sys
import json

from ..constants import JUPYTERLITE_JSON, LAB_EXTENSIONS

from .base import BaseAddon

# TODO: improve this
ENV_EXTENSIONS = Path(sys.prefix) / "share/jupyter/labextensions"


class FederatedExtensionAddon(BaseAddon):
    """sync the as-installed federated_extensions and update `jupyter-lite.json`"""

    __all__ = ["pre_build", "post_build"]

    @property
    def env_extensions(self):
        return [
            *ENV_EXTENSIONS.glob("*/package.json"),
            *ENV_EXTENSIONS.glob("@*/*/package.json"),
        ]

    @property
    def output_env_extensions_dir(self):
        return self.manager.output_dir / LAB_EXTENSIONS

    @property
    def output_env_extensions(self):
        for p in self.env_extensions:
            stem = p.relative_to(ENV_EXTENSIONS)
            yield self.output_env_extensions_dir / stem

    def pre_build(self, manager):
        """yield a doit task for each federated extension (and/or theme per app)"""

        for pkg_json in self.env_extensions:
            pkg = pkg_json.parent
            stem = pkg.relative_to(ENV_EXTENSIONS)
            dest = self.output_env_extensions_dir / stem
            file_dep = [p for p in pkg.rglob("*") if not p.is_dir()]
            targets = [dest / p.relative_to(pkg) for p in file_dep]
            yield dict(
                name=f"lab:copy:ext:{stem}",
                file_dep=file_dep,
                targets=targets,
                actions=[(self.copy_one, [pkg, dest])],
            )

        for app in self.manager.apps:
            app_themes = manager.output_dir / app / "build/themes"
            for theme_dir in pkg.parent.glob("themes/*"):
                pkg = theme_dir.parent.relative_to(ENV_EXTENSIONS)
                file_dep = [p for p in theme_dir.rglob("*") if not p.is_dir()]
                targets = [
                    app_themes / pkg / p.relative_to(theme_dir) for p in file_dep
                ]
                yield dict(
                    name=f"{app}:copy:theme:{pkg}",
                    doc=f"copy theme asset to {app} for {pkg}",
                    file_dep=file_dep,
                    targets=targets,
                    actions=[self.copy_one, [theme_dir, app_themes / pkg]],
                )

    def post_build(self, manager):
        """yields a single task to update the root jupyter-lite.json"""
        jupyterlite_json = manager.output_dir / JUPYTERLITE_JSON

        yield dict(
            name="patch",
            doc=f"ensure {JUPYTERLITE_JSON} includes the federated_extensions",
            file_dep=[*self.env_extensions, jupyterlite_json],
            actions=[(self.patch_jupyterlite_json, [jupyterlite_json])],
        )

    def patch_jupyterlite_json(self, jupyterlite_json):
        """add the federated_extensions to jupyter-lite.json"""
        config = json.loads(jupyterlite_json.read_text(encoding="utf-8"))

        extensions = config["jupyter-config-data"].get("federated_extensions", [])

        for pkg_json in self.env_extensions:
            pkg_data = json.loads(pkg_json.read_text(encoding="utf-8"))
            extensions += [
                dict(name=pkg_data["name"], **pkg_data["jupyterlab"]["_build"])
            ]

        config["jupyter-config-data"]["federated_extensions"] = sorted(
            extensions, key=lambda ext: ext["name"]
        )

        jupyterlite_json.write_text(json.dumps(config, indent=2, sort_keys=True))
