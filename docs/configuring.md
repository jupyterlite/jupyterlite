# Configuring

## Applications

### Removing Applications

Provide the `--apps` CLI argument once or multiple times, or configure
`LiteBuildConfig/apps` to only copy select applications to the output folder: by
default, all of the default [applications](../applications/index) will be copied to the
output folder.

### Removing Unused Shared Packages

Provide the `--no-unused-shared-packages` or `LiteBuildConfig/no_unused_shared_packages`
to prevent copying
[shared packages](https://jupyterlab.readthedocs.io/en/stable/extension/extension_dev.html#deduplication)
used only by removed applications. For lightweight apps like `repl`, this can result in
a much smaller on-disk build.

```{warning}
Some JupyterLab extensions may require shared packages from the full JupyterLab
application, and will not load with this setting.
```

### Removing Source Maps

Provide `--no-sourcemaps`, or configure `no_sourcemaps` in a config file to prevent any
`.map` files from being copied to the output folder. This creates a _drastically_
smaller overall build.

```{warning}
Removing sourcemaps, in addition to making errors harder to debug, will _also_
cause many `404` errors when a user does open the browser console, which
can be _even more_ confusing.
```

For better baseline performance, the core JupyterLite distribution, and some federated
extensions, only ship optimized JavaScript code, which is hard to debug. To improve
this,
[source maps](https://developer.mozilla.org/en-US/docs/Tools/Debugger/How_to/Use_a_source_map),
are also provided to provide pointers to the original source code, and while _much_
larger, are only loaded when debugging in browser consoles.

## Customizing Settings

With the [CLI](./cli.ipynb), if you create an `overrides.json` in either the root, or a
specific `app` directory, these will be:

- merged into
  `{output-dir}/{app?}/jupyter-lite.json#/jupyter-config-data/settingsOverrides`

### Settings Storage

By default, all of a user's settings on the same domain will be available to all
JupyterLite instances hosted there. To create separate settings stores, change the
`jupyter-lite.json#jupyter-config-data/settingsStorageName` from the default of
`JupyterLite Storage`.

By default, the best available, persistent storage driver will be used. One may force a
particular set of drivers to try with
`jupyter-lite.json#jupyter-config-data/settingsStorageDrivers`. See more about
[local storage drivers](#local-storage-drivers).

## Local Storage Drivers

By default, the "best" [localForage] driver will be selected from the technologies
available in the user's browser.

[localforage]: https://github.com/localForage/localForage

To force choosing from a particular set of technologies, `settingsStorageDrivers` and
`contentsStorageDrivers` can be specified, with the first browser-compatible driver
being chosen.

| configuration value   | technology   | persistent? | note                                   |
| --------------------- | ------------ | ----------- | -------------------------------------- |
| `asyncStorage`        | IndexedDB    | yes         | usually the one selected               |
| `webSQLStorage`       | WebSQL       | yes         |                                        |
| `localStorageWrapper` | localStorage | yes         |                                        |
| `memoryStorageDriver` | in-memory    | **NO**      | requires `enableMemoryStorage`         |
| _other_               | _unknown_    | _unknown_   | may be added by third-party extensions |

### Volatile Memory Storage

Many extensions and features require the ability to at least _think_ they are saving and
loading contents and settings. If a user's data cannot be stored due to browser security
settings, a JupyterLite app will generally fail to fully initialize: while this might be
frustrating, losing a user's unique data creation is _even more_ frustating.

```{warning}
If persistence is **entirely** handled outside of JupyterLite, e.g. in an embedded
[`repl`](./applications/repl.md) it is possible to disable all persistence, assuring
**total user data loss** after every page/iframe reload:
- set `enableMemoryStorage` to `true`
- set `contentsStorageDrivers` and `settingsStorageDrivers` to `["memoryStorageDriver"]`
```

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
