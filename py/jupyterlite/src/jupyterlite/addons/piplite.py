"""a JupyterLite addon for supporting piplite wheels"""

import datetime
import json
import re
import urllib.parse
from hashlib import md5, sha256
from pathlib import Path

import doit.tools

### pyolite-specific values, will move to separate repo
#: the key for PyPI-compatible API responses pointing to wheels
PIPLITE_URLS = "pipliteUrls"
#: the schema for piplite-compatible wheel index
PIPLITE_INDEX_SCHEMA = "piplite.schema.v0.json"
#: where we put wheels, for now
PYPI_WHEELS = "pypi"


from ..constants import (
    ALL_JSON,
    ALL_WHL,
    JSON_FMT,
    JUPYTER_CONFIG_DATA,
    JUPYTERLITE_JSON,
    LAB_EXTENSIONS,
    LITE_PLUGIN_SETTINGS,
    PYOLITE_PLUGIN_ID,
    UTF8,
)
from .base import BaseAddon


class PipliteAddon(BaseAddon):
    __all__ = ["post_init", "build", "post_build", "check"]

    @property
    def output_wheels(self):
        """where wheels will go in the output folder"""
        return self.manager.output_dir / PYPI_WHEELS

    @property
    def wheel_cache(self):
        """where wheels will go in the cache folder"""
        return self.manager.cache_dir / "wheels"

    @property
    def output_extensions(self):
        """where labextensions will go in the output folder"""
        return self.manager.output_dir / LAB_EXTENSIONS

    def post_init(self, manager):
        """handle downloading of wheels"""
        for path_or_url in manager.piplite_urls:
            yield from self.resolve_one_wheel(path_or_url)

    def build(self, manager):
        """yield a doit task to copy each local wheel into the output_dir"""
        for wheel in list_wheels(manager.lite_dir / PYPI_WHEELS):
            yield from self.resolve_one_wheel(str(wheel.resolve()))

    def post_build(self, manager):
        """update the root jupyter-lite.json with pipliteUrls"""
        jupyterlite_json = manager.output_dir / JUPYTERLITE_JSON
        whl_metas = []

        wheels = list_wheels(self.output_wheels)
        pkg_jsons = sorted(
            [
                *self.output_extensions.glob("*/package.json"),
                *self.output_extensions.glob("@*/*/package.json"),
            ]
        )

        for wheel in wheels:
            whl_meta = self.wheel_cache / f"{wheel.name}.meta.json"
            whl_metas += [whl_meta]
            yield self.task(
                name=f"meta:{whl_meta.name}",
                doc=f"ensure {wheel} metadata",
                file_dep=[wheel],
                actions=[
                    (doit.tools.create_folder, [whl_meta.parent]),
                    (self.index_wheel, [wheel, whl_meta]),
                ],
                targets=[whl_meta],
            )

        if whl_metas:
            whl_index = self.manager.output_dir / PYPI_WHEELS / ALL_JSON

            yield self.task(
                name="patch",
                doc=f"ensure {JUPYTERLITE_JSON} includes any piplite wheels",
                file_dep=[*whl_metas, jupyterlite_json],
                actions=[
                    (
                        self.patch_jupyterlite_json,
                        [jupyterlite_json, whl_index, whl_metas, pkg_jsons],
                    )
                ],
                targets=[whl_index],
            )

    def check(self, manager):
        """verify that all Wheel API are valid (sorta)"""
        jupyterlite_json = manager.output_dir / JUPYTERLITE_JSON
        if not jupyterlite_json.exists():
            return
        config = json.loads(jupyterlite_json.read_text(**UTF8))
        urls = (
            config.get(JUPYTER_CONFIG_DATA, {})
            .get(LITE_PLUGIN_SETTINGS, {})
            .get(PYOLITE_PLUGIN_ID, {})
            .get(PIPLITE_URLS, [])
        )

        for wheel_index_url in urls:
            if not wheel_index_url.startswith("./"):
                continue

            wheel_index_url = wheel_index_url.split("?")[0].split("#")[0]

            path = manager.output_dir / wheel_index_url

            if not path.exists():
                continue

            yield self.task(
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
                yield self.task(
                    name=f"fetch:{name}",
                    doc=f"fetch the wheel {name}",
                    actions=[(self.fetch_one, [path_or_url, dest])],
                    targets=[dest],
                )
                will_fetch = True
        else:
            local_path = (self.manager.lite_dir / path_or_url).resolve()

        if local_path.is_dir():
            for wheel in list_wheels(local_path):
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
        yield self.task(
            name=f"copy:whl:{wheel.name}",
            file_dep=[wheel],
            targets=[dest],
            actions=[(self.copy_one, [wheel, dest])],
        )

    def patch_jupyterlite_json(self, jupyterlite_json, whl_index, whl_metas, pkg_jsons):
        """add the piplite wheels to jupyter-lite.json"""
        config = json.loads(jupyterlite_json.read_text(**UTF8))
        old_urls = (
            config.setdefault(JUPYTER_CONFIG_DATA, {})
            .setdefault(LITE_PLUGIN_SETTINGS, {})
            .setdefault(PYOLITE_PLUGIN_ID, {})
            .get(PIPLITE_URLS, [])
        )

        new_urls = []

        # first add user-specified wheels
        if whl_metas:
            metadata = {}
            for whl_meta in whl_metas:
                meta = json.loads(whl_meta.read_text(**UTF8))
                whl = self.output_wheels / whl_meta.name.replace(".json", "")
                metadata[whl] = meta["name"], meta["version"], meta["release"]

            whl_index = write_wheel_index(self.output_wheels, metadata)
            whl_index_url, whl_index_url_with_sha = self.get_index_urls(whl_index)

            added_build = False

            for url in old_urls:
                if url.split("#")[0].split("?")[0] == whl_index_url:
                    new_urls += [whl_index_url_with_sha]
                    added_build = True
                else:
                    new_urls += [url]

            if not added_build:
                new_urls = [whl_index_url_with_sha, *new_urls]
        else:
            new_urls = old_urls

        # ...then add wheels from federated extensions...
        if pkg_jsons:
            for pkg_json in pkg_jsons:
                pkg_data = json.loads(pkg_json.read_text(**UTF8))
                wheel_dir = pkg_data.get("piplite", {}).get("wheelDir")
                if wheel_dir:
                    pkg_whl_index = pkg_json.parent / wheel_dir / ALL_JSON
                    if pkg_whl_index.exists():
                        pkg_whl_index_url_with_sha = self.get(pkg_whl_index)[1]
                        new_urls += [pkg_whl_index_url_with_sha]

        # ... and only update if actually changed
        if new_urls:
            config[JUPYTER_CONFIG_DATA][LITE_PLUGIN_SETTINGS][PYOLITE_PLUGIN_ID][
                PIPLITE_URLS
            ] = new_urls

            jupyterlite_json.write_text(json.dumps(config, **JSON_FMT), **UTF8)

            self.maybe_timestamp(jupyterlite_json)

    def get_index_urls(self, whl_index):
        """get output dir relative URLs for all.json files"""
        whl_index_sha256 = sha256(whl_index.read_bytes()).hexdigest()
        whl_index_url = f"./{whl_index.relative_to(self.manager.output_dir).as_posix()}"
        whl_index_url_with_sha = f"{whl_index_url}?sha256={whl_index_sha256}"
        return whl_index_url, whl_index_url_with_sha

    def index_wheel(self, whl_path, whl_meta):
        """Generate an intermediate file representation to merge with other releases"""
        name, version, release = get_wheel_fileinfo(whl_path)
        whl_meta.write_text(
            json.dumps(dict(name=name, version=version, release=release), **JSON_FMT),
            **UTF8,
        )
        self.maybe_timestamp(whl_meta)


def list_wheels(wheel_dir):
    """get all wheels we know how to handle in a directory"""
    return sorted(sum([[*wheel_dir.glob(f"*{whl}")] for whl in ALL_WHL], []))


def get_wheel_fileinfo(whl_path):
    """Generate a minimal Warehouse-like JSON API entry from a wheel"""
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

    release = {
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

    return metadata.name, metadata.version, release


def get_wheel_index(wheels, metadata=None):
    """Get the raw python object representing a wheel index for a bunch of wheels

    If given, metadata should be a dictionary of the form:

        {Path: (name, version, metadata)}
    """
    metadata = metadata or {}
    all_json = {}

    for whl_path in sorted(wheels):
        name, version, release = metadata.get(whl_path, get_wheel_fileinfo(whl_path))
        if name not in all_json:
            all_json[name] = {"releases": {}}
        all_json[name]["releases"][version] = [release]

    return all_json


def write_wheel_index(whl_dir, metadata=None):
    """Write out an all.json for a directory of wheels"""
    wheel_index = Path(whl_dir) / ALL_JSON
    index_data = get_wheel_index(list_wheels(whl_dir), metadata)
    wheel_index.write_text(json.dumps(index_data, **JSON_FMT), **UTF8)
    return wheel_index
