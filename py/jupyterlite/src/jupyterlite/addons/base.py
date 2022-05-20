import email.utils
import json
import os
import shutil
import tempfile
import time
import warnings
from pathlib import Path

from traitlets import Bool, Instance
from traitlets.config import LoggingConfigurable

from ..constants import (
    DISABLED_EXTENSIONS,
    FEDERATED_EXTENSIONS,
    JSON_FMT,
    JUPYTER_CONFIG_DATA,
    JUPYTERLITE_IPYNB,
    JUPYTERLITE_METADATA,
    SETTINGS_OVERRIDES,
    SOURCEMAP_IGNORE_PATTERNS,
    SOURCEMAPS,
    UTF8,
)
from ..manager import LiteManager


class BaseAddon(LoggingConfigurable):
    """A base class for addons to the JupyterLite build chain

    Subclassing this is optional, but provides some useful utilities
    """

    manager: LiteManager = Instance(LiteManager)

    ignore_sys_prefix: bool = Bool(False)

    def __init__(self, manager, *args, **kwargs):
        kwargs["parent"] = manager
        kwargs["manager"] = manager
        super().__init__(*args, **kwargs)

    @property
    def log(self):
        return self.manager.log

    def copy_one(self, src, dest):
        """copy one Path (a file or folder)"""
        if self.manager.no_sourcemaps and self.is_ignored_sourcemap(src.name):
            return

        if dest.is_dir():
            shutil.rmtree(dest)
        elif dest.exists():
            dest.unlink()

        if not dest.parent.exists():
            self.log.debug(f"creating folder {dest.parent}")
            dest.parent.mkdir(parents=True)

        self.maybe_timestamp(dest.parent)

        copytree_kwargs = {}

        if self.manager.no_sourcemaps:
            copytree_kwargs["ignore"] = SOURCEMAP_IGNORE_PATTERNS

        if src.is_dir():
            shutil.copytree(src, dest, **copytree_kwargs)
        else:
            shutil.copy2(src, dest)

        self.maybe_timestamp(dest)

    def fetch_one(self, url, dest):
        """fetch one file

        TODO: enable other backends, auth, etc.
        """
        import urllib.request

        if dest.exists():
            self.log.info(f"[lite][fetch] already downloaded {dest.name}, skipping...")
            return

        if not dest.parent.exists():
            dest.parent.mkdir(parents=True)

        with tempfile.TemporaryDirectory() as td:
            tdp = Path(td)
            with urllib.request.urlopen(url) as response:
                tmp_dest = tdp / dest.name
                with tmp_dest.open("wb") as fd:
                    shutil.copyfileobj(response, fd)
                last_modified = response.headers.get("Last-Modified")
                if last_modified:
                    epoch_time = time.mktime(email.utils.parsedate(last_modified))
                    os.utime(tmp_dest, (epoch_time, epoch_time))
            shutil.copy2(tmp_dest, dest)

    def maybe_timestamp(self, path):
        if not path.exists() or self.manager.source_date_epoch is None:
            return

        if path.is_dir():
            for p in path.rglob("*"):
                self.timestamp_one(p)

        self.timestamp_one(path)

    def timestamp_one(self, path):
        """adjust the timestamp to be --source-date-epoch for files newer than then

        see https://reproducible-builds.org/specs/source-date-epoch
        """
        stat = path.stat()
        sde = self.manager.source_date_epoch
        if stat.st_mtime > sde:
            cls = self.__class__.__name__
            self.log.debug(
                f"[lite][base] <{cls}> set time to source_date_epoch {sde} on {path}"
            )
            os.utime(path, (sde, sde))
            return
        return

    def delete_one(self, *src):
        """delete... somethings"""
        for src_dir in src:
            if src_dir.is_dir():
                shutil.rmtree(src_dir)
            elif src_dir.exists():
                src_dir.unlink()

    def validate_one_json_file(self, validator, path=None, data=None, selector=[]):
        if path:
            loaded = json.loads(path.read_text(**UTF8))
        else:
            loaded = data

        if selector:
            for sel in selector:
                selected = loaded.get(sel, {})
        else:
            selected = loaded

        if validator is None:
            # just checking if the JSON is well-formed
            return True

        if isinstance(validator, Path):
            validator = self.get_validator(validator)
            if validator is None:
                return True

        validator.validate(selected)

    def get_validator(self, schema_path, klass=None):
        if klass is None:
            try:
                from jsonschema import Draft7Validator
            except ImportError:  # pragma: no cover
                warnings.warn(
                    "jsonschema >=3 not installed: only checking JSON well-formedness"
                )
                return None
            klass = Draft7Validator

        schema = json.loads(schema_path.read_text(**UTF8))
        return klass(schema)

    def merge_one_jupyterlite(self, out_path, in_paths):
        """write the ``out_path`` with the merge content of ``in_paths``, where
        all are valid ``jupyter-lite.*`` files.

        .. todo::

            Notebooks
        """
        self.log.debug(f"[lite][config][merge] {out_path}")
        config = None

        for in_path in in_paths:
            self.log.debug(f"[lite][config][merge] . {in_path}")
            in_config = None
            try:
                in_config = json.loads(in_path.read_text(**UTF8))
                if out_path.name == JUPYTERLITE_IPYNB:
                    in_config = in_config["metadata"].get(JUPYTERLITE_METADATA)
            except:
                pass

            if not in_config:
                continue

            if not config:
                config = in_config
                continue

            for k, v in in_config.items():
                self.log.debug(f"""[lite][config] ... updating {k} => {v}?""")
                if k == JUPYTER_CONFIG_DATA:
                    config[k] = self.merge_jupyter_config_data(config.get(k) or {}, v)
                else:
                    if config.get(k) != v:
                        self.log.debug(f"""[lite][config] ..... {k} updated""")
                        config[k] = v

        if config and JUPYTER_CONFIG_DATA in config:
            self.dedupe_federated_extensions(config[JUPYTER_CONFIG_DATA])

        if out_path.name == JUPYTERLITE_IPYNB:
            if out_path.exists():
                doc_path = out_path
            else:
                for in_path in in_paths:
                    if in_path.name == JUPYTERLITE_IPYNB and in_path.exists():
                        doc_path = in_path
                        break

            doc = json.loads(doc_path.read_text(**UTF8))

            doc["metadata"][JUPYTERLITE_METADATA] = config

            out_path.write_text(json.dumps(doc, **JSON_FMT), **UTF8)
        else:
            out_path.write_text(json.dumps(config, **JSON_FMT), **UTF8)

    def merge_jupyter_config_data(self, config, in_config):
        """merge well-known ``jupyter-config-data`` fields"""
        self.log.debug(f"""[lite][config][merge] ..... {config}""")
        self.log.debug(f"""[lite][config][merge] ..... {in_config}""")

        config = config or {}
        in_config = in_config or {}

        for k, v in in_config.items():
            if k in [DISABLED_EXTENSIONS, FEDERATED_EXTENSIONS]:
                config[k] = [*config.get(k, []), *v]
            elif k in [SETTINGS_OVERRIDES]:
                config[k] = config.get(k, {})
                for pkg, pkg_config in v.items():
                    config[k][pkg] = config[k].get(pkg, {})
                    config[k][pkg].update(pkg_config)
            else:
                config[k] = v
        self.log.debug(f"""[lite][config][merge] ..... {config}""")
        return config

    def dedupe_federated_extensions(self, config):
        """update a federated_extension list in-place, ensuring unique names.

        .. todo::

            best we can do, for now.
        """
        if FEDERATED_EXTENSIONS not in config:
            return

        named = {}

        for ext in config[FEDERATED_EXTENSIONS]:
            named[ext["name"]] = ext

        config[FEDERATED_EXTENSIONS] = sorted(named.values(), key=lambda x: x["name"])

    def is_ignored_sourcemap(self, path_name: str):
        is_ignored = False
        if self.manager.no_sourcemaps:
            for map_ext in SOURCEMAPS:
                if path_name.endswith(map_ext):
                    is_ignored = True
                    break
        return is_ignored

    def is_sys_prefix_ignored(self):
        return self.ignore_sys_prefix
