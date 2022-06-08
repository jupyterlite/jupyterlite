# Advanced extension configuration

```{warning}
This is a more advanced section on extension configuration.
We recommend following the [](../simple_extensions.md) guide first.
```

## Ignore extensions from the environment

By default JupyterLite uses a discovery mechanism to include extensions installed in a
local environment.

This discovery behavior can be disabled with the CLI flag `--ignore-sys-prefix` or
`LiteBuildConfig/ignore_sys_prefix`.

The `--ignore-sys-prefix` CLI flag will disable using components from the JupyterLab
environment for _all_ addons. This behavior can be configured in a more granular way on
a per-addon basis, for example:

```json
{
  "LiteBuildConfig": {
    "ignore_sys_prefix": ["federated_extensions"]
  }
}
```

This is for example useful if you don't want "side-effects" in case you are building a
site from an environment with already installed extensions.

## Extensions for a Specific App

Similar to the above, by updating `$YOUR_JUPYTERLITE/{app}/jupyter-lite.json`, the
pre-built extensions will only be available for pages within that file tree.

## Adding Custom Extensions

By placing extensions under `{lite-dir}/extensions/{org/?}{package}/`, these will also
be copied into the `output-dir` _after_ any environment extensions, and all will be
added to `{output-dir}/jupyter-lite.json#jupyter-config-data/federated_extensions`.

```{hint}
For example, after building a lab extension, you can copy the contents of
`packages.json#/jupyterlab/outputDir` right into the `lite-dir` to preview your
extension.
```

Finally, the `--federated-extensions` CLI flag and the
`LiteBuildConfig/federated_extensions` config entry allow for adding additional
federated extensions, as packaged in Python `.whl` or conda `.tar.bz2` packages.
