"""a JupyterLite addon for mathjax"""
import json
from pathlib import Path

from ..constants import JSON_FMT, JUPYTER_CONFIG_DATA, JUPYTERLITE_JSON, UTF8
from .base import BaseAddon

MATHJAX_JS = "MathJax.js"


class MathjaxAddon(BaseAddon):
    """Ship mathjax assets"""

    __all__ = ["build", "post_build"]

    @property
    def mathjax_path(self):
        try:
            from jupyter_server_mathjax.app import STATIC_ASSETS_PATH

            return Path(STATIC_ASSETS_PATH)
        except ImportError:
            return None

    @property
    def mathjax_output(self):
        return self.manager.output_dir / "static/mathjax"

    def build(self, manager):
        path = self.mathjax_path
        if path:
            yield dict(
                name="copy",
                file_dep=[path / MATHJAX_JS],
                targets=[self.mathjax_output / MATHJAX_JS],
                actions=[(self.copy_one, [path, self.mathjax_output])],
            )

    def post_build(self, manager):
        """update the root jupyter-lite.json"""

        if not self.mathjax_path:
            return

        jupyterlite_json = manager.output_dir / JUPYTERLITE_JSON

        yield dict(
            name="patch",
            doc=f"ensure {JUPYTERLITE_JSON} includes the mathjax url",
            file_dep=[jupyterlite_json],
            actions=[(self.patch_jupyterlite_json, [jupyterlite_json])],
        )

    def patch(self, jupyterlite_json):
        config = json.loads(jupyterlite_json.read_text(**UTF8))
        mathjax_url = str(
            self.mathjax_output.relative_to(self.manager.output_dir).as_posix()
        )
        config[JUPYTER_CONFIG_DATA]["fullMathjaxUrl"] = mathjax_url
        jupyterlite_json.write_text(json.dumps(config, **JSON_FMT), **UTF8)
