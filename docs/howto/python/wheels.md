# Ship additional pyolite wheels at build time

## Adding pyolite wheels

The [pyolite kernel](../../quickstart/using.md#kernels) itself consists of a bit of
JavaScript and customized python wheels, which in turn require other wheels and
pre-built WASM modules and other JavaScript.

Extra wheels that can be installed via `piplite` in a running kernel can be added via
the `--piplite-wheels` CLI flag or `LiteBuildConfig/piplite_urls` config value, or
simply left in-place in `lite_dir/pypi`.

The remaining wheels will be:

- downloaded to the local cache
- copied into `{output-dir}/pypi`
- indexed into an `all.json` with data similar to the [PyPI Warehouse API]
- added to `pipliteUrls` in `jupyter-lite.json`

[pypi-warehouse-api]: https://warehouse.pypa.io/api-reference

If a package is _not_ found in one of these URLs, it will be sought on the main Python
Package Index (PyPI). This behavior can be disabled via `jupyter-lite.json`:

```json
"jupyter-config-data": {
  "litePluginSettings": {
    "@jupyterlite/pyolite-kernel-extension:kernel": {
      "disablePyPIFallback": true
    }
  }
}
```

## Overloading Built-in Wheels

Rarely, one might want to replace one of the small number of wheels shipped with
jupyterlite itself. To avoid shipping these wheels, pass the `--ignore-piplite-builtins`
with the name of the package. These will be deleted from `output_dir/build/pypi` and
have their entries removed from `all.json`.

```{warning}
It is _very likely_ that `ignore`ing one or more of these will break a JupyterLite site's `pyolite`
kernel user experience in cryptic ways unless a replacement is provided as described above.

`pyolite` is particularly fragile, as it is the only hard-coded location. It would
probably need to be replaced in its expected location in `build/pypi`, and have
the `all.json` metadata updated with `jupyter lite pypi index`.
```

### The Built-in Wheels

Some of the known wheels shipped with JupyterLite:

|              package |     kind      | reason                                                               |
| -------------------: | :-----------: | -------------------------------------------------------------------- |
|            `piplite` |   bootstrap   | a wrapper around `micropip`, used to install `pyolite`               |
|            `pyolite` |     shell     | a companion to `IPython`, providing patches, etc.                    |
|           `notebook` | compatibility | helps installability of kernel packages that specify client versions |
|         `jupyterlab` | compatibility | helps installability of kernel packages that specify client versions |
| `widgetsnbextension` | compatibility | helps installability of kernel packages that specify client versions |
|          `ipykernel` |     shim      | provides certain API features                                        |

## Building extensions that contain wheels

User-installable wheels can be included at _extension_ build time, as opposed to site
build time. Wheel indices can be generated with the `jupyter lite pip index`
[CLI](../../reference/cli.ipynb#pyolite-wheels) and then included in
`package.json#/piplite`.

```{hint}
Make sure to include the index and `.whl` files in `package.json#/files` as well.
```
