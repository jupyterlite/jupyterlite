import shutil
import json
import jsonschema

from traitlets.config import LoggingConfigurable
from traitlets import Instance

from ..manager import LiteManager


class BaseAddon(LoggingConfigurable):
    """A base class for addons to the JupyterLite build chain

    Subclassing this is optional, but provides some useful guidelines
    """

    manager: LiteManager = Instance(LiteManager)

    @property
    def log(self):
        return self.manager.log

    def copy_one(self, src, dest):
        """copy one Path (a file or folder)"""
        if not dest.parent.exists():
            dest.mkdir(parents=True)

        if dest.is_dir():
            shutil.rmtree(dest)
        elif dest.exists():
            dest.unlink()

        if src.is_dir():
            shutil.copytree(src, dest)
        else:
            shutil.copy2(src, dest)

    def validate_one_json_file(self, validator, path):
        loaded = json.loads(path.read_text(encoding="utf-8"))

        if validator is None:
            return True

        validator.validate(loaded)

    def get_validator(self, schema_path, klass=jsonschema.Draft7Validator):
        schema = json.loads(schema_path.read_text(encoding="utf-8"))
        return klass(schema)
