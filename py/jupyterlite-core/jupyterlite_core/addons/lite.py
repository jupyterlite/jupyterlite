# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

"""a JupyterLite addon for jupyterlite-specific tasks"""

import json
import re

from ..constants import (
    EXPOSE_APP_IN_BROWSER,
    JSON_FMT,
    JUPYTER_CONFIG_DATA,
    JUPYTERLITE_IPYNB,
    JUPYTERLITE_JSON,
    JUPYTERLITE_METADATA,
    JUPYTERLITE_SCHEMA,
    UTF8,
)
from .base import BaseAddon


class LiteAddon(BaseAddon):
    """ensure jupyterlite files have been merged, and validate them"""

    __all__ = ["build", "check", "post_build", "status"]

    def status(self, manager):
        yield self.task(
            name=JUPYTERLITE_JSON,
            actions=[
                lambda: self.log.debug(f"""    jupyter-lite.(json|ipynb): {self.lite_files}"""),
                lambda: self.log.info(
                    f"""    jupyter-lite.(json|ipynb): {len(self.lite_files)} files"""
                ),
            ],
        )

    def build(self, manager):
        """merge jupyter-lite.json into the output_dir"""
        lite_dir = manager.lite_dir
        output_dir = manager.output_dir

        for jupyterlite_file in self.lite_files:
            rel = jupyterlite_file.relative_to(lite_dir)
            dest = output_dir / rel

            # Skip config files in subdirectories that don't exist in the output
            # (i.e., not a known app directory like lab, repl, tree, etc.)
            is_in_subdirectory = str(rel.parent) != "."
            if is_in_subdirectory and not dest.parent.exists():
                self.log.warning(
                    f"[lite] Skipping {rel}: parent directory does not exist in output. "
                    f"Config files should be in the root or in app directories (lab, repl, etc.)"
                )
                continue

            yield self.task(
                name=f"patch:{rel}",
                file_dep=[jupyterlite_file],
                actions=[
                    (self.merge_one_jupyterlite, [dest, [dest, jupyterlite_file]]),
                    (self.maybe_timestamp, [dest]),
                ],
            )

    def post_build(self, manager):
        """ensure the root `jupyter-lite.json` exposes the app when requested"""
        if not manager.expose_app_in_browser:
            return

        out_path = manager.output_dir / JUPYTERLITE_JSON

        yield self.task(
            name="patch:exposeAppInBrowser",
            doc=f"ensure {out_path} exposes the app in the browser",
            file_dep=[out_path],
            actions=[(self.patch_expose_app_in_browser, [out_path])],
        )

    def patch_expose_app_in_browser(self, out_path):
        """set the ``exposeAppInBrowser`` configuration value"""
        config = json.loads(out_path.read_text(**UTF8))
        config[JUPYTER_CONFIG_DATA][EXPOSE_APP_IN_BROWSER] = True
        out_path.write_text(json.dumps(config, **JSON_FMT), **UTF8)
        self.maybe_timestamp(out_path)

    def check(self, manager):
        """apply schema validation to all `jupyter-lite.json` in the `output_dir`"""
        schema = manager.output_dir / JUPYTERLITE_SCHEMA
        file_dep = []

        if not schema.exists():  # pragma: no cover
            return

        file_dep += [schema]

        for lite_file in [
            *manager.output_dir.rglob(JUPYTERLITE_JSON),
            *manager.output_dir.rglob(JUPYTERLITE_IPYNB),
        ]:
            stem = lite_file.relative_to(manager.output_dir)
            selector = (
                None if lite_file.name == JUPYTERLITE_JSON else ["metadata", JUPYTERLITE_METADATA]
            )
            yield self.task(
                name=f"validate:{stem}",
                file_dep=[schema, lite_file],
                actions=[
                    (
                        self.validate_one_json_file,
                        [schema, lite_file, None, selector],
                    )
                ],
            )

    @property
    def lite_files(self):
        """all the source `jupyter-lite.*` files, excluding ignored directories"""
        lite_dir = self.manager.lite_dir
        all_lite_files = [
            *lite_dir.rglob(JUPYTERLITE_JSON),
            *lite_dir.rglob(JUPYTERLITE_IPYNB),
        ]
        return [p for p in all_lite_files if not self._is_ignored_lite_config(p)]

    def _is_ignored_lite_config(self, path):
        """check if a path should be ignored based on ignore patterns"""
        rel_posix_path = f"/{path.relative_to(self.manager.lite_dir).as_posix()}"
        ignore_patterns = [
            *self.manager.ignore_lite_config,
            *self.manager.extra_ignore_lite_config,
        ]
        return any(re.findall(p, rel_posix_path) for p in ignore_patterns)
