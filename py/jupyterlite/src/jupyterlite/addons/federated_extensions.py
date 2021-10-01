"""a JupyterLite addon for supporting federated_extensions"""
import json
import re
import sys
import tempfile
import urllib.parse
from pathlib import Path

from ..constants import (
    FEDERATED_EXTENSIONS,
    JUPYTER_CONFIG_DATA,
    JUPYTERLITE_JSON,
    LAB_EXTENSIONS,
    PACKAGE_JSON,
    SHARE_LABEXTENSIONS,
    UTF8,
)
from .base import BaseAddon

# TODO: improve this
ENV_EXTENSIONS = Path(sys.prefix) / SHARE_LABEXTENSIONS


class FederatedExtensionAddon(BaseAddon):
    """sync the as-installed federated_extensions and update `jupyter-lite.json`"""

    __all__ = ["pre_build", "post_build", "post_init"]

    def env_extensions(self, root):
        """a list of all federated extensions"""
        return [
            *root.glob(f"*/{PACKAGE_JSON}"),
            *root.glob(f"@*/*/{PACKAGE_JSON}"),
        ]

    @property
    def output_extensions(self):
        """where labextensions will go in the output folder"""
        return self.manager.output_dir / LAB_EXTENSIONS

    def post_init(self, manager):
        """handle downloading of federated extensions"""
        for path_or_url in manager.federated_extensions:
            yield from self.resolve_one_extension(path_or_url, init=True)

    def pre_build(self, manager):
        """yield a doit task to copy each federated extension into the output_dir"""
        root = ENV_EXTENSIONS

        if not manager.ignore_sys_prefix:
            for pkg_json in self.env_extensions(root):
                yield from self.copy_one_extension(pkg_json)

        for path_or_url in manager.federated_extensions:
            yield from self.resolve_one_extension(path_or_url, init=False)

    def build(self, manager):
        """yield a doit task to copy each local extension into the output_dir"""
        root = self.manager.lite_dir / LAB_EXTENSIONS

        for pkg_json in self.env_extensions(root):
            yield self.copy_one_extension(pkg_json)

    def copy_one_env_extension(self, pkg_json):
        """copy one unpacked on-disk extension from sys.prefix into the output dir"""
        yield from self.copy_one_extension(pkg_json)

    def copy_one_extension(self, pkg_json):
        """copy one unpacked on-disk extension from anywhere into the output dir"""
        pkg_path = pkg_json.parent
        stem = json.loads(pkg_json.read_text(**UTF8))["name"]
        dest = self.output_extensions / stem
        file_dep = [p for p in pkg_path.rglob("*") if not p.is_dir()]
        targets = [dest / p.relative_to(pkg_path) for p in file_dep]

        yield dict(
            name=f"copy:ext:{stem}",
            file_dep=file_dep,
            targets=targets,
            actions=[(self.copy_one, [pkg_path, dest])],
        )

    def resolve_one_extension(self, path_or_url, init):
        """try to resolve one URL or local folder/archive as a (set of) federated_extension(s)"""
        if re.findall(r"^https?://", path_or_url):
            url = urllib.parse.urlparse(path_or_url)
            name = url.path.split("/")[-1]
            dest = self.manager.cache_dir / name
            if init:
                if not dest.exists():
                    yield dict(
                        name=f"fetch:{name}",
                        actions=[(self.fetch_one, [path_or_url, dest])],
                        targets=[dest],
                    )
                return
            # if not initializing, assume path is now local
            path_or_url = dest.resolve()

        if init:
            # nothing to do for local files during this phase
            return

        local_path = (self.manager.lite_dir / path_or_url).resolve()

        if local_path.is_dir():
            yield from self.copy_one_folder_extension(local_path)
        elif local_path.exists():
            suffix = local_path.suffix

            if suffix == ".whl":
                yield from self.copy_wheel_extensions(local_path)
            elif suffix == ".bz2":
                yield from self.copy_conda_extensions(local_path)
            else:  # pragma: no cover
                raise NotImplementedError(f"unknown archive {suffix}")
        else:  # pragma: no cover
            raise FileNotFoundError(path_or_url)

    def copy_one_folder_extension(self, path):
        """copy one extension from the given path"""
        pkg_json = path / PACKAGE_JSON

        if not pkg_json.exists():
            raise ValueError(f"[lite][federated_extensions] No package.json in {path}")

        yield from self.copy_one_extension(pkg_json)

    def copy_wheel_extensions(self, wheel):
        """copy the labextensions from a local wheel"""
        import zipfile

        with zipfile.ZipFile(wheel) as zf:
            infos = [*zf.infolist()]

            for info in infos:
                filename = info.filename
                if (
                    filename.split("/")[0].endswith(".data")
                    and SHARE_LABEXTENSIONS in filename
                    and filename.endswith(PACKAGE_JSON)
                ):
                    yield from self.extract_one_wheel_extension(wheel, info, infos)

    def extract_one_wheel_extension(self, wheel, pkg_json_info, all_infos):
        """extract one labextension from a wheel"""
        import zipfile

        pkg_root_with_slash = pkg_json_info.filename.split(PACKAGE_JSON)[0]
        prefix = len(pkg_root_with_slash)
        stem = pkg_root_with_slash.split(SHARE_LABEXTENSIONS)[1][1:-1]
        dest = self.output_extensions / stem
        members = [
            p.filename
            for p in all_infos
            if not p.is_dir() and p.filename.startswith(pkg_root_with_slash)
        ]
        targets = [dest / m[prefix:] for m in members]

        def _extract():
            with tempfile.TemporaryDirectory() as td:
                with zipfile.ZipFile(wheel) as zf:
                    zf.extractall(td, members)
                self.copy_one(Path(td) / pkg_root_with_slash, dest)

        yield dict(
            name=f"extract:wheel:{stem}",
            file_dep=[wheel],
            targets=targets,
            actions=[_extract],
        )

    def copy_conda_extensions(self, conda_pkg):
        """copy the labextensions from a local conda package"""
        import tarfile

        with tarfile.open(conda_pkg, "r:bz2") as zf:
            infos = [*zf.getmembers()]

            for info in infos:
                filename = info.name
                if filename.startswith(SHARE_LABEXTENSIONS) and filename.endswith(
                    PACKAGE_JSON
                ):
                    yield from self.extract_one_conda_extension(conda_pkg, info, infos)

    def extract_one_conda_extension(self, conda_pkg, pkg_json_info, all_infos):
        """extract one labextension from a conda package"""
        import tarfile

        pkg_root_with_slash = pkg_json_info.name.split(PACKAGE_JSON)[0]
        prefix = len(pkg_root_with_slash)
        stem = pkg_root_with_slash.split(SHARE_LABEXTENSIONS)[1][1:-1]
        dest = self.output_extensions / stem

        def _filter_members(infos):
            return [
                p
                for p in infos
                if not p.isdir() and p.name.startswith(pkg_root_with_slash)
            ]

        targets = [dest / m.name[prefix:] for m in _filter_members(all_infos)]

        def _extract():
            with tempfile.TemporaryDirectory() as td:
                with tarfile.open(conda_pkg, "r:bz2") as zf:
                    zf.extractall(td, _filter_members(zf.getmembers()))
                self.copy_one(Path(td) / pkg_root_with_slash, dest)

        yield dict(
            name=f"extract:conda:{stem}",
            file_dep=[conda_pkg],
            targets=targets,
            actions=[_extract],
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
        config = json.loads(jupyterlite_json.read_text(**UTF8))

        extensions = config[JUPYTER_CONFIG_DATA].get(FEDERATED_EXTENSIONS, [])
        lab_extensions_root = self.manager.output_dir / LAB_EXTENSIONS

        for pkg_json in self.env_extensions(lab_extensions_root):
            pkg_data = json.loads(pkg_json.read_text(**UTF8))
            is_lite = pkg_data.get("jupyterlite", {}).get("liteExtension", False)
            extension_data = {
                **pkg_data["jupyterlab"]["_build"],
                "liteExtension": is_lite,
            }
            extensions += [dict(name=pkg_data["name"], **extension_data)]

        self.dedupe_federated_extensions(config[JUPYTER_CONFIG_DATA])

        jupyterlite_json.write_text(json.dumps(config, indent=2, sort_keys=True))

        self.maybe_timestamp(jupyterlite_json)
