# Configuring

## Customizing Settings

With the [CLI](./cli.ipynb), if you create an `overrides.json` in either the root, or a
specific `app` directory, these will be:

- merged into
  `{output-dir}/{app?}/jupyter-lite.json#/jupyter-config-data/settingsOverrides`

## Adding pyolite wheels

The [pyolite kernel](./kernels/pyolite.md) itself consists of a bit of JavaScript and
customized python wheels, which in turn require other wheels and pre-built WASM modules
and other JavaScript.

Extra wheels that can be installed via `piplite` in a running kernel can be added via
the `--piplite-wheels` CLI flag or `LiteBuildConfig/piplite_urls` config value, or
simply left in-place in `lite_dir/pypi`.

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

## pyodide

Beneath custom wheels are the raw JS and WebAssembly parts of `pyolite` provided by
[pyodide](https://pyodide.org). As the full distribution is very large, and self-hosting
of all its assets brings their own challenges, this use of CDN is the default for
JupyterLite.

A custom `pyodide.js`, along with its `packages.json` and the rest of its assets, such
as might be downloaded via the [`--pyodide` CLI option](./cli.ipynb#pyodide), can also
be configured. This can be either relative to the `lite_dir`, or as a full URL.

```json
"jupyter-config-data": {
  "litePluginSettings": {
    "@jupyterlite/pyolite-kernel-extension:kernel": {
      "pyodideUrl": "./path/to/custom/pyodide/pyodide.js"
    }
  }
}
```

## LaTeX

Rendering $\LaTeX$ is generally handled in a special way when compared with most other
renderers in JupyterLab. For this reason, it is _not_ presently covered by a _pre-built
extension_, but rather by adding [MathJax 2](https://www.mathjax.org) directly to the
page. As it changes very slowly, and is _relatively_ benign if missing for most use
cases, this use of a CDN is the default for JupyterLite.

Configuring `fullMathjaxUrl` and `mathjaxConfig` in `jupyter-lite.json` allows you to
specify a relative or remote location, replacing (or avoiding) the CDN. If
[`jupyter-server-mathjax`](https://github.com/jupyter-server/jupyter_server_mathjax) is
installed, the default configuration `TeX-AMS-MML_HTMLorMML-full,Safe` will be copied
into the output folder.
