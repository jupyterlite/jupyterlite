# Migration Guide

This guide provides an overview of major (potentially breaking) changes and the steps to
follow to update JupyterLite from one version to another.

## `0.3.0` to `0.4.0`

### Extensions

JupyterLite 0.4.0 is based on the JupyterLab 4.2 and Jupyter Notebook 7.2 packages.

Although no breaking changes are expected, this may affect the extensions you are using
as they may rely on features added to JupyterLab 4.2 and Notebook 7.2.

See the JupyterLab and Notebook changelogs for more information:

- [JupyterLab 4.2](https://jupyterlab.readthedocs.io/en/stable/getting_started/changelog.html#v4-2-0)
- [Jupyter Notebook 7.2](https://jupyter-notebook.readthedocs.io/en/stable/changelog.html#v7-2)

### Accessing files from the kernel

JupyterLite 0.4.0 introduces a more robust way for accessing files from kernels.

Previously, JupyterLite was relying on a Service Worker to make the files visible to the
kernel. Starting with version 0.4.0, JupyterLite allows kernels to leverage the use of
shared memory (via `SharedArrayBuffer`) to make accessing files more robust and
resilient, and avoid caching issues.

If the COOP and COEP headers, JupyterLite uses shared memory via `SharedArrayBuffer` to
enable file access. Otherwise, it defaults to using the Service Worker, like before.

See the [documentation on accessing files](./howto/content/files.md) for more
information.

### API changes

#### `@jupyterlite/application`

- The signature of the `currentChanged` signal for the `SingleWidgetShell` has changed
  from `ISignal<ISingleWidgetShell, void>` to
  `ISignal<ISingleWidgetShell, FocusTracker.IChangedArgs<Widget>>`.

This follows this change in JupyterLab:
[Add `IShell.currentChanged` and notify commands based on it](https://github.com/jupyterlab/jupyterlab/pull/15449)

#### `@jupyterlite/contents` package

The TypeScript interface `IEmscriptenNodeOps` has changed. All methods now take
`IEmscriptenFSNode | IEmscriptenStream` as input instead of only `IEmscriptenFSNode`.
Classes implementing `IEmscriptenNodeOps` will need to be updated accordingly. See
https://github.com/jupyterlite/jupyterlite/pull/1395 for an example implementation.

The TypeScript interface `IDriveRequest` has been removed. It has been replaced by the
type definition `TDriveRequest<T extends TDriveMethod>`. This allows to have a more
refined typing depending on the type of request. The same goes for the drive response
type `TDriveResponse<T extends TDriveMethod>`. For example, a 'readdir' drive request
would have the type `TDriveRequest<'readdir'>`, and its response would be of the type
`TDriveResponse<'readdir'>`.

A new class `DriveContentsProcessor` is provided, which allows to perform drive requests
using the jupyterlite contents manager. It can be used by Emscripten kernel authors in
combination to extending the abstract `ContentsAPI` class in order to provide a custom
way to implement file access from the kernel (e.g. bypassing the service worker
approach).

## `0.2.0` to `0.3.0`

### Extensions

JupyterLite 0.3.0 is based on the JupyterLab 4.1 and Jupyter Notebook 7.1 packages.

Although no breaking changes are expected, this may affect the extensions you are using
as they may rely on features added to JupyterLab 4.1 and Notebook 7.1.

### `jupyterlite` metapackage

Prior to JupyterLite 0.3.0, installing the `jupyterlite` metapackage would also install
the JavaScript (Web Worker) kernel by default via the dependency on
`jupyterlite-javascript-kernel`.

This dependency on `jupyterlite-javascript-kernel` has now been removed, so you may need
to explicitely add `jupyterlite-javascript-kernel` to your build dependencies if you
want to use that kernel.

```{note}
As an alternative to `jupyterlite-javascript-kernel`, you may also want to use [Xeus JavaScript], which currently offers more features and is generally more usable.
```

```{note}
`jupyterlite-javascript-kernel` has now been moved to the [jupyterlite-javascript-kernel] repo.
```

[Xeus JavaScript]: https://github.com/jupyter-xeus/xeus-javascript
[jupyterlite-javascript-kernel]: https://github.com/jupyterlite/javascript-kernel

### Service Worker

JupyterLite uses a Service Worker to make files and notebooks visible to the kernels, so
they can be manipulated by the user via code in the notebook.

In previous versions, the Service Worker had caching enabled by default, and it was not
possible to easily disable it.

The Service Worker cache was however the source of many issues when accessing files from
a kernel, often giving errors to users, who would have to clear their cache to fix the
issue.

In JupyterLite 0.3.0, the Service Worker cache is **disabled** by default, but it is
still possible to enable it if needed.

To enable the Service Worker cache, add the `enableServiceWorkerCache` option to your
`jupyter-lite.json` file. For example:

```json
{
  "jupyter-lite-schema-version": 0,
  "jupyter-config-data": {
    "enableServiceWorkerCache": true
  }
}
```

## `0.1.0` to `0.2.0`

### Extensions

JupyterLite 0.2.0 is based on the JupyterLab 4 and Jupyter Notebook 7 packages.

JupyterLab 4 comes with a couple of breaking changes which likely affect extensions.

If you were using JupyterLab 3 extensions in your JupyterLite deployment, you might have
to update to a newer version of the extension that is compatible with JupyterLab 4.

```{note}
For extensions authors, check out the [extension migration guide](https://jupyterlab.readthedocs.io/en/latest/extension/extension_migration.html) in the JupyterLab documentation.
```

### Jupyter Notebook 7

In JupyterLite 0.1.x the Notebook interface was provided by
[RetroLab](https://github.com/jupyterlab/retrolab).

In JupyterLite 0.2.0, the Notebook interface is now provided by
[Jupyter Notebook 7](https://github.com/jupyter/notebook)

Jupyter Notebook 7 is the successor of RetroLab and the Classic Notebook, based on
JupyterLab components.

This means the URL have also changed to be aligned with the ones provided by Jupyter
Notebook 7:

- `/retro/consoles` -> `/consoles`
- `/retro/edit` -> `/edit`
- `/retro/notebooks` -> `/notebooks`
- `/retro/tree` -> `/tree`

### `jupyterlite` metapackage

In version `0.1.x`, installing the `jupyterlite` metapackage would automatically install
the Pyodide kernel by default, since the `jupyterlite` metapackage would depend on
`jupyterlite-pyodide-kernel`.

In version `0.2.0` this is not the case anymore. You will need to install the
`jupyterlite-pyodide-kernel` explicitly in your build environment alongside
`jupyterlite-core` (the package providing the `jupyter-lite` CLI).

See [the documentation for adding kernels](./howto/configure/kernels.md) to learn more.

### Service Worker

The service worker file name has been changed. In `0.1.0`, it was
`service-worker-[hash].js` with the `hash` computed by webpack, in `0.2.0` the hash is
removed and the new file name is `service-worker.js`.

### API changes

#### `jupyterlite-core`

- The Mathjax addon was removed from the `jupyterlite-core` package. As a consequence
  the `mathjaxConfig` and `fullMathjaxUrl` options in `jupyter-lite.json` can be removed
  as they do not have any effect anymore.

  If you would like to use Mathjax 2, it's possible to install `jupyterlab-mathjax2`.
  See the [jupyter-renderers](https://github.com/jupyterlab/jupyter-renderers)
  repository for more information.

  For reference, see the
  [JupyterLab Pull Request that updated to Mathjax 3](https://github.com/jupyterlab/jupyterlab/pull/13877)

#### `@jupyterlite` packages

These API changes are only relevant if you are reusing `@jupyterlite` packages in
downstream applications.

- The `IKernel` interface exposed by `@jupyterlite/kernels` has a new `get` method to
  retrieve a running kernel by id.

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
additionally install a Python kernel such as `jupyterlite-pyodide-kernel` or a Xeus
kernel.

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
