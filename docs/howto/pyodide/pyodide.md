# Using a custom Pyodide distribution

Beneath [custom wheels](./wheels.md) are the raw JS and WebAssembly parts of the kernel
provided by [pyodide](https://pyodide.org). As the full distribution is **very large**,
and self-hosting of all its assets brings their own challenges, this use of CDN is the
default for JupyterLite.

A custom `pyodide.js`, along with its `packages.json` and the rest of its assets, such
as might be downloaded via the
[`--pyodide` CLI option](../../reference/cli.ipynb#pyodide), can also be configured.
This can be either relative to the `lite_dir`, or as a full URL.

First if you don't have a `jupyter-lite.json` file, create one where you will be
executing the `jupyter lite build` command. Then add the following content to the file,
or just the `litePluginSettings` section if you have some previous configuration
already:

```json
{
  "jupyter-lite-schema-version": 0,
  "jupyter-config-data": {
    "litePluginSettings": {
      "@jupyterlite/pyodide-kernel-extension:kernel": {
        "pyodideUrl": "./path/to/custom/pyodide/pyodide.js"
      }
    }
  }
}
```

Then proceed with a new build (`jupyter lite build`) to make sure the file is correctly
generated in the output directory.

```{hint}
The performance of extracting a pyodide `.tar.bz2` can be improved by installing
`libarchive-c`: see the [extensions][using-libarchive] page.

[using-libarchive]: ../configure/advanced/extensions.md#using-libarchive
```
