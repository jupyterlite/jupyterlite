"""a JupyterLite addon for supporting piplite wheels"""

import json
import re
import urllib.parse

import doit.tools

from ..constants import (
    ALL_JSON,
    JUPYTER_CONFIG_DATA,
    JUPYTERLITE_JSON,
    LAB_WHEELS,
    LITE_PLUGIN_SETTINGS,
    NOARCH_WHL,
    PIPLITE_INDEX_SCHEMA,
    PIPLITE_URLS,
    PYOLITE_PLUGIN_ID,
    UTF8,
)
from .base import BaseAddon


class PipliteAddon(BaseAddon):
    __all__ = ["post_init", "post_build", "check"]

    @property
    def output_wheels(self):
        """where wheels will go in the output folder"""
        return self.manager.output_dir / LAB_WHEELS

    @property
    def wheel_cache(self):
        """where wheels will go in the cache folder"""
        return self.manager.cache_dir / "wheels"

    def post_init(self, manager):
        for path_or_url in manager.piplite_urls:
            yield from self.resolve_one_wheel(path_or_url)

    def post_build(self, manager):
        """update the root jupyter-lite.json with pipliteUrls"""
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
                doc=f"ensure {JUPYTERLITE_JSON} includes the piplite wheel",
                file_dep=[*whl_metas, jupyterlite_json],
                actions=[
                    (
                        self.patch_jupyterlite_json,
                        [jupyterlite_json, whl_index, *whl_metas],
                    )
                ],
                targets=[whl_index],
            )

    def check(self, manager):
        """verify that all Wheel API are valid (sorta)"""
        jupyterlite_json = manager.output_dir / JUPYTERLITE_JSON
        config = json.loads(jupyterlite_json.read_text(encoding="utf-8"))
        urls = (
            config.get(JUPYTER_CONFIG_DATA, {})
            .get(LITE_PLUGIN_SETTINGS, {})
            .get(PYOLITE_PLUGIN_ID, {})
            .get(PIPLITE_URLS, [])
        )

        for wheel_index_url in urls:
            if not wheel_index_url.startswith("./"):
                continue

            path = manager.output_dir / wheel_index_url

            if not path.exists():
                continue

            yield dict(
                name=f"validate:{wheel_index_url}",
                doc=f"validate {wheel_index_url} with the piplite API schema",
                file_dep=[path],
                actions=[
                    (
                        self.validate_one_json_file,
                        [manager.output_dir / PIPLITE_INDEX_SCHEMA, path],
                    )
                ],
            )

    def resolve_one_wheel(self, path_or_url):
        """download a single wheel, and copy to the cache"""
        local_path = None
        will_fetch = False

        if re.findall(r"^https?://", path_or_url):
            url = urllib.parse.urlparse(path_or_url)
            name = url.path.split("/")[-1]
            dest = self.wheel_cache / name
            local_path = dest
            if not dest.exists():
                yield dict(
                    name=f"fetch:{name}",
                    doc=f"fetch the wheel {name}",
                    actions=[(self.fetch_one, [path_or_url, dest])],
                    targets=[dest],
                )
                will_fetch = True
        else:
            local_path = (self.manager.lite_dir / path_or_url).resolve()

        if local_path.is_dir():
            for wheel in local_path.glob(f"*{NOARCH_WHL}"):
                yield from self.copy_wheel(wheel)
        elif local_path.exists() or will_fetch:
            suffix = local_path.suffix

            if suffix == ".whl":
                yield from self.copy_wheel(local_path)

        else:  # pragma: no cover
            raise FileNotFoundError(path_or_url)

    def copy_wheel(self, wheel):
        """copy one wheel to output"""
        dest = self.output_wheels / wheel.name
        if dest == wheel:  # pragma: no cover
            return
        yield dict(
            name=f"copy:whl:{wheel.name}",
            file_dep=[wheel],
            targets=[dest],
            actions=[(self.copy_one, [wheel, dest])],
        )

    def patch_jupyterlite_json(self, jupyterlite_json, whl_index, *whl_metas):
        """add the piplite wheels to jupyter-lite.json"""
        config = json.loads(jupyterlite_json.read_text(**UTF8))

        index = {}

        for whl_meta in whl_metas:
            meta = json.loads(whl_meta.read_text(**UTF8))
            index.setdefault(meta["name"], {"releases": {}})["releases"][
                meta["version"]
            ] = meta["release"]

        whl_index.write_text(json.dumps(index, indent=2, sort_keys=True), **UTF8)
        urls = (
            config.setdefault(JUPYTER_CONFIG_DATA, {})
            .setdefault(LITE_PLUGIN_SETTINGS, {})
            .setdefault(PYOLITE_PLUGIN_ID, {})
            .get(PIPLITE_URLS, [])
        )
        config[JUPYTER_CONFIG_DATA][LITE_PLUGIN_SETTINGS][PYOLITE_PLUGIN_ID][
            PIPLITE_URLS
        ] = urls

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

        self.maybe_timestamp(whl_meta)
