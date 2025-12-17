# Migration Guide

This guide provides an overview of major (potentially breaking) changes and the steps to
follow to update JupyterLite from one version to another.

## `v0.7.0` to `v0.8.0`

### Build System

JupyterLite 0.8.0 switches from [webpack](https://webpack.js.org/) to
[rspack](https://rspack.dev/) for bundling. This change follows the upstream JupyterLab
migration to rspack, which provides significantly faster build times while maintaining
full compatibility with webpack configurations and plugins.

This change should be transparent for most users. However, if you have custom build
configurations that extend or modify the JupyterLite webpack configuration, you may need
to update your setup to use rspack instead.

### Build Optimization Settings

The switch to rspack may affect some build optimization settings due to changes in the
internal bundle format. If you were using `--no-unused-shared-packages` or
`--no-sourcemaps` flags and notice unexpected behavior, please report it to the
[JupyterLite issue tracker](https://github.com/jupyterlite/jupyterlite/issues).

## `v0.6.0` to `v0.7.0`

```{warning}
JupyterLite 0.7.0 comes with a couple of major changes that may be considered
breaking, depending on your JupyterLite setup. Please read the following sections
carefully to check if you are impacted by these changes
```

### Extensions

JupyterLite 0.7.0 is based on JupyterLab 4.5 and Jupyter Notebook 7.5 packages.

This update may affect the extensions you are using, as they may rely on features
introduced in JupyterLab 4.5 and Notebook 7.5.

### `jupyterlite-core`

Support for Python 3.9 has been dropped. `jupyterlite-core` now requires Python 3.10 or
higher.

### Package Consolidation

```{warning}
The individual service packages have been deprecated in favor of the unified
`@jupyterlite/services` package, and the `@jupyterlite/server` package has been
deprecated in favor of `@jupyterlite/apputils`.
```

Starting with JupyterLite 0.7.0, the following packages have been deprecated and their
functionality has been consolidated into the `@jupyterlite/services` package:

- `@jupyterlite/kernel`
- `@jupyterlite/contents`
- `@jupyterlite/session`
- `@jupyterlite/settings`

Additionally, the `@jupyterlite/server` package has been deprecated, with its service
worker management functionality moved to the `@jupyterlite/apputils` package.

These changes were made to more closely follow the package structure used by JupyterLab
and to better organize utility functions within the codebase.

If your extension or application was importing from these individual packages, you
should update your imports accordingly. See the sections below for concrete migration
examples.

#### Migration to `@jupyterlite/services`

The `@jupyterlite/services` package consolidates all service-related functionality and
provides all the same exports as the individual packages.

##### Example 1: Kernel Extension

If you have a custom kernel extension, update your imports:

```diff
-import { IKernelSpecs } from '@jupyterlite/kernel';
+import { IKernelSpecs } from '@jupyterlite/services';
```

##### Example 2: Storage Management

If you're working with the browser storage drive or settings:

```diff
-import { BrowserStorageDrive } from '@jupyterlite/contents';
-import { Settings } from '@jupyterlite/settings';
+import { BrowserStorageDrive, Settings } from '@jupyterlite/services';
```

##### Example 3: Session Management

For session management:

```diff
-import { LiteSessionClient } from '@jupyterlite/session';
+import { LiteSessionClient } from '@jupyterlite/services';
```

#### Migration to `@jupyterlite/apputils`

The `@jupyterlite/server` package has been deprecated in favor of
`@jupyterlite/apputils`, which now provides the service worker management functionality.

##### Import Updates

Update your imports to use `@jupyterlite/apputils` instead:

```diff
-import { IServiceWorkerManager, ServiceWorkerManager } from '@jupyterlite/server';
+import { IServiceWorkerManager, ServiceWorkerManager } from '@jupyterlite/apputils';
```

The token identifier changed from:

- `'@jupyterlite/server:IServiceWorkerManager'` to `IServiceWorkerManager` (imported
  from `@jupyterlite/apputils`)

```{note}
The `@jupyterlite/server` package will continue to work as a re-export from
`@jupyterlite/apputils` for backward compatibility, but it is recommended to update your
imports to use `@jupyterlite/apputils` directly.
```

## `v0.5.0` to `v0.6.0`

```{warning}
JupyterLite 0.6.0 comes with a couple of major changes that may be considered
breaking, depending on your JupyterLite setup. Please read the following sections
carefully to check if you are impacted by these changes
```

### Extensions

JupyterLite 0.6.0 is based on JupyterLab 4.4 and Jupyter Notebook 7.4 packages.

This update may affect the extensions you are using, as they may rely on features
introduced in JupyterLab 4.4 and Notebook 7.4.

### Contents

#### File indexing with `jupyter-server`

Previously, running a build with the contents option specified (for example with
`jupyter lite build --contents contents`) would simply log a warning in the build logs
if the `jupyter-server` dependency (used for indexing the files) was missing, making it
difficult to debug issues with missing content and files.

In JupyterLite 0.6.0, the build now fails if the `contents` option is provided when the
`jupyter-server` is not installed.

#### Browser Storage

Previously, the default contents manager was storing files in the browser's local
storage (IndexedDB by default), under the "JupyterLite Storage" key. This had the effect
of "sharing" files across different deployments of JupyterLite under the same origin,
leading to some confusions for the users.

Starting with JupyterLite 0.6.0, the default contents manager now uses the base URL in
the storage key. For example if you have the following two JupyterLite deployments under
the same origin:

- `https://example.com/lite1`
- `https://example.com/lite2`

The contents will be stored under the following keys:

- `JupyterLite Storage - /lite1`
- `JupyterLite Storage - /lite2`

This means that if you or your users had previously created files in one of the
deployments, they will not be available anymore.

To use the same default name for the contents storage as before, you can set the
`contentsStorageName` option in your `jupyter-lite.json` file to `JupyterLite Storage`.
For example:

```json
{
  "jupyter-lite-schema-version": 0,
  "jupyter-config-data": {
    "contentsStorageName": "JupyterLite Storage"
  }
}
```

### Settings

Similar to the contents storage mentioned in the section above, the default settings
storage is now using the base URL in the storage key. This means that if you or your
users had previously changed a few settings in the interface, for example the theme,
those settings will not be applied after the update to JupyterLite 0.6.0.

To configure a custom settings storage name, you can set the `settingsStorageName`
option in your `jupyter-lite.json` file. For example:

```json
{
  "jupyter-lite-schema-version": 0,
  "jupyter-config-data": {
    "settingsStorageName": "JupyterLite Storage"
  }
}
```

### API Changes

Prior to version 0.6.0, JupyterLite divided extensions into two categories:

- Regular JupyterLab extensions, loaded the same way as in JupyterLab
- "serverlite" extensions, loaded on a separate Lumino application, such as custom
  kernels

To replace default serverlite plugins or add extra "server" functionalities, extension
authors had to provide a `JupyterLiteServerPlugin`.

Starting with JupyterLite 0.6.0, all plugins are registered with the same plugin
registry, including kernels and other "server" plugins such as the kernel and session
managers. These plugins are now regular `JupyterFrontEndPlugin` instances, or
`ServiceManagerPlugin` instances (introduced in JupyterLab 4.4).

As a result, extensions no longer need to use the `"liteExtensions": true` field in
their `package.json` file. This field was previously used to indicate that an extension
was a "serverlite" extension.

Below are the changes in the different packages resulting from this architectural
change.

#### How to migrate your kernel

If you have authored a custom kernel, it should continue loading correctly in
JupyterLite 0.6.0.

However, you may want to make the following changes to your kernel extension:

- Update the plugin definition to use `JupyterFrontEndPlugin` instead of
  `JupyterLiteServerPlugin`:

```diff
 /**
  * A plugin to register the custom kernel.
  */
-const kernel: JupyterLiteServerPlugin<void> = {
+const kernel: JupyterFrontEndPlugin<void> = {
   id: 'my-custom-kernel:plugin',
   autoStart: true,
   requires: [IKernelSpecs],
-  activate: (app: JupyterLiteServer, kernelspecs: IKernelSpecs) => {
+  activate: (app: JupyterFrontEnd, kernelspecs: IKernelSpecs) => {
     kernelspecs.register({
       spec: {
         name: 'custom',
```

#### Service Worker

##### Plugin Name

The service worker plugin, which synchronizes content between the JupyterLite file
browser and the kernel when `SharedArrayBuffer` is not available, has been moved to the
`@jupyterlite/application-extension` package.

If you were disabling the Service Worker in a custom `jupyter-lite.json` file, you will
need to update the plugin name to disable as follows:

```diff
{
  "jupyter-lite-schema-version": 0,
  "jupyter-config-data": {
-   "disabledExtensions": ["@jupyterlite/server-extension:service-worker"]
+   "disabledExtensions": ["@jupyterlite/application-extension:service-worker-manager"]
  }
}
```

##### Service Worker communication

The Service Worker communicates with the main thread using a `BroadcastChannel`. In
previous versions, the broadcast channel was made available to kernels via
`IBroadcastChannelWrapper` and was provided by the
`@jupyterlite/server-extension:emscripten-filesystem` plugin.

Starting with JupyterLite 0.6.0, the Service Worker Manager plugin manages the
`BroadcastChannel` directly through the
`@jupyterlite/application-extension:service-worker-manager` plugin.

The `BroadcastChannel` now also handles stdin requests, in addition to drive requests.

As a consequence:

- `IBroadcastChannelWrapper` has been removed from the `@jupyterlite/server` package.
- The `@jupyterlite/server-extension:emscripten-filesystem` plugin has been removed from
  the `@jupyterlite/server-extension` package.
- The `BroadcastChannel` id was renamed from `'/api/drive.v1'` to `'/sw-api.v1'`.

`IBroadcastChannelWrapper` and the `@jupyterlite/server-extension:emscripten-filesystem`
plugin were primarily used to provide a convenience wrapper around the
`BroadcastChannel` used for file system access. This functionality is now handled by the
`@jupyterlite/application-extension:service-worker-manager` plugin and its
`IServiceWorkerManager` service.

If you have a custom kernel and need to enable file system access, refer to the
implementation in the [Pyodide kernel](https://github.com/jupyterlite/pyodide-kernel).

#### `@jupyterlite/server`

The following classes and interfaces have been removed:

- `JupyterLiteServer`
- `JupyterLiteServerPlugin`
- `Router`

#### `@jupyterlite/application`

The `registerPluginModule` and `registerPluginModules` methods have been removed from
the `SingleWidgetApp` class.

If you were creating your own `SingleWidgetApp` instance and using these methods to
register plugins, you should now use a `PluginRegistry` instead. The `PluginRegistry` is
now the central mechanism for managing and resolving plugins in JupyterLab 4.4 and
JupyterLite 0.6.0.

The `PluginRegistry` provides a more centralized approach to plugin management, allowing
you to register plugins before creating the application instance and resolve services
through the registry.

#### `@jupyterlite/kernel`

The previous `Kernels` class (and its `IKernels` interface), used for managing kernels
in the browser, have been renamed to `LiteKernelClient` and `IKernelClient`
respectively. `IKernelClient` now extends `IKernelAPIClient` provided by
`@jupyterlab/services`.

#### `@jupyterlite/session`

The previous `Sessions` class, used for managing sessions in the browser, has been
renamed to `LiteSessionClient`, which now implements the `ISessionAPIClient` interface
from `@jupyterlab/services`.

#### `@jupyterlite/contents`

The previous `Contents` class, used for managing contents in the browser, has been
renamed to `BrowserStorageDrive`, and now implements the `IDrive` interface from
`@jupyterlab/services`. This drive is now provided as the default drive via
`IDefaultDrive`.

The `ContentsAPI` and `ServiceWorkerContentsAPI` classes now take an `options` object as
an argument for their `constructor`.

#### `@jupyterlite/licenses`

```{warning}
The `@jupyterlite/licenses` package has been removed in JupyterLite 0.6.0.
```

The `Licenses` class, used for managing licenses in the browser, has undergone
significant API changes. It now implements the `ILicensesClient` interface from
`@jupyterlab/apputils` and is provided as a plugin via the
`@jupyterlite/apputils-extension:licenses-client` plugin.

#### `@jupyterlite/server-extension`

The `@jupyterlite/server-extension` package has been removed. The JupyterLite services
plugins (kernel, session, contents, settings, etc.) are now provided by the
`@jupyterlite/services-extension` package as `ServiceManagerPlugin` plugins.

#### `@jupyterlite/settings`

The previous `Settings` class, used for managing settings in the browser, has replaced
the default `Setting.IManager` provided by JupyterLab. Its API has been changed
accordingly to fulfill the `Setting.IManager` interface.

The `@jupyterlite/settings` package no longer exports any tokens.

#### `@jupyterlite/translation`

```{warning}
The `@jupyterlite/translation` package has been removed in JupyterLite 0.6.0.
```

Translations are now supported by implementing the `ITranslatorConnector` interface
provided by JupyterLab, which is then exposed via the
`@jupyterlite/apputils-extension:translator-connector` plugin.

## `v0.4.0` to `v0.5.0`

### Extensions

JupyterLite 0.5.0 is based on the JupyterLab 4.3 and Jupyter Notebook 7.3 packages.

Although no breaking changes are expected, this may affect the extensions you are using
as they may rely on features added to JupyterLab 4.3 and Notebook 7.3.

See the JupyterLab and Notebook changelogs for more information:

- [JupyterLab 4.3](https://jupyterlab.readthedocs.io/en/stable/getting_started/changelog.html#v4-3)
- [Jupyter Notebook 7.3](https://jupyter-notebook.readthedocs.io/en/stable/changelog.html#v7-3)

### `jupyterlite-core`

Support for Python 3.8 has been dropped. `jupyterlite-core` now requires Python 3.9 or
higher.

### API Changes

#### `@jupyterlite/kernel`

The `IKernel` interface now includes a `changed` signal which is emitted when a kernel
is started or stopped. This should only affect extensions providing implementing that
interface to provide a custom kernel manager for JupyterLite.

### Configuration

The following configuration options were removed from the
[JupyterLite schema](./reference/schema-v0.rst):

- `collaborative`
- `fullWebRtcSignalingUrls`

## `v0.3.0` to `v0.4.0`

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

## `v0.2.0` to `v0.3.0`

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

## `v0.1.0` to `v0.2.0`

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
