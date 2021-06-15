import json
import shutil

import jsonschema
from traitlets import Instance
from traitlets.config import LoggingConfigurable

from ..manager import LiteManager


class BaseAddon(LoggingConfigurable):
    """A base class for addons to the JupyterLite build chain

    Subclassing this is optional, but provides some useful utilities
    """

    manager: LiteManager = Instance(LiteManager)

    @property
    def log(self):
        return self.manager.log

    def copy_one(self, src, dest):
        """copy one Path (a file or folder)"""
        if dest.is_dir():
            shutil.rmtree(dest)
        elif dest.exists():
            dest.unlink()

        if not dest.parent.exists():
            self.log.debug(f"creating folder {dest.parent}")
            dest.parent.mkdir(parents=True)

        if src.is_dir():
            shutil.copytree(src, dest)
        else:
            shutil.copy2(src, dest)

    def validate_one_json_file(self, validator, path=None, data=None):
        if path:
            loaded = json.loads(path.read_text(encoding="utf-8"))
        else:
            loaded = data

        if validator is None:
            return True

        validator.validate(loaded)

    def get_validator(self, schema_path, klass=jsonschema.Draft7Validator):
        schema = json.loads(schema_path.read_text(encoding="utf-8"))
        return klass(schema)

    def merge_one_jupyterlite(self, out_path, in_paths):
        """write the out_path with all of the in_paths, where all are valid
        jupyter-lite.json files.

        TODO: notebooks
        """
        config = {}

        for in_path in in_paths:
            in_config = json.loads(in_path.read_text(encoding="utf-8"))

            for k, v in in_config.items():
                if k in ["disabledExtensions", "federated_extensions"]:
                    config[k] = [*config.get("k", []), *v]
                elif k in ["settingsOverrides"]:
                    config[k] = config.get(k, {})
                    for pkg, pkg_config in v.items():
                        config[k][pkg] = config[k].get(pkg, {})
                        config[k][pkg].update(pkg_config)
                else:
                    config[k] = v

        out_path.write_text(
            json.dumps(config, indent=2, sort_keys=True), encoding="utf-8"
        )
