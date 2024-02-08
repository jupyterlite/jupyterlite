# Advanced extension configuration

```{warning}
This is a more advanced section on extension configuration.
We recommend following the [simple extensions](../simple_extensions.md) guide first.
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

## Disabling Extensions at Runtime

All third-party extensions, and some provided by JupyterLite and JupyterLab, can be
disabled for one or all apps deployed in a site with the `disabledExtensions` option.

For example, a site that doesn't need the content to be available from the Python kernel
can disable the [`ServiceWorker`](./service-worker.md) plugin with the following
`jupyter-lite.json`:

```json
{
  "jupyter-lite-schema-version": 0,
  "jupyter-config-data": {
    "disabledExtensions": ["@jupyterlite/server-extension:service-worker"]
  }
}
```

## Specifying extra paths to look for extensions

The `jupyter-lite` CLI supports providing extra paths to look for extensions.

You can specify the `--FederatedExtensionAddon.extra_labextensions_path` CLI option when
building the site:

```
jupyter lite build --FederatedExtensionAddon.extra_labextensions_path=/path/to/extra/labextensions
```

Or in a `jupyter_lite_config.json`:

```json
{
  "FederatedExtensionAddon": {
    "extra_labextensions_path": ["/path/to/extra/labextensions"]
  }
}
```

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
federated extensions, as packaged on:

- PyPI:
  - `.whl`
- conda-forge:
  - `.tar.bz2`
  - `.conda` (_see warning below_)

### Using `libarchive`

If detected, [`libarchive-c`](https://pypi.org/project/libarchive-c) will be used for
better performance, especially when working with archives with many/large assets,
especially [pyodide](../../pyodide/pyodide.md).

If `libarchive-c` is not detected, Python's built-in `zipfile` and `tarfile` modules
will be used.

```{warning}
Extracting federated extensions from `.conda` packages **requires** `libarchive-c`.
```
