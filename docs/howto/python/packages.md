# Use additional Python packages

## Installing packages at runtime

JupyterLite provides an additional `piplite` layer on top of [micropip] to install
packages in the pyolite kernel.

New packages can be downloaded and installed at runtime. For example to install
`snowballstemmer`:

```ipython
%pip install -q snowballstemmer
```

which translates to:

```ipython
import piplite
await piplite.install("snowballstemmer")
```

```{note}
Some Python packages require a frontend extension to also be installed.

See [simple extensions](../../howto/configure/simple_extensions.md) for more information.

See also how to [ship additional wheels](./wheels.md) at build time.
```

[micropip]: https://pyodide.org/en/latest/usage/loading-packages.html?#micropip

## Installing packages on import

While the above `%pip` approach is very flexible, and uses the recommended IPython
syntax for installing new packages, it can be convenient to provide additional metadata
at kernel startup time about how to load packages when they are `import`ed.

### Pure python packages

Simple python [wheels](../configure/advanced/offline.md) can be shipped along with your
JupyterLite site. With the _experimental_ `--piplite-install-on-import` flag, these will
be treated as if they were part of the Pyodide distribution, only requiring that the
importable names discovered in the wheel be `import`ed, without requiring `%pip` or
`await piplite.install`.

There are number of known edge cases which haven't been fully explored with this
approach. Results are highly dependent on some of the underlying (and private) pyodide
behavior, but is demonstrated on the JupyterLite documentation website for a relatively
large selection of packages.

### Binary packages

At the moment the most productive way to make additional packages with binary extensions
available by default when starting the Python kernel is to add new packages to a Pyodide
distribution.

The process is detailed in the [Pyodide documentation][pyodide-packages].

Once you have added the new package(s) and rebuilt Pyodide, you can configure
JupyterLite to [use a custom Pyodide distribution](./pyodide.md).

[pyodide-packages]: https://pyodide.org/en/stable/development/new-packages.html
