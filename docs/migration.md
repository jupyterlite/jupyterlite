# Migration Guide

This guide provides an overview of major (potentially breaking) changes and the steps to
follow to update JupyterLite from one version to another.

## `0.1.0b19` to `0.1.0b20`

### `jupyterlite-core`

The static assets distributed via the `jupyterlite-core` package do not include the
JavaScript kernel anymore.

Instead the JavaScript kernel is now distributed via the separate
`jupyterlite-javascript-kernel` package.

If you would like to include the JavaScript kernel in your deployment you will have to
first install it before building the JupyterLite site. For example with:

```
python -m pip install jupyterlite-javascript-kernel
```

Or add it to the
[LiteBuildConfig/federated_extensions](https://jupyterlite.readthedocs.io/en/latest/howto/configure/advanced/extensions.html#adding-custom-extensions)
config entry.

Currently the `jupyterlite` package still includes the JavaScript kernel via a
dependency on `jupyterlite-javascript-kernel`. But this might change in a future
version.

We recommend you start using the `jupyterlite-core` package directly for your
deployments, and explicitly add more kernels such as `jupyterlite-pyodide-kernel` or
`jupyterlite-javascript-kernel`.

## `0.1.0b18` to `0.1.0b19`

### `jupyterlite-core`

This release introduces a new `jupyterlite-core` package in addition to the existing
`jupyterlite` package.

The `jupyterlite-core` package provides the core functionality for building JupyterLite
websites CLI
[extension points](https://jupyterlite.readthedocs.io/en/latest/howto/extensions/cli-addons.html).
Currently it only includes a JavaScript kernel that runs in Web Worker. If you would
like to include a Python kernel in your deployment yyou will have to first install it
before building the JupyterLite site. For example with:

```
python -m pip install jupyterlite-pyodide-kernel
```

Or add it to the
[LiteBuildConfig/federated_extensions](https://jupyterlite.readthedocs.io/en/latest/howto/configure/advanced/extensions.html#adding-custom-extensions)
config entry.

The `jupyterlite` package currently provides a couple of shims as well as the Pyodide
kernel for better compatibility with existing deployments.

We recommend you start using the `jupyterlite-core` package for your deployments, and
additionally install a Python kernel such as `jupyterlite-pyodide-kernel` or
`jupyterlite-xeus-python`.

### `jupyterlite-pyodide-kernel`

The Pyodide kernel has been moved to its own repo:
[https://github.com/jupyterlite/pyodide-kernel](https://github.com/jupyterlite/pyodide-kernel)

Currently it is still installed by default with `jupyterlite` for convenience, but it is
not part of `jupyterlite-core`.

A consequence of this change is the renaming of the `pyolite` JavaScript packages:

- `@jupyterlite/pyolite-kernel` -> `@jupyterlite/pyodide-kernel`
- `@jupyterlite/pyolite-kernel-extension` -> `@jupyterlite/pyodide-kernel-extension`

Make sure to update your config if you were making use of `litePluginSettings`.

## `0.1.0b17` to `0.1.0b18`

The JavaScript kernel now runs in a Web Worker instead of an IFrame, to streamline how
default kernels run in JupyterLite.

This might affect custom kernel authors extending the base `JavaScriptKernel` like
https://github.com/jupyterlite/p5-kernel.

This was changed in the following PR:
[#711](https://github.com/jupyterlite/jupyterlite/pull/711)

## `0.1.0b16` to `0.1.0b17`

### Use `PipliteAddon.piplite_urls` instead of `LiteBuildConfig.piplite_urls`

If you were configuring the `piplite_urls` option (described in
https://jupyterlite.readthedocs.io/en/latest/howto/python/wheels.html) to ship
additional wheels at build time, this configuration option has now been moved from
`LiteBuildConfig.piplite_urls` to `PipliteAddon.piplite_urls`.

If using a `jupyter_lite_build.json` file, the configuration should look like the
following:

```json
{
  "PipliteAddon": {
    "piplite_urls": ["url-to-wheel1", "url-to-wheel2", "..."]
  }
}
```

This was changed in the following PR:
[#934](https://github.com/jupyterlite/jupyterlite/pull/934)
