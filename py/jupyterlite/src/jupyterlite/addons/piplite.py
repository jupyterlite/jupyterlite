"""a JupyterLite addon for supporting piplite wheels"""

import datetime
import functools
import json
import re
import urllib.parse
import warnings
import zipfile
from hashlib import md5, sha256
from pathlib import Path
from typing import Dict as _Dict
from typing import List as _List
from typing import Tuple as _Tuple

import doit.tools
from traitlets import Bool, Unicode

from ..constants import (
    ALL_JSON,
    ALL_WHL,
    JSON_FMT,
    JUPYTER_CONFIG_DATA,
    JUPYTERLITE_JSON,
    LAB_EXTENSIONS,
    LITE_PLUGIN_SETTINGS,
    NOARCH_WHL,
    PYOLITE_PLUGIN_ID,
    UTF8,
)
from ..trait_types import TypedTuple
from .base import BaseAddon

### pyolite-specific values, will move to separate repo

#: the key for PyPI-compatible API responses pointing to wheels
PIPLITE_URLS = "pipliteUrls"

#: the schema for piplite-compatible wheel index
PIPLITE_INDEX_SCHEMA = "piplite.schema.v0.json"

#: where we put wheels, for now
PYPI_WHEELS = "pypi"

#: the key for pyodide-compatible repodata.json
REPODATA_URLS = "repodataUrls"

#: the schema for pyodidate-compatible repodata
REPODATA_SCHEMA = "repodata.schema.v0.json"

#: where setuptools wheels store their exported modules
TOP_LEVEL_TXT = "top_level.txt"

#: where all wheels store a list of all exported files
WHL_RECORD = "RECORD"

#: the pyodide index of wheels
REPODATA_JSON = "repodata.json"


#: the observed default environment of pyodide
PYODIDE_MARKER_ENV = {
    "implementation_name": "cpython",
    "implementation_version": "3.10.2",
    "os_name": "posix",
    "platform_machine": "wasm32",
    "platform_release": "3.1.27",
    "platform_system": "Emscripten",
    "platform_version": "#1",
    "python_full_version": "3.10.2",
    "platform_python_implementation": "CPython",
    "python_version": "3.10",
    "sys_platform": "emscripten",
}

TDistPackages = _Dict[str, _List[str]]


