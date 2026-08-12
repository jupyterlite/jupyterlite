# Use additional Python packages

`jupyterlite-pyodide-kernel` uses several techniques for loading Python packages at
runtime:

- Pyodide's [loadPackagesFromImports] functionality for packages in a Pyodide
  distribution
  - this may be modified by
    [`jupyterlite-pyodide-kernel[lock]`](patch-a-distribution-with-jupyterlite-pyodide-kernel-lock).
- `piplite`'s API (or `%pip` magic) layer on top of [micropip]

[loadPackagesFromImports]:
  https://pyodide.org/en/stable/usage/api/js-api.html#pyodide.loadPackagesFromImports
[micropip]: https://pyodide.org/en/latest/usage/loading-packages.html?#micropip

## Run time

### Installing packages at runtime

Site users can download and install packages at runtime.

For example, to install `snowballstemmer` from PyPI:

```py
%pip install -q snowballstemmer
```

... which translates to:

```py
import piplite

await piplite.install("snowballstemmer")
```

```{note}
Some Python packages, such as Jupyter widgets or MIME renderers, may require a
frontend extension to also be installed.

See [simple extensions](../../howto/configure/simple_extensions.md) for more information.

See also how to [ship additional wheels](./wheels.md) at build time.
```

## Build time

### Bundling additional packages by default

(patch-a-distribution-with-jupyterlite-pyodide-kernel-lock)=

#### Patch a distribution with `jupyterlite-pyodide-kernel[lock]`

Many wheels can be patched into a Pyodide distribution at build time with the optional
[`jupyterlite-pyodide-kernel[lock]`][adding-wheels-with-jupyterlite-pyodide-kernel-lock].

#### Build a new distribution with `pyodide-build`

The most general way to make additional packages available to `import` when starting the
`jupyterlite-pyodide-kernel` is to add new packages to a site's Pyodide distribution.

The process is detailed in the [Pyodide documentation][pyodide-packages].

Once you have added new package and their dependencies and rebuilt Pyodide, you can
[configure JupyterLite to use a custom Pyodide distribution](./pyodide.md).

[pyodide-packages]: https://pyodide.org/en/stable/development/building-packages.html
