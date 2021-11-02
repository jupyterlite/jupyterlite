"""a JupyterLite addon for supporting micropip wheels"""

import json
import re
import urllib.parse

import doit.tools

from ..constants import (
    ALL_JSON,
    JUPYTER_CONFIG_DATA,
    JUPYTERLITE_JSON,
    LAB_WHEELS,
    MICROPIP_URLS,
    NOARCH_WHL,
    UTF8,
)
from .base import BaseAddon


class MicropipAddon(BaseAddon):
    __all__ = ["post_init", "pre_build", "post_build"]

    @property
    def output_wheels(self):
        """where wheels will go in the output folder"""
        return self.manager.output_dir / LAB_WHEELS

    @property
    def wheel_cache(self):
        """where wheels will go in the cache folder"""
        return self.manager.cache_dir / "wheels"

    def post_init(self, manager):
        for path_or_url in manager.micropip_wheels:
            yield from self.resolve_one_wheel(path_or_url, init=True)

    def pre_build(self, manager):
        for wheel in sorted(self.wheel_cache.glob(f"*{NOARCH_WHL}")):
            dest = self.output_wheels / wheel.name
            yield dict(
                name=f"copy:whl:{wheel.name}",
                file_dep=[wheel],
                targets=[dest],
                actions=[(self.copy_one, [wheel, dest])],
            )

    def post_build(self, manager):
        """update the root jupyter-lite.json with micropipUrls"""
        jupyterlite_json = manager.output_dir / JUPYTERLITE_JSON
        wheels = sorted(self.output_wheels.glob(f"*{NOARCH_WHL}"))

        if wheels:
            whl_metas = []

            for wheel in wheels:
                whl_meta = self.wheel_cache / f"{wheel.name}.meta.json"
                whl_metas += [whl_meta]
                yield dict(
                    name=f"meta:{whl_meta.name}",
                    doc=f"ensure {wheel} metadata",
                    file_dep=[wheel],
                    actions=[
                        (doit.tools.create_folder, [whl_meta.parent]),
                        (self.index_wheel, [wheel, whl_meta]),
                    ],
                    targets=[whl_meta],
                )

            whl_index = self.manager.output_dir / LAB_WHEELS / ALL_JSON

            yield dict(
                name="patch",
                doc=f"ensure {JUPYTERLITE_JSON} includes the micropip wheel",
                file_dep=[*whl_metas, jupyterlite_json],
                actions=[
                    (
                        self.patch_jupyterlite_json,
                        [jupyterlite_json, whl_index, *whl_metas],
                    )
                ],
                targets=[whl_index],
            )

    def resolve_one_wheel(self, path_or_url, init):
        if re.findall(r"^https?://", path_or_url):
            url = urllib.parse.urlparse(path_or_url)
            name = url.path.split("/")[-1]
            dest = self.wheel_cache / name
            if init:
                if not dest.exists():
                    yield dict(
                        name=f"fetch:{name}",
                        actions=[(self.fetch_one, [path_or_url, dest])],
                        targets=[dest],
                    )
                return
            path_or_url = dest.resolve()

        if init:
            # nothing to do for local files during this phase
            return

        local_path = (self.manager.lite_dir / path_or_url).resolve()

        if local_path.is_dir():
            raise NotImplementedError(
                f"Don't know what to do with directory {path_or_url}"
            )
        elif local_path.exists():
            suffix = local_path.suffix

            if suffix == ".whl":
                yield from self.copy_wheel(local_path)

        else:  # pragma: no cover
            raise FileNotFoundError(path_or_url)

    def copy_wheel(self, wheel):
        """copy one wheel to output"""
        dest = self.output_wheels / wheel.name
        yield dict(
            name=f"copy:whl:{wheel.name}",
            file_dep=[wheel],
            targets=[dest],
            actions=[(self.copy_one, [wheel, dest])],
        )

    def patch_jupyterlite_json(self, jupyterlite_json, whl_index, *whl_metas):
        """add the micropip wheels to jupyter-lite.json"""
        config = json.loads(jupyterlite_json.read_text(**UTF8))

        index = {}

        for whl_meta in whl_metas:
            meta = json.loads(whl_meta.read_text(**UTF8))
            index.setdefault(meta["name"], {"releases": {}})["releases"][
                meta["version"]
            ] = meta["release"]

        whl_index.write_text(json.dumps(index, indent=2, sort_keys=True), **UTF8)
        urls = config.setdefault(JUPYTER_CONFIG_DATA, {}).get(MICROPIP_URLS, [])
        config[JUPYTER_CONFIG_DATA][MICROPIP_URLS] = urls

        jupyterlite_json.write_text(json.dumps(config, indent=2, sort_keys=True))

        self.maybe_timestamp(jupyterlite_json)

    def index_wheel(self, whl_path, whl_meta):
        import datetime
        from hashlib import md5, sha256

        import pkginfo

        metadata = pkginfo.get_metadata(str(whl_path))
        whl_stat = whl_path.stat()
        whl_isodate = (
            datetime.datetime.fromtimestamp(whl_stat.st_mtime, tz=datetime.timezone.utc)
            .isoformat()
            .split("+")[0]
            + "Z"
        )
        whl_bytes = whl_path.read_bytes()
        whl_sha256 = sha256(whl_bytes).hexdigest()
        whl_md5 = md5(whl_bytes).hexdigest()

        release = [
            {
                "comment_text": "",
                "digests": {"sha256": whl_sha256, "md5": whl_md5},
                "downloads": -1,
                "filename": whl_path.name,
                "has_sig": False,
                "md5_digest": whl_md5,
                "packagetype": "bdist_wheel",
                "python_version": "py3",
                "requires_python": metadata.requires_python,
                "size": whl_stat.st_size,
                "upload_time": whl_isodate,
                "upload_time_iso_8601": whl_isodate,
                "url": f"./{whl_path.name}",
                "yanked": False,
                "yanked_reason": None,
            }
        ]

        whl_meta.write_text(
            json.dumps(
                {
                    "name": metadata.name,
                    "version": metadata.version,
                    "release": release,
                },
                indent=2,
                sort_keys=True,
            )
        )
