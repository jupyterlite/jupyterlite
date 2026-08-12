# Ship additional Pyodide wheels at build time

[`jupyterlite-pyodide-kernel`](../../quickstart/using.md#kernels) consists of a bit of
JavaScript and customized python wheels, which in turn require other wheels (like
`ipython`), pre-built WASM libraries, and other JavaScript (like `pyodide.mjs`).

Packages provided by a site's Pyodide distribution, captured in `pyodide-lock.json`, or
`jupyterlite-pyodide-kernel` itself, are ready to be `import`ed, powered by Pyodide's
[loadPackagesFromImports]. The effective list of auto-importable packages can be
modified by [adding wheels to a distribution](#adding-wheels-to-a-distribution).

[loadPackagesFromImports]:
  https://pyodide.org/en/stable/usage/api/js-api.html#pyodide.loadPackagesFromImports

Packages _not_ included in the distribution can be imported with
`await micropip.install` or, for syntax compatiblity with a full `ipykernel` session,
the `%pip install` magic wrapper around `micropip`.

## Adding wheels to the Pyodide kernel

(adding-wheels-with-jupyterlite-pyodide-kernel-lock)=

### `jupyterlite-pyodide-kernel[lock]`

`jupyterlite-pyodide-kernel[lock]` includes an extra dependency on
[`pyodide-lock`][pyodide-lock] and _its_ optional dependency on
[`uv`](https://github.com/astral-sh/uv).

[pyodide-lock]: https://github.com/pyodide/pyodide-lock

(adding-wheels-to-a-distribution)=

#### Adding wheels to a distribution

```{hint}
See JupyterLite's own [jupyter_lite_config.json][jlcj-main] for an extensive example
of other configurable features to modify both the solve (such as extra constraints),
the lockfile (such as preserving third-party URLs), and runtime behavior (such as
pre-fetching packages while Pyodide's runtime is initializing).

[jlcj-main]: https://github.com/jupyterlite/jupyterlite/blob/main/examples/jupyter_lite_config.json
```

The final list of packages to include in `pyodide-lock.json` can be influenced in
several ways by configuring `jupyter_lite_config.json#PyodideLockAddon`.

```yaml
{
  "PyodideLockAddon": {
    "enabled": true,                   # required for the time being
    "specs": [                         # PEP-508 specs that _must_ be included
      "package-1",                     # ... just name
      "package-2 >=1",                 # ... a range
      "package-3 @ https://{...}whl",  # ... a direct URL
      "-r ../path/to/reqs.txt",        # ... a newline delimited file of the above, with optional # comments
      "--group ../path/to:demo"        # ... a path to parent of a `pyproject.toml` with a `[dependency-groups.demo]`
    ],
    "constraints": []                  # PEP-508 specs that must be satisfied _iff present_
    "excludes": []                     # package names that _must not_ be included
    "wheels": [                        # Wheels that _must_ be included
      "../dist/hi-0.py3-none-any.whl"  # ... a wheel
      "../dist/"                       # ... a folder containing wheels
                                       # ... the "well-known" path {lite_dir}/static/pyodide-lock
    ]
  }
}
```

These configuration options will be:

- solved with `uv`
- downloaded to the local cache
  - copied into `{output-dir}/static/pyodide-lock/` if requested
- indexed into a `{output-dir}/static/pyodide-lock/pyodide-lock.json`
  - added to `lockFileUrl` in `jupyter-lite.json`

### `piplite`

#### Adding wheels to a site

Extra wheels that can be installed via `%pip` in a running kernel can be added via the
`--piplite-wheels` CLI flag or `PipliteAddon/piplite_urls` config value, or simply left
in-place in `lite_dir/pypi`.

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

#### Adding wheels to an extension

Extension authors can include user-installable wheels in extensions at build time which
will be available to `%pip install`.

Wheel indices can be generated with the `jupyter lite pip index`
[CLI](../../reference/cli.ipynb#pyodide-wheels) and then included in
`package.json#/piplite`: make sure to include the index and `.whl` files in
`package.json#/files` as well.
