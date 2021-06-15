"""a jupyterlite addon for serving"""
import sys
from traitlets import Bool, default, Int
import subprocess
import doit

from .base import BaseAddon
from ..constants import ALL_JSON, API_CONTENTS


class ServeAddon(BaseAddon):
    __all__ = ["status", "serve"]

    has_tornado = Bool()
    port = Int(8000)

    @default("has_tornado")
    def _default_has_tornado(self):
        try:
            import tornado

            return True
        except ImportError:
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
                doit.tools.Interactive(
                    [sys.executable, "-m", "http.server", "-b", "localhost"],
                    cwd=str(self.manager.output_dir),
                    shell=False,
                )
            ]
        yield task

    def _serve_tornado(self):
        from tornado import web, ioloop

        class Handler(web.StaticFileHandler):
            def parse_url_path(self, url_path):
                if not url_path or url_path.endswith("/"):
                    url_path = url_path + "index.html"
                return url_path

        app = web.Application(
            [("/(.*)", Handler, {"path": str(self.manager.output_dir)})], debug=True
        )
        app.listen(self.port)
        ioloop.IOLoop.instance().start()
