"""Manager for JupyterLite
"""
import os
from pathlib import Path

import doit
import entrypoints
from traitlets import Bool, Dict, Instance, Tuple, default
from traitlets.config import LoggingConfigurable

from .constants import (
    ADDON_ENTRYPOINT,
    DEFAULT_APP_ARCHIVE,
    DEFAULT_OUTPUT_DIR,
    HOOK_PARENTS,
    HOOKS,
    JUPYTERLITE_JSON,
    PHASES,
    OVERRIDES_JSON,
)


class LiteManager(LoggingConfigurable):
    """a manager for building jupyterlite sites"""

    addons = Dict(
        help=(
            """addons that yield iterables of doit tasks at different lifecycle stages

        These are advertised with the `__all__` member, which may include
        any of _hooks_, plus an optional `pre_` and `post_` _phase_.

        Each method is expected to return an iterable of doit tasks, of the form:

            yield dict(
                name="a:unique:name", # will have the addon name prepended
                actions=[["things", "to", "do"]]
                file_dep=["a-file", Path("another-file")],
                targets=["an-output-file"],
            )

        The top-level tasks may have `doit.create_after` configured based on their
        _hook parent_, which means a task can _confidently_ rely on files that
        would already exist.
        """
        )
    )
    lite_dir: Path = Instance(Path)
    app_archive: Path = Instance(Path)
    output_dir: Path = Instance(Path)
    config = Dict()
    apps = Tuple(
        ("lab", "retro"),
        help=(
            "TODO: The apps to build... not really configurable yet "
            "without dire consequences"
        ),
    ).tag(config=True)

    strict = Bool(
        True, help=("if `True`, stop the current workflow on the first error")
    ).tag(config=True)

    files = Tuple(allow_none=True, help="Paths to be included in /files/").tag(
        config=True
    )
    ignore_files = Tuple().tag(config=True)
    overrides = Tuple().tag(config=True)

    _doit_config = Dict(help="the DOIT_CONFIG for tasks")
    _doit_tasks = Dict(help="the doit task generators")

    @property
    def log(self):
        return self.parent.log

    def initialize(self):
        # TODO: finish initialization
        self.log.debug("[lite] [addon] loading ...")
        self.log.debug(f"[lite] [addon] ... OK {len(self.addons)} addons")
        self.log.debug("[lite] [tasks] loading ...")
        self.log.debug(f"[lite] [tasks] ... OK {len(self._doit_tasks)} tasks")

    def doit_run(self, cmd, *args):
        """run a subset of the doit command line"""
        loader = doit.cmd_base.ModuleTaskLoader(self._doit_tasks)
        config = dict(GLOBAL=self._doit_config)
        runner = doit.doit_cmd.DoitMain(task_loader=loader, extra_config=config)
        runner.run([cmd, *args])

    @default("addons")
    def _default_addons(self):
        """initialize addons from entry_points"""
        addons = {}
        for name, addon in entrypoints.get_group_named(ADDON_ENTRYPOINT).items():
            self.log.debug(f"[lite] [addon] [{name}] load ...")
            try:
                addon_inst = addon.load()(manager=self)
                addons[name] = addon_inst
                for one in sorted(addon_inst.__all__):
                    self.log.debug(f"""[lite] [addon] [{name}] ... will {one}""")
            except Exception as err:
                self.log.warning(f"[lite] [addon] [{name}] FAIL", exc_info=err)
        return addons

    @default("_doit_config")
    def _default_doit_config(self):
        """our hardcoded DOIT_CONFIG"""
        return {
            "dep_file": ".jupyterlite.doit.db",
            "backend": "sqlite3",
            "verbosity": 2,
        }

    @default("_doit_tasks")
    def _default_doit_tasks(self):
        """initialize the doit task generators"""
        tasks = {}
        prev_attr = None

        for hook in HOOKS:
            for phase in PHASES:
                if phase == "pre_":
                    prev_attr = HOOK_PARENTS.get(hook)
                attr = f"{phase}{hook}"
                tasks[f"task_{attr}"] = self._gather_tasks(attr, prev_attr)
                prev_attr = attr

        return tasks

    @default("output_dir")
    def _default_output_dir(self):
        return Path(
            os.environ.get("JUPYTERLITE_OUTPUT_DIR")
            or self.lite_dir / DEFAULT_OUTPUT_DIR
        )

    @default("lite_dir")
    def _default_lite_dir(self):
        return Path.cwd()

    @default("files")
    def _default_files(self):
        lite_files = self.lite_dir / "files"

        if lite_files.is_dir():
            return [lite_files]

        return []

    @default("overrides")
    def _default_overrides(self):
        for app in [None, *self.apps]:
            app_dir = self.lite_dir / app if app else self.lite_dir
            overrides_json = app_dir / OVERRIDES_JSON
            if overrides_json.exists():
                yield overrides_json


    @default("ignore_files")
    def _default_ignore_files(self):
        return [
            ".*\.pyc" "/\.git/",
            "/\.gitignore",
            "/\.ipynb_checkpoints/",
            "/build/",
            "/lib/",
            "/dist/",
            ".*doit.db",
            "/node_modules/",
            "/envs/",
            "/venvs/",
            "/\.env",
            JUPYTERLITE_JSON.replace(".", "\\."),
            "untitled.*",
            "Untitled.*",
            f"/{self.output_dir.name}/",
        ]

    @default("app_archive")
    def _default_app_archive(self):
        return Path(os.environ.get("JUPYTERLITE_APP_ARCHIVE") or DEFAULT_APP_ARCHIVE)

    @default("config")
    def _default_config(self):
        return {}

    def list(self):
        self.doit_run("list", "--all", "--status")

    def status(self):
        self.doit_run("post_status")

    def init(self):
        self.doit_run("post_init")

    def build(self):
        self.doit_run("post_build")

    def check(self):
        self.doit_run("post_check")

    def publish(self):
        self.doit_run("post_publish")

    def serve(self):
        self.doit_run("serve")

    def _gather_tasks(self, attr, prev_attr):
        # early up-front doit stuff
        def _gather():
            for name, addon in self.addons.items():
                if attr in addon.__all__:
                    try:
                        for task in getattr(addon, attr)(self):
                            patched_task = {**task}
                            patched_task["name"] = f"""{name}:{task["name"]}"""
                            yield patched_task
                    except Exception as err:
                        self.log.error(f"[lite] [{attr}] [{name}] [ERR] {err}")
                        if self.strict:
                            raise err

        if not prev_attr:
            return _gather

        @doit.create_after(prev_attr)
        def _delayed_gather():
            for task in _gather():
                yield task

        return _delayed_gather