class PipliteAddon(BaseAddon):
    __all__ = ["post_init", "build", "post_build", "check"]

    # CLI
    aliases = {
        "piplite-wheels": "PipliteAddon.piplite_urls",
    }

    flags = {
        "piplite-install-on-import": (
            {"PipliteAddon": {"install_on_import": True}},
            "Index wheels by import names to install when imported",
        )
    }

    # traits
    piplite_urls: _Tuple[str] = TypedTuple(
        Unicode(),
        help="Local paths or URLs of piplite-compatible wheels to copy and index",
    ).tag(config=True)

    install_on_import: bool = Bool(
        False, help="Index wheels by import names to install when imported"
    ).tag(config=True)

    # properties

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

    # API

    def post_init(self, manager):
        """handle downloading of wheels"""
        for path_or_url in self.piplite_urls:
            yield from self.resolve_one_wheel(path_or_url)

    def build(self, manager):
        """yield a doit task to copy each local wheel into the output_dir"""
        for wheel in list_wheels(manager.lite_dir / PYPI_WHEELS):
            yield from self.resolve_one_wheel(str(wheel.resolve()))

    def post_build(self, manager):
        """update the root jupyter-lite.json with pipliteUrls"""
        jupyterlite_json = manager.output_dir / JUPYTERLITE_JSON
        whl_metas = []
        whl_repos = []

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
            if self.install_on_import:
                whl_repo = self.wheel_cache / f"{wheel.name}.repodata.json"
                whl_repos += [whl_repo]

                yield self.task(
                    name=f"meta:{whl_repo.name}",
                    doc=f"ensure {wheel} repodata",
                    file_dep=[wheel],
                    actions=[
                        (doit.tools.create_folder, [whl_repo.parent]),
                        (self.repodata_wheel, [wheel, whl_repo]),
                    ],
                    targets=[whl_repo],
                )

        if whl_metas:
            whl_index = self.manager.output_dir / PYPI_WHEELS / ALL_JSON
            repo_index = self.manager.output_dir / PYPI_WHEELS / REPODATA_JSON

            yield self.task(
                name="patch",
                doc=f"ensure {JUPYTERLITE_JSON} includes any piplite wheels",
                file_dep=[*whl_metas, *whl_repos, jupyterlite_json],
                actions=[
                    (
                        self.patch_jupyterlite_json,
                        [
                            jupyterlite_json,
                            whl_index,
                            repo_index,
                            whl_metas,
                            whl_repos,
                            pkg_jsons,
                        ],
                    )
                ],
                targets=[whl_index, repo_index],
            )

    def check(self, manager):
        """Verify that all Wheel API are valid (sorta)"""
        jupyterlite_json = manager.output_dir / JUPYTERLITE_JSON
        if not jupyterlite_json.exists():
            return
        plugin_config = (
            json.loads(jupyterlite_json.read_text(**UTF8))
            .get(JUPYTER_CONFIG_DATA, {})
            .get(LITE_PLUGIN_SETTINGS, {})
            .get(PYOLITE_PLUGIN_ID, {})
        )

        yield from self.check_index_urls(
            plugin_config.get(PIPLITE_URLS, []), PIPLITE_INDEX_SCHEMA
        )

        if self.install_on_import:
            yield from self.check_index_urls(
                plugin_config.get(REPODATA_URLS, []), REPODATA_SCHEMA
            )

    def check_index_urls(self, raw_urls, schema):
        """Validate one URL against a schema."""
        for raw_url in raw_urls:
            if not raw_url.startswith("./"):
                continue

            url = raw_url.split("?")[0].split("#")[0]

            path = self.manager.output_dir / url

            if not path.exists():
                continue

            yield self.task(
                name=f"validate:{url}",
                doc=f"validate {url} against {schema}",
                file_dep=[path],
                actions=[
                    (
                        self.validate_one_json_file,
                        [self.manager.output_dir / schema, path],
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

    def patch_jupyterlite_json(
        self, jupyterlite_json, whl_index, repo_index, whl_metas, whl_repos, pkg_jsons
    ):
        """add the piplite wheels to jupyter-lite.json"""
        config = json.loads(jupyterlite_json.read_text(**UTF8))
        plugin_config = (
            config.setdefault(JUPYTER_CONFIG_DATA, {})
            .setdefault(LITE_PLUGIN_SETTINGS, {})
            .setdefault(PYOLITE_PLUGIN_ID, {})
        )

        # first add user-specified wheels to warehouse
        warehouse_urls = self.update_warehouse_index(
            plugin_config, whl_index, whl_metas
        )

        # ...then maybe add repodata
        if self.install_on_import:
            repodata_urls = self.update_repo_index(plugin_config, repo_index, whl_repos)

        # ...then add wheels from federated extensions...
        if pkg_jsons:
            for pkg_json in pkg_jsons:
                pkg_data = json.loads(pkg_json.read_text(**UTF8))
                wheel_dir = pkg_data.get("piplite", {}).get("wheelDir")
                if wheel_dir:
                    pkg_whl_index = pkg_json.parent / wheel_dir / ALL_JSON
                    if pkg_whl_index.exists():
                        pkg_whl_index_url_with_sha = self.get(pkg_whl_index)[1]
                        warehouse_urls += [pkg_whl_index_url_with_sha]
                    pkg_repo_index = pkg_json.parent / wheel_dir / REPODATA_JSON

                    if self.install_on_import and pkg_repo_index.exists():
                        pkg_repo_index_url_with_sha = self.get(pkg_repo_index)[1]
                        repodata_urls += [pkg_repo_index_url_with_sha]

        needs_save = False

        # ... and only update if actually changed
        if warehouse_urls:
            config[JUPYTER_CONFIG_DATA][LITE_PLUGIN_SETTINGS][PYOLITE_PLUGIN_ID][
                PIPLITE_URLS
            ] = warehouse_urls
            needs_save = True

        if self.install_on_import and repodata_urls:
            config[JUPYTER_CONFIG_DATA][LITE_PLUGIN_SETTINGS][PYOLITE_PLUGIN_ID][
                REPODATA_URLS
            ] = repodata_urls
            needs_save = True

        if needs_save:
            jupyterlite_json.write_text(json.dumps(config, **JSON_FMT), **UTF8)
            self.maybe_timestamp(jupyterlite_json)

    def update_warehouse_index(self, plugin_config, whl_index, whl_metas):
        """Ensure the warehouse index is up-to-date, reporting new URLs."""
        old_warehouse_urls = plugin_config.get(PIPLITE_URLS, [])
        if not whl_metas:
            return old_warehouse_urls
        new_urls = []
        metadata = {}
        for whl_meta in whl_metas:
            meta = json.loads(whl_meta.read_text(**UTF8))
            whl = self.output_wheels / whl_meta.name.replace(".json", "")
            metadata[whl] = meta["name"], meta["version"], meta["release"]

        whl_index = write_wheel_index(self.output_wheels, metadata)
        whl_index_url, whl_index_url_with_sha = self.get_index_urls(whl_index)

        added_build = False

        for url in old_warehouse_urls:
            if url.split("#")[0].split("?")[0] == whl_index_url:
                new_urls += [whl_index_url_with_sha]
                added_build = True
            else:
                new_urls += [url]

        if not added_build:
            new_urls = [whl_index_url_with_sha, *new_urls]

        return new_urls

    def update_repo_index(self, plugin_config, repo_index, whl_repos):
        """Ensure the repodata index is up-to-date, reporting new URLs."""
        old_urls = plugin_config.get(REPODATA_URLS, [])
        if not whl_repos:
            return old_urls
        new_urls = []
        metadata = {}
        for whl_repo in whl_repos:
            meta = json.loads(whl_repo.read_text(**UTF8))
            whl = self.output_wheels / whl_repo.name.replace(".json", "")
            metadata[whl] = meta["name"], meta["version"], meta

        repo_index = write_repo_index(self.output_wheels, metadata)
        repo_index_url, repo_index_url_with_sha = self.get_index_urls(repo_index)

        added_build = False

        for url in old_urls:
            if url.split("#")[0].split("?")[0] == repo_index_url:
                new_urls += [repo_index_url_with_sha]
                added_build = True
            else:
                new_urls += [url]

        if not added_build:
            new_urls = [repo_index_url_with_sha, *new_urls]

        return new_urls

    def get_index_urls(self, index_path):
        """Get output_dir relative URLs for an index file."""
        index_sha256 = sha256(index_path.read_bytes()).hexdigest()
        index_url = f"./{index_path.relative_to(self.manager.output_dir).as_posix()}"
        index_url_with_sha = f"{index_url}?sha256={index_sha256}"
        return index_url, index_url_with_sha

    def index_wheel(self, whl_path, whl_meta):
        """Generate an intermediate file representation to merge with other releases"""
        name, version, release = get_wheel_fileinfo(whl_path)
        whl_meta.write_text(
            json.dumps(dict(name=name, version=version, release=release), **JSON_FMT),
            **UTF8,
        )
        self.maybe_timestamp(whl_meta)

    def repodata_wheel(self, whl_path, whl_repo):
        """Write out the repodata for a wheel."""
        name, version, pkg_entry = get_wheel_repodata(whl_path)
        whl_repo.write_text(
            json.dumps(pkg_entry, **JSON_FMT),
            **UTF8,
        )
        self.maybe_timestamp(whl_repo)


def list_wheels(wheel_dir):
    """Get all wheels we know how to handle in a directory"""
    return sorted(sum([[*wheel_dir.glob(f"*{whl}")] for whl in ALL_WHL], []))


def get_wheel_fileinfo(whl_path: Path):
    """Generate a minimal Warehouse-like JSON API entry from a wheel"""
    metadata = get_wheel_pkginfo(whl_path)
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


def get_wheel_repodata(whl_path: Path):
    """Get pyodide-compatible `repodata.json` fragment for a wheel.

    This only knows how to handle "simple" noarch wheels, without extra binary
    depnendencies.
    """
    name, version, release = get_wheel_fileinfo(whl_path)
    depends = get_wheel_depends(whl_path)
    modules = get_wheel_modules(whl_path)
    normalized_name = get_normalized_name(name)
    pkg_entry = {
        "name": normalized_name,
        "version": version,
        "file_name": whl_path.name,
        "install_dir": "site" if whl_path.name.endswith(NOARCH_WHL) else "dynlib",
        "sha256": release["digests"]["sha256"],
        "imports": modules,
        "depends": depends,
    }
    return normalized_name, version, pkg_entry


@functools.lru_cache(1000)
def get_wheel_pkginfo(whl_path: Path):
    """Return the as-parsed distribution information from ``pkginfo``."""
    import pkginfo

    return pkginfo.get_metadata(str(whl_path))


def get_wheel_modules(whl_path: Path) -> _List[str]:
    """Get the exported top-level modules from a wheel."""
    top_levels = {}
    records = {}
    with zipfile.ZipFile(whl_path) as zf:
        for zipinfo in zf.infolist():
            if zipinfo.filename.endswith(TOP_LEVEL_TXT):
                top_levels[zipinfo.filename] = (
                    zf.read(zipinfo).decode("utf-8").strip().splitlines()
                )
            if zipinfo.filename.endswith(WHL_RECORD):
                records[zipinfo.filename] = (
                    zf.read(zipinfo).decode("utf-8").strip().splitlines()
                )

    if len(top_levels):
        sorted_top_levels = sorted(top_levels.items(), key=lambda x: len(x[0]))
        return sorted_top_levels[0][1]

    if len(records):
        sorted_records = sorted(records.items(), key=lambda x: len(x[0]))
        # discard hash, length, etc.
        record_bits = sorted(
            [line.split(",")[0].split("/") for line in sorted_records[0][1]],
            key=lambda x: len(x),
        )

        imports = set()
        inits = []
        for bits in record_bits:
            if bits[0].endswith(".data") or bits[0].endswith(".dist-info"):
                continue
            elif bits[0].endswith(".py"):
                # this is a single-file module that gets dropped in site-packages
                imports.add(bits[0].replace(".py", ""))
            elif bits[-1].endswith("__init__.py"):
                # this might be a namespace package
                inits += [bits]

        if not imports and inits:
            for init_bits in inits:
                dotted = ".".join(init_bits[:-1])
                if any(f"{imp}." in dotted for imp in imports):
                    continue
                imports.add(dotted)

        if imports:
            return sorted(imports)

    # this should probably never happen
    raise ValueError(f"{whl_path} contains neither {TOP_LEVEL_TXT} nor {WHL_RECORD}")


def get_wheel_depends(whl_path: Path):
    """Get the normalize runtime distribution dependencies from a wheel."""
    from packaging.requirements import Requirement

    metadata = get_wheel_pkginfo(str(whl_path))

    depends: _List[str] = []

    for dep_str in metadata.requires_dist:
        if dep_str.endswith(";"):
            dep_str = dep_str[:-1]
        req = Requirement(dep_str)
        if req.marker is None or req.marker.evaluate(PYODIDE_MARKER_ENV):
            depends += [get_normalized_name(req.name)]

    return sorted(set(depends))


def get_normalized_name(raw_name: str) -> str:
    """Get a PEP 503 normalized name for a python package.

    https://peps.python.org/pep-0503/#normalized-names
    """
    return re.sub(r"[-_.]+", "-", raw_name).lower()


def get_wheel_index(wheels, metadata=None):
    """Get the raw python object representing a wheel index for a bunch of wheels

    If given, metadata should be a dictionary of the form:

        {Path: (name, version, metadata)}
    """
    metadata = metadata or {}
    all_json = {}

    for whl_path in sorted(wheels):
        name, version, release = metadata.get(whl_path) or get_wheel_fileinfo(whl_path)
        normalized_name = get_normalized_name(name)
        if normalized_name not in all_json:
            all_json[normalized_name] = {"releases": {}}
        all_json[normalized_name]["releases"][version] = [release]

    return all_json


def get_repo_index(wheels, metadata=None):
    """Get the data for a ``repodata.json``."""
    metadata = metadata or {}
    repodata_json = {"packages": {}}

    for whl_path in sorted(wheels):
        name, version, pkg_entry = metadata.get(whl_path) or get_wheel_repodata(
            whl_path
        )
        normalized_name = get_normalized_name(name)
        if normalized_name in repodata_json["packages"]:
            old_version = repodata_json["packages"][normalized_name]["version"]
            warnings.warn(
                f"{normalized_name} {old_version} will be clobbered by {version}"
            )
        repodata_json["packages"][normalized_name] = pkg_entry

    return repodata_json


def write_wheel_index(whl_dir, metadata=None):
    """Write out an ``all.json`` for a directory of wheels."""
    wheel_index = Path(whl_dir) / ALL_JSON
    index_data = get_wheel_index(list_wheels(whl_dir), metadata)
    wheel_index.write_text(json.dumps(index_data, **JSON_FMT), **UTF8)
    return wheel_index


def write_repo_index(whl_dir, metadata=None):
    """Write out a ``repodata.json`` for a directory of wheels."""
    repo_index = Path(whl_dir) / REPODATA_JSON
    index_data = get_repo_index(list_wheels(whl_dir), metadata)
    repo_index.write_text(json.dumps(index_data, **JSON_FMT), **UTF8)
    return repo_index
