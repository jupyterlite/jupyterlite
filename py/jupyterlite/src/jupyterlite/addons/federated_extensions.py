"""a jupyterlite addon for supporting federated_extensions"""
import json
import sys
from pathlib import Path

from ..constants import JUPYTERLITE_JSON, LAB_EXTENSIONS
from .base import BaseAddon

# TODO: improve this
ENV_EXTENSIONS = Path(sys.prefix) / "share/jupyter/labextensions"


class FederatedExtensionAddon(BaseAddon):
    """sync the as-installed federated_extensions and update `jupyter-lite.json`"""

    __all__ = ["pre_build", "post_build"]

    @property
    def env_extensions(self):
        """a list of all federated extensions"""
        return [
            *ENV_EXTENSIONS.glob("*/package.json"),
            *ENV_EXTENSIONS.glob("@*/*/package.json"),
        ]

    @property
    def output_env_extensions_dir(self):
        """where labextensions will go in the output folder"""
        return self.manager.output_dir / LAB_EXTENSIONS

    @property
    def output_env_extensions(self):
        """all the output labextensions"""
        for p in self.env_extensions:
            stem = p.relative_to(ENV_EXTENSIONS)
            yield self.output_env_extensions_dir / stem

    def pre_build(self, manager):
        """yield a doit task to copy each federated extension into the output_dir"""

        for pkg_json in self.env_extensions:
            pkg = pkg_json.parent
            stem = pkg.relative_to(ENV_EXTENSIONS)
            dest = self.output_env_extensions_dir / stem
            file_dep = [p for p in pkg.rglob("*") if not p.is_dir()]
            targets = [dest / p.relative_to(pkg) for p in file_dep]

            yield dict(
                name=f"copy:ext:{stem}",
                file_dep=file_dep,
                targets=targets,
                actions=[(self.copy_one, [pkg, dest])],
            )

    def post_build(self, manager):
        """update the root jupyter-lite.json, and copy each output theme to each app

        TODO: the latter per-app steps should be at least cut in half, if not
            avoided altogether.
            See https://github.com/jtpio/jupyterlite/issues/118
        """
        jupyterlite_json = manager.output_dir / JUPYTERLITE_JSON

        yield dict(
            name="patch",
            doc=f"ensure {JUPYTERLITE_JSON} includes the federated_extensions",
            file_dep=[*self.env_extensions, jupyterlite_json],
            actions=[(self.patch_jupyterlite_json, [jupyterlite_json])],
        )

        lab_extensions_root = manager.output_dir / "lab/extensions"
        lab_extensions = [
            *lab_extensions_root.glob("*/package.json"),
            *lab_extensions_root.glob("@*/*/package.json"),
        ]
        stems = [p.parent.relative_to(lab_extensions_root) for p in lab_extensions]
        for app in self.manager.apps:
            app_themes = manager.output_dir / app / "build/themes"
            for stem in stems:
                pkg = lab_extensions_root / stem
                theme_dir = pkg / "themes" / stem
                if not theme_dir.is_dir():
                    continue
                # this may be a package or an org... same result
                file_dep = sorted([p for p in theme_dir.rglob("*") if not p.is_dir()])
                targets = [app_themes / p.relative_to(theme_dir) for p in file_dep]
                dest = app_themes / stem
                yield dict(
                    name=f"copy:theme:{app}:{stem}",
                    doc=f"copy theme asset to {app} for {pkg}",
                    file_dep=file_dep,
                    targets=targets,
                    actions=[(self.copy_one, [theme_dir, dest])],
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
