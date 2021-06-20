# Configuring

## Runtime Configuration Files

The behavior JupyterLite in the browser can be controlled by creating specially-named
files at any level of the file tree. It is expected each file conforms to the
[schema](#schema). For an example, see the [demo configuration](#demo-configuration).

| File                 | Config Location              | `jupyter-config-data` | Note                                            |
| -------------------- | ---------------------------- | --------------------- | ----------------------------------------------- |
| `jupyter-lite.ipynb` | `#/metadata/jupyter-lite`    | ✔️                    | integrates into existing Jupyter workflows      |
| `jupyter-lite.json`  | whole file                   | ✔️                    | good for simple/automated configuration         |
| `index.html`         | `script#jupyter-config-data` | ✔️                    | configuration of last resort, _not recommended_ |

Each can be omitted from the file tree, and will result in a harmless (though noisy)
`404` response.

```{hint}
Configuration cascades _down_, such that the closest, most-user-editable file
to the `index.html` being served takes highest precedence. Like-named keys will be _replaced_  by higher-priority files, with the notable exceptions of:
- the `federated_extensions` and `disabledExtensions` lists which are appended
- `settingsOverrides` dictionary will be merged at the top-level of each plugin
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

## Adding Content

### _Content, The Hard Way_

```{warning}
This is a heavily work-in-progress procedure, and will hopefully soon be improved
with convenience tools in (at least) python and JavaScript.
```

Assuming:

- you have a running JupyterLab 3
- you want to add all of the files in the root folder of the current JupyterLab to your
  JupyterLite.

Open a browser:

- view the
  [Contents API](https://jupyter-server.readthedocs.io/en/latest/developers/rest-api.html#get--api-contents-path),
  e.g. `http://localhost:8888/api/contents`, which should look something like:

```json
{
  "name": "",
  "path": "",
  "last_modified": "2021-05-15T20:16:17.753908Z",
  "created": "2021-05-15T20:16:17.753908Z",
  "format": "json",
  "mimetype": null,
  "size": null,
  "writable": true,
  "type": "directory",
  "content": [
    {
      "name": "README.md",
      "path": "README.md",
      "last_modified": "2021-05-15T20:12:22.261076Z",
      "created": "2021-05-15T20:12:22.261076Z",
      "content": null,
      "format": null,
      "mimetype": "text/markdown",
      "size": 3735,
      "writable": true,
      "type": "file"
    }
  ]
}
```

- Paste this JSON in `$YOUR_JUPYTERLITE/api/contents/all.json`
- Copy your files in `$YOUR_JUPYTERLITE/files`
- Repeat this for every subfolder `:(`

Now, when the app reloads, these files will appear in the File Browser _if_ there isn't
an existing file of that name in browser storage. If a user _has_ created such a file,
and is deleted, the original server-backed file will become visible.

## Adding Extensions

JupyterLab 3 [federated extensions] allow for adding new capabilities to JupyterLite
without rebuilding the entire web application. A good starting point for extensions that
_might_ work is the JupyterLab issue _[Extension Compatibility with 3.0
(#9461)][#9461]_. Additionally, this site demonstrates a few
[extensions](#demo-extension-notes).

[#9461]: https://github.com/jupyterlab/jupyterlab/issues/9461
[federated extensions]: https://jupyterlab.readthedocs.io/en/stable/user/extensions.html

### Extensions, The Hard Way

```{warning}
This is a heavily work-in-progress procedure, and will hopefully soon be improved
with convenience tools in (at least) python and JavaScript.
```

#### Get the extension assets

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

#### Handle theme assets

The Theme Manager expects to be able to load theme CSS/font assets from
`{:app}/build/themes/({:org}/){:package}`, where `app` is usually `lab`.

Continuing the example above:

```bash
cd $YOUR_JUPYTERLITE/lab/extensions
mkdir -p ../build/themes
cp -r @*/*/themes/* ../build/themes/
cp -r @*/themes/* ../build/themes/
# To also ensure these are available for JupyterLite Retro:
mkdir -p ../../retro/build/themes
cp -r @*/*/themes/* ../../retro/build/themes/
cp -r @*/themes/* ../../retro/build/themes/
```

#### Fill Out `federated_extensions`

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

#### Extensions for a Specific App

Similar to the above, by updating `$YOUR_JUPYTERLITE/{app}/jupyter-lite.json`, the
federated extensions will only be avaialable for pages within that file tree.

## Customizing Settings

> _TBD_

## About the Demo

This documentation site contains the JupyterLite Demo (the **Try** buttons on the top of
the screen) and use a number of techniques described on this page.

### Demo Configuration

The following generated configuration powers the Demo, and is generated prior to
building the docs site, copied in during the build, and fetched by browsers from
`/_static/jupyter-lite.json`.

```{include} ../build/docs-app/jupyter-lite.json

```

### Demo Extension Notes

The `federated_extensions` above are copied from the documentation environment prior to
building this site with [Sphinx](deploying.md#sphinx), and are meant to exercise
different kinds of extensions, including themes and MIME renderers. Some transient
dependencies _also_ include labextensions, but don't work entirely correctly.

| extension                             | notes                        | working issue |
| ------------------------------------- | ---------------------------- | ------------- |
| `@jupyter-widgets/jupyterlab-manager` | needs [Jupyter Kernel Comms] | [#18]         |
| `@jupyterlab/server-proxy`            | needs server extension       |               |
| `nbdime`                              | needs server extension       |               |

[#18]: https://github.com/jtpio/jupyterlite/issues/18
[jupyter kernel comms]:
  https://jupyter-client.readthedocs.io/en/stable/messaging.html?highlight=comms#custom-messages
