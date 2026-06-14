# Ship additional Pyodide wheels at build time

User-installable wheels can be included at extension build time. Wheel indices can be
generated with the `jupyter lite pip index`
[CLI](../../reference/cli.ipynb#pyodide-wheels) and then included in
`package.json#/piplite`: make sure to include the index and `.whl` files in
`package.json#/files` as well.

## Adding wheels to the Pyodide kernel

The [Pyodide kernel](../../quickstart/using.md#kernels) itself consists of a bit of
JavaScript and customized python wheels, which in turn require other wheels and
pre-built WASM modules and other JavaScript.

Extra wheels that can be installed via `piplite` in a running kernel can be added via
the `--piplite-wheels` CLI flag or `PipliteAddon/piplite_urls` config value, or simply
left in-place in `lite_dir/pypi`.

Pass one `--piplite-wheels` flag for each wheel you want to ship. For example, to add
a single local wheel:

```bash
jupyter lite build \
  --piplite-wheels dist/example_package-0.1.0-py3-none-any.whl
```

To add more than one wheel, repeat the flag:

```bash
jupyter lite build \
  --piplite-wheels dist/example_package-0.1.0-py3-none-any.whl \
  --piplite-wheels dist/example_dependency-0.2.0-py3-none-any.whl
```

The same values can be supplied in `jupyter_lite_config.json` with
`PipliteAddon.piplite_urls`:

```json
{
  "PipliteAddon": {
    "piplite_urls": [
      "dist/example_package-0.1.0-py3-none-any.whl",
      "dist/example_dependency-0.2.0-py3-none-any.whl"
    ]
  }
}
```

`PipliteAddon.piplite_urls` expects a list of values. If a build fails with an error
that says the trait expected a tuple but received a string, make sure each wheel path is
provided either as a repeated `--piplite-wheels` flag or as an item in the
`piplite_urls` list.

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
    "@jupyterlite/pyodide-kernel-extension:kernel": {
      "disablePyPIFallback": true
    }
  }
}
```
