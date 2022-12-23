# Ship additional pyolite wheels at build time

User-installable wheels can be included at extension build time. Wheel indices can be
generated with the `jupyter lite pip index`
[CLI](../../reference/cli.ipynb#pyolite-wheels) and then included in
`package.json#/piplite`: make sure to include the index and `.whl` files in
`package.json#/files` as well.

## Adding pyolite wheels

The [pyolite kernel](../../quickstart/using.md#kernels) itself consists of a bit of
JavaScript and customized python wheels, which in turn require other wheels and
pre-built WASM modules and other JavaScript.

Extra wheels that can be installed via `piplite` in a running kernel can be added via
the `--piplite-wheels` CLI flag or `PipliteAddon/piplite_urls` config value, or simply
left in-place in `lite_dir/pypi`.

These will be:

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
