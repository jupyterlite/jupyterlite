# Optimizations

This document lists a couple of optimizations that can be performed to reduce the disk
size of the static assets and improve loading times.

## Removing Applications

Provide the `--apps` CLI argument once or multiple times, or configure
`LiteBuildConfig/apps` to only copy select applications to the output folder: by
default, all of the default [applications](../../../quickstart/using.md#applications)
will be copied to the output folder.

## Removing Unused Shared Packages

Provide the `--no-unused-shared-packages` or `LiteBuildConfig/no_unused_shared_packages`
to prevent copying
[shared packages](https://jupyterlab.readthedocs.io/en/stable/extension/extension_dev.html#deduplication)
used only by removed applications. For lightweight apps like `repl`, this can result in
a much smaller on-disk build.

```{warning}
Some JupyterLab extensions may require shared packages from the full JupyterLab
application, and will not load with this setting.
```

## Removing Source Maps

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
