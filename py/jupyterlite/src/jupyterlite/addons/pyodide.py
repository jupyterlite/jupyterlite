"""a JupyterLite addon for supporting the pyodide distribution"""

import json
import re
import urllib.parse
from pathlib import Path

import doit.tools

#: where we put wheels, for now
PYODIDE_URL = "pyodideUrl"

#: where we put pyodide, for now
PYODIDE = "pyodide"
PYODIDE_JS = "pyodide.js"
PYODIDE_REPODATA = "repodata.json"

from ..constants import (
    JSON_FMT,
    JUPYTER_CONFIG_DATA,
    JUPYTERLITE_JSON,
    LITE_PLUGIN_SETTINGS,
    PYOLITE_PLUGIN_ID,
    UTF8,
)
from .base import BaseAddon


class PyodideAddon(BaseAddon):
    __all__ = ["status", "post_init", "build", "post_build", "check"]

    @property
    def pyodide_cache(self):
        """where pyodide stuff will go in the cache folder"""
        return self.manager.cache_dir / PYODIDE

    @property
    def output_pyodide(self):
        """where labextensions will go in the output folder"""
        return self.manager.output_dir / "static" / PYODIDE

    @property
    def well_known_pyodide(self):
        """a well-known path where pyodide might be stored"""
        return self.manager.lite_dir / "static" / PYODIDE

    def status(self, manager):
        """report on the status of pyodide"""
        yield self.task(
            name="pyodide",
            actions=[
                lambda: print(
                    f"     URL: {manager.pyodide_url}",
                ),
                lambda: print(f" archive: {[*self.pyodide_cache.glob('*.bz2')]}"),
                lambda: print(
                    f"   cache: {len([*self.pyodide_cache.rglob('*')])} files",
                ),
                lambda: print(
                    f"   local: {len([*self.well_known_pyodide.rglob('*')])} files"
                ),
            ],
        )

    def post_init(self, manager):
        """handle downloading of pyodide"""
        if manager.pyodide_url is None:
            return

        yield from self.cache_pyodide(manager.pyodide_url)

    def build(self, manager):
        """copy a local (cached or well-known) pyodide into the output_dir"""
        cached_pyodide = self.pyodide_cache / PYODIDE / PYODIDE

        the_pyodide = None

        if self.well_known_pyodide.exists():
            the_pyodide = self.well_known_pyodide
        elif manager.pyodide_url is not None:
            the_pyodide = cached_pyodide

        if not the_pyodide:
            return

        file_dep = [
            p
            for p in the_pyodide.rglob("*")
            if not (p.is_dir() or self.is_ignored_sourcemap(p.name))
        ]

        yield self.task(
            name="copy:pyodide",
            file_dep=file_dep,
            targets=[
                self.output_pyodide / p.relative_to(the_pyodide) for p in file_dep
            ],
            actions=[(self.copy_one, [the_pyodide, self.output_pyodide])],
        )

    def post_build(self, manager):
        """configure jupyter-lite.json for pyodide"""
        if not self.well_known_pyodide.exists() and manager.pyodide_url is None:
            return

        jupyterlite_json = manager.output_dir / JUPYTERLITE_JSON

        output_js = self.output_pyodide / PYODIDE_JS

        yield self.task(
            name=f"patch:{JUPYTERLITE_JSON}",
            doc=f"ensure {JUPYTERLITE_JSON} includes any piplite wheels",
            file_dep=[output_js],
            actions=[
                (
                    self.patch_jupyterlite_json,
                    [jupyterlite_json, output_js],
                )
            ],
        )

    def check(self, manager):
        """ensure the pyodide configuration is sound"""
        jupyterlite_json = manager.output_dir / JUPYTERLITE_JSON

        yield self.task(
            name="config",
            file_dep=[jupyterlite_json],
            actions=[(self.check_config_paths, [jupyterlite_json])],
        )

    def check_config_paths(self, jupyterlite_json):
        config = json.loads(jupyterlite_json.read_text(**UTF8))
        pyodide_url = (
            config.setdefault(JUPYTER_CONFIG_DATA, {})
            .setdefault(LITE_PLUGIN_SETTINGS, {})
            .setdefault(PYOLITE_PLUGIN_ID, {})
            .get(PYODIDE_URL)
        )

        if not pyodide_url or not pyodide_url.startswith("./"):
            return

        pyodide_path = Path(self.manager.output_dir / pyodide_url).parent
        assert pyodide_path.exists(), f"{pyodide_path} not found"
        pyodide_js = pyodide_path / PYODIDE_JS
        assert pyodide_js.exists(), f"{pyodide_js} not found"
        pyodide_repodata = pyodide_path / PYODIDE_REPODATA
        assert pyodide_repodata.exists(), f"{pyodide_repodata} not found"

    def patch_jupyterlite_json(self, jupyterlite_json, output_js):
        """update jupyter-lite.json to use the local pyodide"""
        config = json.loads(jupyterlite_json.read_text(**UTF8))
        pyolite_config = (
            config.setdefault(JUPYTER_CONFIG_DATA, {})
            .setdefault(LITE_PLUGIN_SETTINGS, {})
            .setdefault(PYOLITE_PLUGIN_ID, {})
        )
        url = "./{}".format(output_js.relative_to(self.manager.output_dir).as_posix())
        if pyolite_config.get(PYODIDE_URL) != url:
            pyolite_config[PYODIDE_URL] = url
            jupyterlite_json.write_text(json.dumps(config, **JSON_FMT), **UTF8)
            self.maybe_timestamp(jupyterlite_json)

    def cache_pyodide(self, path_or_url):
        """copy pyodide to the cache"""
        if re.findall(r"^https?://", path_or_url):
            url = urllib.parse.urlparse(path_or_url)
            name = url.path.split("/")[-1]
            dest = self.pyodide_cache / name
            local_path = dest
            if not dest.exists():
                yield self.task(
                    name=f"fetch:{name}",
                    doc=f"fetch the pyodide distribution {name}",
                    actions=[(self.fetch_one, [path_or_url, dest])],
                    targets=[dest],
                )
                will_fetch = True
        else:
            local_path = (self.manager.lite_dir / path_or_url).resolve()
            dest = self.pyodide_cache / local_path.name
            will_fetch = False

        if local_path.is_dir():
            all_paths = sorted([p for p in local_path.rglob("*") if not p.is_dir()])
            yield self.task(
                name=f"copy:pyodide:{local_path.name}",
                file_dep=[*all_paths],
                targets=[dest / p.relative_to(local_path) for p in all_paths],
                actions=[(self.copy_one, [local_path, dest])],
            )

        elif local_path.exists() or will_fetch:
            suffix = local_path.suffix
            extracted = self.pyodide_cache / PYODIDE

            if suffix == ".bz2":
                yield from self.extract_pyodide(local_path, extracted)

        else:  # pragma: no cover
            raise FileNotFoundError(path_or_url)

    def extract_pyodide(self, local_path, dest):
        """extract a local pyodide tarball to the cache"""

        yield self.task(
            name="extract:pyodide",
            file_dep=[local_path],
            uptodate=[
                doit.tools.config_changed(
                    dict(no_sourcemaps=self.manager.no_sourcemaps)
                )
            ],
            targets=[
                # there are a lot of js/data files, but we actually talk about these...
                dest / PYODIDE / PYODIDE_JS,
                dest / PYODIDE / PYODIDE_REPODATA,
            ],
            actions=[(self.extract_one, [local_path, dest])],
        )
