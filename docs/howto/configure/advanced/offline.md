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

## Configure Mathjax

By default Mathjax is fetched from a CDN.

To retrieve the static asssets at built time and serve them alongside the main website
assets, make sure to install `jupyterlite` with `pip install jupyterlite[mathjax]`.

## Configure the piplite wheels

By default calling `%pip install` or `piplite.install()` downloads and installs packages
from the public [PyPI].

Instead you can configure a list of packages that will be downloaded at _build_ time so
they can be hosted alongside your JupyterLite website.

See [](../../python/wheels.md) for more information.

Concretely that means populating a list of URLs for downloading wheels. A good example
for this is the configuration used for the JupyterLite demo website:
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

[pypi]: https://pypi.org
[lite-demo-config]:
  https://github.com/jupyterlite/jupyterlite/blob/main/examples/jupyter_lite_config.json

### Install on import

```{warning}
This feature has not been exhaustively tested with the hundreds of thousands
of wheels, build systems, and other factors involved in arbitrary python packages.
```

Once wheels are known to `jupyter lite build`, they can be made to appear as if they are
part of the pyodide distribution, or even overloading one or more packages provided by
pyodide.

With the experimental CLI flag `--piplite-install-on-import` (or the configuration value
`PipliteAddon.install_on_import`), a pyodide `repodata.json` will be generated along
with the PyPI Warehouse-compatible `all.json`. While very similar, this file includes
the critical mapping from `import`able python module name to the distribution which
provides it.

This allows for treating known packages as "already installed," though of course they
must _still_ be downloaded, cached, and parsed.

#### Limitations

This feature has a number of _known_ limitations:

- it only permits a _single_ version of a named package
- exotic installation tricks might not work properly

## Reference

Check out the [CLI Reference](../../../reference/cli.ipynb) for more details.
