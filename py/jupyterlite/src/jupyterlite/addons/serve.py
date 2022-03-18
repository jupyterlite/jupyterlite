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
        yield dict(name="contents", actions=[self._print_status])

    def _print_status(self):
        print(
            f"""    url: {self.url}"""
            "\n"
            f"""    server: {"tornado" if self.has_tornado else "stdlib"}"""
        )

        print("""    headers:""")
        for headers in [self.manager.http_headers, self.manager.extra_http_headers]:
            for header, value in headers.items():
                print(f"""        {header}: {value}""")

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
        from tornado import httpserver, ioloop, web

        manager = self.manager

        def shutdown():
            http_server.stop()
            ioloop.IOLoop.current().stop()

        class ShutdownHandler(web.RequestHandler):
            def get(self):
                ioloop.IOLoop.instance().add_callback(shutdown)

        class StaticHandler(web.StaticFileHandler):
            def set_default_headers(self):
                for headers in [manager.http_headers, manager.extra_http_headers]:
                    for header, value in headers.items():
                        if value is not None:
                            self.set_header(header, value)

            def parse_url_path(self, url_path):
                if not url_path or url_path.endswith("/"):
                    url_path = url_path + "index.html"
                return url_path

        path = str(manager.output_dir)
        app = web.Application(
            [
                (manager.base_url + "shutdown", ShutdownHandler),
                (manager.base_url + "(.*)", StaticHandler, {"path": path}),
            ],
            debug=True,
        )
        self.log.warning(
            f"""

        Serving JupyterLite Debug Server from:
            {path}
        on:
            {self.url}index.html

        *** Exit by: ***
            - Pressing Ctrl+C
            - Visiting {self.manager.base_url}shutdown
        """
        )
        http_server = httpserver.HTTPServer(app)
        http_server.listen(manager.port)
        try:
            ioloop.IOLoop.instance().start()
        except KeyboardInterrupt:  # pragma: no cover
            self.log.warning(f"Stopping {self.url}")
