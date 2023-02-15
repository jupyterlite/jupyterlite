# Create a JupyterLite archive that can be used offline

It is possible to create a fully self-contained JupyterLite archive with no request to
external services.

## Configure Pyolite

By default the Pyodide files are fetched from a CDN.

The full Pyodide distribution can be pretty heavy (~180MB), but it's possible to
self-host it.

Use the `--pyodide` flag to specify the Pyodide distribution you would like to use. For
example:

```bash
jupyter lite build --pyodide https://github.com/pyodide/pyodide/releases/download/0.22.1/pyodide-0.22.1.tar.bz2
```

```{warning}
Generally, a version of `pyolite` is likely only compatible with variants of the
_same_ `x.y.z` version against which the release was tested, as both python
and JS APIs are still changing frequently on both sides of the dependency.
```

## Configure MathJax

By default, the [MathJax] `LaTeX` typesetting library is fetched from a CDN.

[mathjax]: https://mathjax.org

To retrieve these static asssets at build time and serve them alongside the main
JupyterLite site assets, make sure to install `jupyterlite` with
`pip install jupyterlite[mathjax]`.

## Configure the `piplite` wheels

By default, when a user runs `%pip install` or `await piplite.install()`, wheels will be
downloaded from the offical Python Packaging Index, [PyPI].

You can instead configure a list of packages that will be downloaded at _build_ time so
they can be hosted alongside your JupyterLite website, or even
[installed on import](#install-on-import), just like, or even replacing, core pyodide
packages.

See [wheels](../../python/wheels.md) for more information.

### Using `pypi/`

Any wheels put in the `{lite_dir}/pypi` will be indexed during build. These will be
copied to `{output_dir}/pypi`, and will have an `all.json` file created with their
metadata so they can be found by name.

### Using `piplite_urls`

Alternately, wheels can be downloaded at build time via URLs.

Concretely, this means populating a list of URLs of wheels. A good example for this is
the configuration used for the JupyterLite demo website:
[jupyter_lite_config.json][lite-demo-config]

The relevant part of `jupyter_lite_config.json` is the `piplite_urls` list which looks
like the following:

```json
{
  "PipliteAddon": {
    "piplite_urls": [
      "https://files.pythonhosted.org/packages/e6/0b/24795939622d60f4b453aa7040f23c6a6f8b44c7c026c3b42d9842e6cc31/fastjsonschema-2.15.3-py3-none-any.whl",
      "https://files.pythonhosted.org/packages/py2.py3/a/asttokens/asttokens-2.0.5-py2.py3-none-any.whl",
      "https://files.pythonhosted.org/packages/py2.py3/b/backcall/backcall-0.2.0-py2.py3-none-any.whl",
      "https://files.pythonhosted.org/packages/py2.py3/b/bqplot/bqplot-0.12.33-py2.py3-none-any.whl",
      "https://files.pythonhosted.org/packages/py2.py3/c/certifi/certifi-2021.10.8-py2.py3-none-any.whl",
      "https://files.pythonhosted.org/packages/py2.py3/d/defusedxml/defusedxml-0.7.1-py2.py3-none-any.whl",
      "https://files.pythonhosted.org/packages/py2.py3/e/executing/executing-0.8.3-py2.py3-none-any.whl",
      "..."
    ]
  }
}
```

Tweak this list based on the packages you would like to serve statically.

These need be accessible at build time, but will be copied into the built site, so the
user of a JupyterLite site will _not_ need to be able to access to any custom URLs.

[pypi]: https://pypi.org
[lite-demo-config]:
  https://github.com/jupyterlite/jupyterlite/blob/main/examples/jupyter_lite_config.json

### Install on import

```{warning}
This feature has not been exhaustively tested with the hundreds of thousands
of wheels, build systems, and other factors involved in arbitrary python packages.
```

Once wheels are known to `jupyter lite build`, they can be made to appear as if they are
part of the pyodide distribution, or even overload packages provided by pyodide.

With the experimental CLI flag `--piplite-install-on-import` (or the configuration value
`PipliteAddon.install_on_import`), a pyodide `repodata.json` will be generated along
with the PyPI Warehouse-compatible `all.json`. While very similar, this file includes
the critical mapping from `import`able python module names to the distribution which
provides them.

This allows for treating known packages as "already installed," though of course they
must _still_ be downloaded from the JupyterLite site, cached, and parsed.

#### Limitations

This feature has a number of _known_ limitations:

- it only permits a _single_ version of a named package
- _all_ dependencies of the package _must_ be downloaded and indexed
- exotic installation tricks might not work properly

However, a number of additional edges cases will certainly become apparent as this
technique is tried in more settings.

## Reference

Check out the [CLI Reference](../../../reference/cli.ipynb) for more details.
