"""a JupyterLite addon for MathJax 2"""
import json
from pathlib import Path

from ..constants import JSON_FMT, JUPYTER_CONFIG_DATA, JUPYTERLITE_JSON, UTF8
from .base import BaseAddon

MATHJAX_JS = "MathJax.js"
MATHJAX_PATH = None
MATHJAX_CONFIG_SHIPPED = "TeX-AMS-MML_HTMLorMML-full,Safe"

FULL_MATHJAX_URL = "fullMathjaxUrl"
MATHJAX_CONFIG = "mathjaxConfig"

try:
    from jupyter_server_mathjax.app import STATIC_ASSETS_PATH

    MATHJAX_PATH = Path(STATIC_ASSETS_PATH)
except ImportError:  # pragma: no cover
    pass


class MathjaxAddon(BaseAddon):
    """Ship mathjax assets"""

    __all__ = ["status", "build", "post_build", "check"]

    @property
    def mathjax_output(self):
        """The path where ``jupyter_server_mathjax`` _would_ serve from"""
        return self.manager.output_dir / "static/jupyter_server_mathjax"

    @property
    def mathjax_path(self):
        path = None

        manager_path = None

        try:
            if self.manager.mathjax_dir.exists():
                manager_path = self.manager.mathjax_dir
        except Exception:  # pragma: no cover
            pass

        if manager_path is not None:
            path = manager_path
        elif not self.is_sys_prefix_ignored() and MATHJAX_PATH:
            path = MATHJAX_PATH

        if path and path.exists():
            return path

    def status(self, manager):
        """Report MathJax status"""
        yield dict(
            name="status",
            doc="Get information about offline MathJax",
            actions=[self.log_status],
        )

    def build(self, manager):
        """"""
        if not self.mathjax_path:
            return

        yield dict(
            name="copy",
            doc="copy MathJax into the output dir",
            file_dep=[self.mathjax_path / MATHJAX_JS],
            targets=[self.mathjax_output / MATHJAX_JS],
            actions=[(self.copy_one, [self.mathjax_path, self.mathjax_output])],
        )

    def post_build(self, manager):
        """update the root jupyter-lite.json with MathJax configuration"""

        if not self.mathjax_path:
            return

        jupyterlite_json = manager.output_dir / JUPYTERLITE_JSON

        yield dict(
            name="patch",
            doc=f"ensure {JUPYTERLITE_JSON} includes the mathjax url",
            file_dep=[jupyterlite_json],
            actions=[(self.patch_mathjax_config, [jupyterlite_json])],
        )

    def check(self, manager):
        """Check if the MathJax paths are consistent"""
        jupyterlite_json = manager.output_dir / JUPYTERLITE_JSON

        yield dict(
            name="config",
            file_dep=[jupyterlite_json],
            actions=[(self.check_config_paths, [jupyterlite_json])],
        )

    def log_status(self):
        ignore = self.is_sys_prefix_ignored()
        print(
            "     jupyter-server-mathjax:",
            MATHJAX_PATH,
            "(ignored)" if ignore else "",
        )
        print("     configured MathJax dir:", self.manager.mathjax_dir)
        print("     effective MathJax dir:", self.mathjax_path)

    def patch_mathjax_config(self, jupyterlite_json):
        config = json.loads(jupyterlite_json.read_text(**UTF8))
        mathjax_url = str(
            self.mathjax_output.relative_to(self.manager.output_dir).as_posix()
        )
        config[JUPYTER_CONFIG_DATA].update(
            {FULL_MATHJAX_URL: f"./{mathjax_url}/{MATHJAX_JS}"}
        )

        # overload this for the configs actually served
        if self.mathjax_path and MATHJAX_PATH:
            if self.mathjax_path.resolve() == MATHJAX_PATH.resolve():
                config[JUPYTER_CONFIG_DATA][MATHJAX_CONFIG] = MATHJAX_CONFIG_SHIPPED

        jupyterlite_json.write_text(json.dumps(config, **JSON_FMT), **UTF8)

    def check_config_paths(self, jupyterlite_json):
        config = json.loads(jupyterlite_json.read_text(**UTF8))[JUPYTER_CONFIG_DATA]
        mathjax_url = config.get(FULL_MATHJAX_URL)

        if not mathjax_url or not mathjax_url.startswith("./"):
            return

        mathjax_path = Path(self.manager.output_dir / mathjax_url).parent
        assert mathjax_path.exists(), f"{mathjax_path} not found"
        mathjax_js = mathjax_path / MATHJAX_JS
        assert mathjax_js.exists(), f"{mathjax_js} not found"

        for config in config.get(MATHJAX_CONFIG, "").split(","):
            config_js = mathjax_path / f"config/{config}.js"
            assert config_js.exists(), f"{config_js} doesn't exist, fix mathjaxConfig"
