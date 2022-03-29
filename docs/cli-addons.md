# Extending The CLI Application

It is also possible to extend the underlying `jupyter lite` CLI by means of _Addons_.

```{info}
Addon was chosen to distinguish these pieces from browser-based _Plugins_ and
_Extensions_.
```

## CLI Architecture

The core CLI itself is comprised of:

- a set of Apps, each of which handle configuration and command parsing
  - a Manager which finds and initializes Addons
    - a set of Addons, which generate Tasks
      - `doit` Tasks, whcih actually move and update files

Addons, are advertised via `entry_points` e.g. in `pyproject.toml`:

```toml
[project.entry-points."jupyterlite.addon.v0"]
my-unique-addon = "my_module:MyAddon"
```

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

Each hook implementation is expected to return an iterable of `doit` [Tasks], of the
minimal form:

[tasks]: https://pydoit.org/tasks.html

```python
def post_build(manager):
    yield dict(
        name="a:unique:name", # will have the addon name prepended
        actions=[["things", "to", "do"]],
        # optional, but _highly_ recommended, to avoid reqork
        file_dep=["a-file", Path("another-file")],
        targets=["an-output-file"],
    )
```

The App-level tasks already have `doit.create_after` configured based on their _hook
parent_, which means a Task can _confidently_ rely on files from its parents (by any
other addons) already existing.

### BaseAddon

A convenience class, `jupyterlite.addons.base.BaseAddon` may be extended to provide a
number of useful features. It extends `traitlets.LoggingConfigurable`, and makes the
`manager` the `parent` of the addon, allowing it to be configured via
`jupyter_lite_config.json`.

```json
{
  "LiteBuildConfig": {},
  "MyAddon": {
    "enable_some_feature": true
  }
}
```

... or via the command line.

```bash
jupyter lite build --MyAddon.enable_some_feature=True
```
