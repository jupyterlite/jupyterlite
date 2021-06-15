"""Manager for JupyterLite
"""
from traitlets.config import LoggingConfigurable
import entrypoints
from pathlib import Path
import shutil
import os
import doit

from traitlets import Dict, default, Instance, Tuple

from .constants import ADDON_ENTRYPOINT, OUTPUT_DIR

strict = True

HOOKS = ["init", "build", "check", "publish"]
PHASE = ["pre_", "", "post_"]


class LiteManager(LoggingConfigurable):
    """a manager for building jupyterlite"""

    addons = Dict(
        help=(
            """addons that yield iterables of doit tasks at different lifecycle stages

        These are advertised with the `__all__` member, which may include
        `init`, `build`, `check`, `publish` (to be executed in order)
        and each may include `pre_` and `post_` modifiers.

        Each method then is an iterable of doit tasks, of the form:

        dict(
            file_dep=["a-file", Path("another-file")],
            task_dep=["a:full:task:name"],
            targets=["an-output-file"],
            actions=[["things", "to", "do"]]
        )

        The top-level tasks have `create_after` configured.
        """
        )
    )
    lite_dir = Instance(Path, help=("""The root folder of a JupyterLite project"""))
    output_dir = Instance(Path, help=("""Where to build the JupyterLite site"""))
    config = Dict()
    apps = Tuple(("lab", "retro")).tag(config=True)

    _tasks = None

    @property
    def log(self):
        return self.parent.log

    def initialize(self):
        # TODO: finish initialization
        self.log.debug("[lite] loading addons ...")
        self.log.debug(f"[lite] OK loaded {len(self.addons)} addon")
        self.initialize_tasks()

    def initialize_tasks(self):
        self._tasks = {}
        prev_attr = None

        for hook in HOOKS:
            for phase in PHASE:
                attr = f"{phase}{hook}"
                self._tasks[f"task_{attr}"] = self._gather_tasks(attr, prev_attr)
                prev_attr = attr  # todo: something with this
        self.log.debug(f"[lite] tasks {self._tasks}")

    def doit_run(self, cmd, *args):
        loader = doit.cmd_base.ModuleTaskLoader(self._tasks)
        doit.doit_cmd.DoitMain(
            task_loader=loader,
            extra_config=dict(
                GLOBAL={
                    "dep_file": ".jupyterlite.doit.db",
                    "backend": "sqlite3",
                    "verbosity": 2,
                }
            ),
        ).run([cmd, *args])

    @default("addons")
    def _default_addons(self):
        """initialize addons from entry_points"""
        addons = {}
        for name, addon in entrypoints.get_group_named(ADDON_ENTRYPOINT).items():
            self.log.debug(f"[lite] [{name}] addon init ...")
            try:
                addon_inst = addon.load()(manager=self)
                addons[name] = addon_inst
                self.log.debug(
                    f"""[lite] [{name}] {addon_inst.__class__.__name__} will {", ".join(addon_inst.__all__)}"""
                )
            except Exception as err:
                self.log.warning(f"[lite] Failed to load addon: {name}", exc_info=err)
        return addons

    @default("output_dir")
    def _default_output_dir(self):
        return Path(
            os.environ.get("JUPYTERLITE_OUTPUT_DIR") or self.lite_dir / OUTPUT_DIR
        )

    @default("lite_dir")
    def _default_lite_dir(self):
        return Path.cwd()

    @default("config")
    def _default_config(self):
        return {}

    def init(self):
        self.doit_run("post_init")

    def build(self):
        self.doit_run("post_build")

    def check(self):
        self.doit_run("post_check")

    def publish(self):
        self.doit_run("post_publish")

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
                        if strict:
                            raise err

        if not prev_attr:
            return _gather

        @doit.create_after(prev_attr)
        def _delayed_gather():
            for task in _gather():
                yield task

        return _delayed_gather

    # common utilities for addons
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
