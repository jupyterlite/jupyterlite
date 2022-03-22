# Configuring

## Runtime Configuration Files

The behavior JupyterLite in the browser can be controlled by creating specially-named
files at any level of the file tree. It is expected each file conforms to the
[schema](#schema). For an example, see the [demo configuration](#demo-configuration).

| File                 | Config Location              | `jupyter-config-data` | Note                                            |
| -------------------- | ---------------------------- | --------------------- | ----------------------------------------------- |
| `jupyter-lite.ipynb` | `#/metadata/jupyter-lite`    | ✔️                    | integrates into existing Jupyter workflows      |
| `jupyter-lite.json`  | whole file                   | ✔️                    | good for simple/automated configuration         |
| `index.html`         | `script#jupyter-config-data` | ✔️                    | configuration of last resort, _not recommended_ |

Each can be omitted from the file tree, and will result in a harmless (though noisy)
`404` response.

```{hint}
Configuration cascades _down_, such that the closest, most-user-editable file
to the `index.html` being served takes highest precedence. Like-named keys will
be _replaced_  by higher-priority files, with the notable exceptions of:

- the `federated_extensions` and `disabledExtensions` lists are appended and
  deduplicated
- the `settingsOverrides` dictionary will be merged at the top level of each plugin
```

### Schema

```{warning}
The current schema version is `0`, and as such is _subject to change_. Once it has
stabilized, we hope to provide similar backwards-compatibility guarantees as the
[Jupyter Notebook Format][nbformat].
```

As the schema provides _many_ options, please see the dedicated pages below.

```{toctree}
schema-v0
```

[nbformat]: https://nbformat.readthedocs.io/en/latest/format_description.html
[releases]: https://github.com/jupyterlite/jupyterlite/releases
[pypi]: https://pypi.org/project/jupyterlite
[npmjs.com]: https://www.npmjs.com/package/@jupyterlite/app

## Adding Content

### Content with the CLI

With the [CLI](./cli.ipynb) installed, run:

```bash
jupyter lite build
```

Any contents found in:

- `{lite-dir}/files/`
- any _content roots_ added via:
  - the CLI flag `--contents`
  - the `#/LiteBuildConfig/contents` in `jupyter_lite_config.json`

Will be:

- copied to the built site under `{output-dir}/files/`
  - may have timestamps changed if `--source-date-epoch` is provided.
- indexed to provide `{output-dir}/api/contents/{subdir?}/all.json`

### Server Contents and Local Contents

When a user changes a server-hosted file, a copy will be made to the browser's storage,
usually in `IndexedDB`. A user's locally-modified copy will take precedence over any
server contents, even if the server contents are newer.

### Customizing Content Storage

By default, all of a user's contents on the same domain will be available to all
JupyterLite instances hosted there. To create separate content stores, change the
`jupyter-lite.json#jupyter-config-data/contentsStorageName` from the default of
`JupyterLite Storage`.

By default, the best available, persistent storage driver will be used. One may force a
particular set of drivers to try with
`jupyter-lite.json#jupyter-config-data/contentsStorageDrivers`. See more about
[local storage drivers](#local-storage-drivers).

## Adding Extensions

JupyterLab 3 [pre-built extensions] allow for adding new capabilities to JupyterLite
without rebuilding the entire web application. A good starting point for extensions that
_might_ work is the JupyterLab issue _[Extension Compatibility with 3.0
(#9461)][#9461]_. Additionally, this site demonstrates a few
[extensions](#demo-extension-notes).

[#9461]: https://github.com/jupyterlab/jupyterlab/issues/9461
[pre-built extensions]: https://jupyterlab.readthedocs.io/en/stable/user/extensions.html

### Extensions with the CLI

#### Environment Extensions

When you run `jupyter lite build`, all pre-built extensions in your JupyterLab
environment, e.g. `{sys.prefix}/share/jupyter/labextensions` will be:

- copied to `{output-dir}/extensions`
- have its theme information copied to `{output-dir}/{app/?}theme/`

This discovery behavior can be disabled with the CLI flag `--ignore-sys-prefix` or
`LiteBuildConfig/ignore_sys_prefix`.

#### Extensions for a Specific App

Similar to the above, by updating `$YOUR_JUPYTERLITE/{app}/jupyter-lite.json`, the
pre-built extensions will only be available for pages within that file tree.

#### Custom Extensions

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

## About the Demo

This documentation site contains the JupyterLite Demo (the **Try** buttons on the top of
the screen) and uses a number of techniques described on this page.

### Demo Configuration

The following generated configuration powers the Demo, and is generated prior to
building the docs site, copied in during the build, and fetched by browsers from
`/_static/jupyter-lite.json`.

```{include} ../build/docs-app/jupyter-lite.json

```

### Demo Extension Notes

The `federated_extensions` above are copied from the documentation environment prior to
building this site with [Sphinx](deploying.md#sphinx), and are meant to exercise
different kinds of extensions, including themes, MIME renderers, and Widgets. Some
transient dependencies _also_ include labextensions, but don't work entirely correctly.

| extension                             | notes                        | working issue |
| ------------------------------------- | ---------------------------- | ------------- |
| `@jupyter-widgets/jupyterlab-manager` | needs [Jupyter Kernel Comms] | [#18]         |
| `@jupyterlab/server-proxy`            | needs server extension       |               |
| `nbdime`                              | needs server extension       |               |

[#18]: https://github.com/jupyterlite/jupyterlite/issues/18
[jupyter kernel comms]:
  https://jupyter-client.readthedocs.io/en/stable/messaging.html?highlight=comms#custom-messages

## The Hard Way

### Content, The Hard Way

Assuming:

- you have a running JupyterLab 3
- you want to add all of the files in the root folder of the current JupyterLab to your
  JupyterLite.

Open a browser:

- view the
  [Contents API](https://jupyter-server.readthedocs.io/en/latest/developers/rest-api.html#get--api-contents-path),
  e.g. `http://localhost:8888/api/contents`, which should look something like:

```json
{
  "name": "",
  "path": "",
  "last_modified": "2021-05-15T20:16:17.753908Z",
  "created": "2021-05-15T20:16:17.753908Z",
  "format": "json",
  "mimetype": null,
  "size": null,
  "writable": true,
  "type": "directory",
  "content": [
    {
      "name": "README.md",
      "path": "README.md",
      "last_modified": "2021-05-15T20:12:22.261076Z",
      "created": "2021-05-15T20:12:22.261076Z",
      "content": null,
      "format": null,
      "mimetype": "text/markdown",
      "size": 3735,
      "writable": true,
      "type": "file"
    }
  ]
}
```

- Paste this JSON in `$YOUR_JUPYTERLITE/api/contents/all.json`
- Copy your files in `$YOUR_JUPYTERLITE/files`
- Repeat this for every subfolder `:(`

Now, when the app reloads, these files will appear in the File Browser _if_ there isn't
an existing file of that name in browser storage. If a user _has_ created such a file,
and is deleted, the original server-backed file will become visible.

### Extensions, The Hard Way

```{warning}
This is a heavily work-in-progress procedure, and will hopefully soon be improved
with convenience tools in (at least) python and JavaScript.
```

#### Get the extension assets

Assuming you have a working JupyterLab 3 installation, look in your
`{sys.prefix}/share/jupyter/labextensions`. Each folder contains either:

- if it begins with `@`, a collection of packages
- otherwise, a single pre-built extension

```bash
cd $YOUR_JUPYTERLITE
mkdir -p extensions
cd extensions
cp -r $PREFIX/share/jupyter/labextensions/@jupyter-widgets/jupyterlab-manager .
```

```{warning}
Some extensions will require _other_ extensions to be available. This can be
determined by looking in `package.json` for the extension, specifically
`#/jupyterlab/sharedPackages`.
```

#### Handle theme assets

The Theme Manager expects to be able to load theme CSS/font assets from
`{:app}/build/themes/({:org}/){:package}`, where `app` is usually `lab`.

Continuing the example above:

```bash
cd $YOUR_JUPYTERLITE/extensions
mkdir -p ../build/themes
cp -r @*/*/themes/* ../build/themes/
cp -r @*/themes/* ../build/themes/
```

#### Fill Out `federated_extensions`

Again, assuming you have a working JupyterLab, click _Inspect Element_ in your Lab and
inspect the `<script id="jupyter-config-data">` in the `<head>`. The entry you need will
be contained there.

Update your `/app/jupyter-lite.json` like so:

```json
{
  "federated_extensions": [
    {
      "extension": "./extension",
      "load": "static/remoteEntry.ca1efc27dc965162ca86.js",
      "name": "@jupyter-widgets/jupyterlab-manager"
    }
  ]
}
```

```{hint}
Some extensions also include a `style` key, and may look _off_ if omitted.
```
