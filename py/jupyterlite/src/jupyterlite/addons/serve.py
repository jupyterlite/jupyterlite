"""a JupyterLite addon for serving"""
import sys

import doit
from traitlets import Bool, default

from .base import BaseAddon

# we _really_ don't want to be in the server-running business, so hardcode, now...
HOST = "127.0.0.1"


class ServeAddon(BaseAddon):
    __all__ = ["status", "serve"]

    has_tornado: bool = Bool()

    @default("has_tornado")
    def _default_has_tornado(self):
        try:
            __import__("tornado")

            return True
        except (ImportError, AttributeError):
            return False

    def status(self, manager):
        yield dict(
            name="contents",
            actions=[
                lambda: print(
                    f"""    will serve {manager.port} with: {"tornado" if self.has_tornado else "stdlib"}"""
                )
            ],
        )

    @property
    def url(self):
        return f"http://{HOST}:{self.manager.port}{self.manager.base_url}"

    def serve(self, manager):
        if self.has_tornado:
            name = "tornado"
            actions = [(self._serve_tornado, [])]
        else:
            name = "stdlib"
            actions = [
                lambda: self.log.info(
                    "Using python's built-in http.server: "
                    "install tornado for a snappier experience and base_url"
                ),
                doit.tools.Interactive(
                    [
                        sys.executable,
                        "-m",
                        "http.server",
                        "-b",
                        HOST,
                        f"{self.manager.port}",
                    ],
                    cwd=str(self.manager.output_dir),
                    shell=False,
                ),
            ]
        yield dict(
            name=name,
            doc=f"run server at {self.url} for {manager.output_dir}",
            uptodate=[lambda: False],
            actions=actions,
        )

    def _serve_tornado(self):
        from tornado import ioloop, web

        class Handler(web.StaticFileHandler):
            def parse_url_path(self, url_path):
                if not url_path or url_path.endswith("/"):
                    url_path = url_path + "index.html"
                return url_path

        path = str(self.manager.output_dir)
        routes = [(self.manager.base_url + "(.*)", Handler, {"path": path})]
        app = web.Application(routes, debug=True)
        self.log.warning(
            f"""

        Serving JupyterLite from:
            {path}
        on:
            {self.url}index.html

        *** Press Ctrl+C to exit **
        """
        )
        app.listen(self.manager.port)
        try:
            ioloop.IOLoop.instance().start()
        except KeyboardInterrupt:
            self.log.warning(f"Stopping {self.url}")
