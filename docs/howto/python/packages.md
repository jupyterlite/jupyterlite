# Use additional Python packages

## Installing packages at runtime

JupyterLite provides an additional `piplite` layer on top of [micropip] to install
packages from Python notebooks.

New packages can be downloaded and installed at runtime. For example to install
`snowballstemmer`.

```py
%pip install -q snowballstemmer
```

which translates to:

```py
import piplite
await piplite.install("snowballstemmer")
```

```{note}
Some Python packages require a frontend extension to also be installed.

See [](../../howto/configure/simple_extensions.md) for more information.

See also how to [ship additional wheels](./wheels.md) at build time.
```

[micropip]: https://pyodide.org/en/latest/usage/loading-packages.html?#micropip

## Bundling additional packages by default

At the moment the most reasonable way to make additional packages available by default
when starting the Python kernel is to add new packages to the Pyodide distribution.

The process is detailed in the [Pyodide documentation][pyodide-packages].

Once you have added the new package(s) and rebuilt Pyodide, you can
[configure JupyterLite to use a custom Pyodide distribution](./pyodide.md).

[pyodide-packages]: https://pyodide.org/en/stable/development/new-packages.html
