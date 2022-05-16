# Deploying on ReadTheDocs with `jupyterlite-sphinx`

[Sphinx] is the workhorse of documentation of not only the scientific Python
documentation community, but also the broader Python ecosystem, and many languages
beyond it. It is well adapted to building sites of any size, and tools like [myst-nb]
enable make it very palletable to include executable, and even interactive, content.

JupyterLite assets can be copied to the default static directory in `conf.py`, e.g.
`docs/_static` with [`html_static_path`](#html_static_path), or replace the entire site
with [`html_extra_path`](#html_extra_path)

## The Hard Way

Below is a more **advanced** section on the underlying hooks and configuration to build
with Sphinx.

### `html_static_path`

This search path can be merged several layers deep, such that your theme assets, the
"gold master" JupyterLite assets, and any customizations you wish to make are combined.

```python
html_static_path = [
    "_static",
    "../upstream-jupyterlite",
    "../my-jupyterlite"        # <- these "win"
]
```

The composite directory will end up in `docs/_build/_static`.

```{hint}
See the JupyterLite [conf.py] for an example approach, though it's likely a good
deal more complicated than you will need, because it needs to build _itself_ first!
This complexity is managed in [dodo.py].
```

### `html_extra_path`

A slightly more aggressive approach is to use [`html_extra_path`][html_extra_path] to
simply _dump_ the assets directly into the doc folder. This approach can be used to
deploy a site that launches _directly_ into your JupyterLite.

Adapting the example above:

```python
html_extra_path = ["../upstream-jupyterlite", "../my-jupyterlite"]
```

Again, the last-written `index.html` will "win" and be shown to visitors to `/`, which
will immediately redirect to `appUrl` as defined in the [schema].

[html_static_path]:
  https://www.sphinx-doc.org/en/master/usage/configuration.html#confval-html_static_path
[html_extra_path]:
  https://www.sphinx-doc.org/en/master/usage/configuration.html#confval-html_extra_path
[sphinx]: https://www.sphinx-doc.org
[myst-nb]: https://github.com/executablebooks/MyST-NB
[conf.py]: https://github.com/jupyterlite/jupyterlite/blob/main/docs/conf.py
[dodo.py]: https://github.com/jupyterlite/jupyterlite/blob/main/dodo.py
[schema]: ../../reference/schema-v0.rst
