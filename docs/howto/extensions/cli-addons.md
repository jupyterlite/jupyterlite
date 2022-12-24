# Create a new addon to extend the CLI

While much of the behavior of a JupyterLite application can be configured or otherwise
modified by [extensions][frontend], this may not be enough for all needs. It is also
possible to extend the underlying `jupyter lite` [CLI](../../reference/cli.ipynb) by
means of _Addons_.

A custom _Addon_ can do anything to the _output folder_ of a built lite application, as
well as modify the behavior of other _Addons_, including the ones that comprise the core
API.

Some use cases:

- shipping a complex [frontend extension][frontend]
- predictably patching files in the built application
- linting, testing, compression or other validation and optimization techniques

```{note}
_Addon_ was chosen to distinguish these pieces from browser-based _Plugins_ and
_Extensions_ for the [frontend], and all `jupyter lite` core
behavior is implemented as _Addons_.
```

[frontend]: ../../howto/configure/simple_extensions.md

## CLI Architecture

Before digging into building an Addon, it's worth understanding where in the overall
structure of the CLI they fit.

In order to download, unpack, and update static files and configurations from a number
of sources, the CLI uses a number of layers.

| Component | Example              | Role                                           |
| --------- | -------------------- | ---------------------------------------------- |
| App       | [LiteBuildApp]       | load config and parse CLI parameters           |
| Manager   | [LiteManager]        | load Addons, run `doit`                        |
| Addon     | [StaticAddon]        | generate task plan, and implement actions      |
| [Hook]    | `init`               | collect logical lifecycle tasks                |
| [Phase]   | `pre_init`           | fine-grained ordering for tasks                |
| [Task]    | `init:static:unpack` | set of actions with Task and file dependencies |
| Action    | `_unpack_stdlib`     | actually move and update files                 |

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
    __all__ = ["status"]

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

### `BaseAddon`

A convenience class, [`jupyterlite.addons.base.BaseAddon`][baseaddon] may be extended to
provide a number of useful features. It extends `traitlets.LoggingConfigurable`, and
makes the `LiteManager` the `parent` of the _Addon_, allowing it to be [configured by
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

### Short CLI

An _Addon_ which inherits from `BaseAddon` (or `traitlets.Configurable` some other way)
can tell the parent application that it exposes additional CLI [_aliases_ and
_flags_][traitlets-cli], both for execution, and when queried with `--help`.

```{hint}
_Addons_ authors are encouraged to group their aliases and flags by using a common prefix.
```

[traitlets-cli]: https://traitlets.readthedocs.io/en/stable/config.html#common-arguments

#### Aliases

An _alias_ maps a CLI argument to a single trait.

```py
from traitlets import Int

class MyFooAddon(BaseAddon):
    __all__ = ["status"]
    aliases = {
      "how-many-foos": "MyFooAddon.foo",
    }
    foo = Int(0, help="The number of foos").tag(config=True)
    # ...
```

```{warning}
_Addons_ may **not** overload core aliases, or the aliases of previously-loaded
addons.
```

#### Flags

A _flag_ maps a CLI argument to any number of traits on any number of
`traitlets.Configurable` classes:

```py
from traitlets import Int, Bool

class MyFooBarAddon(BaseAddon):
    __all__ = ["status"]
    flags = {
      "foo-bar": (
        {"MyFooBarAddon": {"foo": 1, "bar": True}},
        "Foo once, and bar",
      )
    }
    foo = Int(0, help="The number of foos").tag(config=True)
    bar = Bar(False, help="Whether to bar").tag(config=True)
    # ...
```

```{note}
_Addons_ may augment the behavior of existing flags, but **not** override
previously-registered configuration values. Help text will be appended with a newline.
```

## Packaging

_Addons_ are advertised via `entry_points` e.g. in `pyproject.toml`:

```toml
[project.entry-points."jupyterlite.addon.v0"]
my-unique-addon = "my_module:MyAddon"
```

## General Guidance

- it's worth looking at how what `BaseAddon` and its subclasses handle certain tasks
- keeping reproducbility in mind, cache liberally, and make use of `file_deps`,
  `targets`, and `uptodate` to keep builds snappy
