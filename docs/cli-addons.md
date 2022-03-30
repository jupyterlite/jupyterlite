# Extending the CLI

While much of the behavior of a JupyterLite application can be
[configured](./configuring.md) or otherwise modified by [extensions][frontend], this may
not be enough for all needs. It is also possible to extend the underlying `jupyter lite`
[CLI](./cli.ipynb) by means of _Addons_.

A custom Addon can do anything to the _output folder_ of a built lite application, as
well as modify the behavior of other addons, including the ones that comprise the core
API.

Some use cases:

- shipping a complex [frontend extension][frontend]
- predictably patching files in the built application
- linting, testing, compression or other validation and optimization techniques

```{note}
_Addon_ was chosen to distinguish these pieces from browser-based _Plugins_ and
_Extensions_ for the [frontend](./extensions.md), and all `jupyter lite` core
behavior is implemented as Addons.
```

[frontend]: ./extensions.md

## CLI Architecture

Before digging into building an Addon, it's worth understanding where in the overall
structure of the CLI they fit.

In order to download, unpacking, and update static files and configurations from a
number of sources, the CLI uses a number of layers.

| Componet | Example              | Role                                           |
| -------- | -------------------- | ---------------------------------------------- |
| App      | [LiteBuildApp]       | load config and parse CLI parameters           |
| Manager  | [LiteManager]        | load Addons, run `doit`                        |
| Addon    | [StaticAddon]        | generate task plan, and implement actions      |
| [Hook]   | `init`               | collect logical lifecycle tasks                |
| [Phase]  | `pre_init`           | fine-grained ordering for tasks                |
| [Task]   | `init:static:unpack` | set of actions with Task and file dependencies |
| Action   | `_unpack_stdlib`     | actually move and update files                 |

[hook]: jupyterlite.constants.HOOKS
[litebuildapp]: jupyterlite.app.LiteBuildApp
[litemanager]: jupyterlite.manager.LiteManager
[staticaddon]: jupyterlite.addons.static.StaticAddon
[phase]: jupyterlite.constants.PHASES
[task]: https://pydoit.org/tasks.html

## Structure of an Addon

At its very simplest, an Addon is initialized with a signature like:

```python
class MyAddon:
    __all__ = ["status']

    def status(self, maanger):
        yield dict(name="hello", actions=[lambda: print("world")])
```

- the `__all__` member list the _hooks_ the Addon implements
  - hooks may also be prefixed with `pre_` and `post_` _phase_
- hook implementations, as advertised

Of note:

- The `status` phase should have no side-effects
- The `init` phase is mostly reserved for "gold master" content
- The `build` is mostly reserved for user-authored content

```{hint}
See the existing examples in this JupyterLite repo for other hook implementations.
```

### Generating Tasks

Each hook implementation is expected to return an iterable of `doit` [Tasks][task], of
the minimal form:

```python
def post_build(manager):
    yield dict(
        name="a:unique:name", # will have the Addon, and maybe a prefix, prepended
        actions=[["things", "to", "do"]],
        file_dep=["a-file", Path("another-file")],
        targets=["an-output-file"],
    )
```

The App-level tasks already have `doit.create_after` configured based on their [hook
parent][hook-parent], which means a Task can _confidently_ rely on files from its
parents (by any other addons) already existing.

While not _required_, having accurate `file_dep` and `targets` help ensure that the
built application is always in a consistent state, _without_ substantial rework.

[hook-parent]: jupyterlite.constants.HOOK_PARENTS

### BaseAddon

A convenience class, [`jupyterlite.addons.base.BaseAddon`][baseaddon] may be extended to
provide a number of useful features. It extends `traitlets.LoggingConfigurable`, and
makes the `manager` the `parent` of the addon, allowing it to be [configured by
name][config] via `jupyter_lite_config.json`:

[baseaddon]: jupyterlite.addons.base.BaseAddon
[config]: https://traitlets.readthedocs.io/en/stable/config.html#module-traitlets.config

```json
{
  "LiteBuildConfig": {
    "ignore_sys_prefix": true
  },
  "MyAddon": {
    "enable_some_feature": true
  }
}
```

... or via the command line.

```bash
jupyter lite build --MyAddon.enable_some_feature=True
```

## Packaging

Addons are advertised via `entry_points` e.g. in `pyproject.toml`:

```toml
[project.entry-points."jupyterlite.addon.v0"]
my-unique-addon = "my_module:MyAddon"
```

## General Guidance

- it's worth looking at how what `BaseAddon` and its subclasses handle certain tasks
- keeping reproducbility in mind, cache liberally, and make use of `file_deps`,
  `targets`, and `uptodate` to keep builds snappy
