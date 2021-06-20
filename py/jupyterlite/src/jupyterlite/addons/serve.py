"""a JupyterLite addon for serving"""
import sys

import doit
from traitlets import Bool, Int, default

from .base import BaseAddon


class ServeAddon(BaseAddon):
    __all__ = ["status", "serve"]

    has_tornado: bool = Bool()
    port: int = Int(8000)

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
                    f"""    will serve {self.port} with: {"tornado" if self.has_tornado else "stdlib"}"""
                )
            ],
        )

    def serve(self, manager):
        task = dict(
            name="serve",
            doc=f"run server at http://localhost:{self.port}/ for {manager.output_dir}",
            uptodate=[lambda: False],
        )

        if self.has_tornado:
            task["actions"] = [(self._serve_tornado, [])]
        else:
            task["actions"] = [
                lambda: self.log.info(
                    "Using python's built-in http.server: "
                    "install tornado for a snappier experience"
                ),
                doit.tools.Interactive(
                    [sys.executable, "-m", "http.server", "-b", "localhost"],
                    cwd=str(self.manager.output_dir),
                    shell=False,
                ),
            ]
        yield task

    def _serve_tornado(self):
        from tornado import ioloop, web

        class Handler(web.StaticFileHandler):
            def parse_url_path(self, url_path):
                if not url_path or url_path.endswith("/"):
                    url_path = url_path + "index.html"
                return url_path

        path = str(self.manager.output_dir)
        routes = [("/(.*)", Handler, {"path": path})]
        app = web.Application(routes, debug=True)
        self.log.warning(
            f"""

        Serving JupyterLite from:
            {path}
        on:
            http://localhost:{self.port}/

        *** Press Ctrl+C to exit **
        """
        )
        app.listen(self.port)
        try:
            ioloop.IOLoop.instance().start()
        except KeyboardInterrupt:
            self.log.warning(f"""Stopping http://localhost:{self.port}...""")
