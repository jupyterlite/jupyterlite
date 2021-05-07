# Configuring

## Configuration Files

The configuration of your JupyterLite can be controlled by creating specially-named
files at any level of the file tree. It is expected each file conforms to the
[schema](#schema).

| File                 | Config Location              | `jupyter-config-data` | Note                                            |
| -------------------- | ---------------------------- | --------------------- | ----------------------------------------------- |
| `jupyter-lite.ipynb` | `#/metadata/jupyter-lite`    | ✔️                    | integrates into existing Jupyter workflows      |
| `jupyter-lite.json`  | whole file                   | ✔️                    | good for simple/automated configuration         |
| `index.html`         | `script#jupyter-config-data` | ✔️                    | configuration of last resort, _not recommended_ |

Each can be omitted from the file tree, and will result in a harmless (though noisy)
`404` response.

```{hint}
Configuration cascades _down_, such that the closest, most-user-editable file
to the `index.html` being serve takes highest precedence. With the exception of
the list of `federated_extensions`, which are _merged_, like-named keys will be
_replaced_  by higher-priority files.
```

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

## Adding Initial Content

```{danger}
This feature hasn't even been _started_!
```

### _Content, The Hard Way_

- _Copy your files in `$YOUR_JUPYTERLITE/files`._
- _Do something to generate valid Jupyter Server API responses_
- _Put them someplace_

## Adding Extensions

```{warning}
This is a heavily work-in-progress procedure, and will hopefully soon be improved
with convenience tools in (at least) python and JavaScript.
```

### Extensions, The Hard Way

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

### Handle theme assets

The Theme Manager expect to be able to load theme CSS/font assets from
`{:app}/build/themes/({:org}/){:package}`, where `app` is usually `lab`.

Continuing the example above:

```bash
cd $YOUR_JUPYTERLITE/lab/extensions
mkdir -p ../build/themes
cp -r @*/*/themes/* ../build/themes/
cp -r @*/themes/* ../build/themes/
# To also ensure these are available for JupyterLite Classic:
mkdir -p ../../classic/build/themes
cp -r @*/*/themes/* ../../classic/build/themes/
cp -r @*/themes/* ../../classic/build/themes/
```

### Fill Out `federated_extensions`

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
Some extensions also include a `style` key, and may look _off_ if omitted.
```

### Customizing a Specific App

Similar to the above, by updating `$YOUR_JUPYTERLITE/{app}/jupyter-lite.json`, the
federated extensions will only be avaialable for pages within that file tree.

## Customizing Settings

> _TBD_
