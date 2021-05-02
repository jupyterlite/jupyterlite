# Configuring

## Start with an empty site

You can get an empty JupyterLite from:

- cloning/forking the repository and doing a [development build](../contributing.md)
- _TBD: downloading a tarball from [GitHub Releases][releases]_
- _TBD: installing `jupyterlite` from [PyPI]_
- _TBD: installing `@jupyterlite/app` from [npmjs.com]_

## Configuration Files

The configuration of a JupyterLite can be controlled by including specially-named files
in each folder. It is expected each file conforms to the [schema](#schema).

- `jupyter-lite.json` is good for simple configuration
  - the whole document _is_ the configuration, and may not contain comments, trailing
    commas, etc.
- `jupyter-lite.ipynb` can integrate nicely into existing Jupyter workflows
  - the configuration is stored in [Notebook][nbformat] metadata, namely under
    `#/metadata/jupyter-lite`

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
[releases]: https://github.com/jtpio/jupyterlite/releases
[pypi]: https://pypi.org/project/jupyterlite
[npmjs.com]: https://www.npmjs.com/package/@jupyterlite/app

## Add Extensions

```{warning}
This is a heavily work-in-progress procedure, and will hopefully soon be improved
with convenience tools in (at least) python and JavaScript.
```

### The Hard Way

### Get the extension assets

Assuming you have a working JupyterLab 3 installation, look in your
`{sys.prefix}/share/jupyter/labextensions`. Each folder contains either:

- if it begins with `@`, a collection of packages
- otherwise, a single federated extension

```bash
cd $YOUR_JUPYTERLITE
mkdir -p lab/extensions
cd lab/extensions
cp -r $PREFIX/share/jupyter/labextensions/@jupyter-widgets/jupyterlab-manager .
```

```{warning}
Some extensions will require _other_ extensions to be available. This can be
determined by looking in `package.json` for the extension, specifically
`#/jupyterlab/sharedPackages`.
```

### Fill out `jupyter-lite.json` in `federated_extensions`

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
Some extensions also include a `style` key.
```

### Customizing a specific app

Similar to the above, by updating `$YOUR_JUPYTERLITE/{app}/jupyter-lite.json`, the
federated extensions will only be avaialable for pages within that file tree.
