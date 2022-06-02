# The Hard Way

This is an **advanced** section and you should consider the other guides first before
resorting to the Hard Way.

## Content, The Hard Way

Assuming:

- you have a running JupyterLab 3
- you want to add all of the files in the root folder of the current JupyterLab to your
  JupyterLite.

Open a browser:

- view the
  [Contents API](https://jupyter-server.readthedocs.io/en/latest/developers/rest-api.html#get--api-contents-path),
  e.g. `http://localhost:8888/api/contents`, which should look like the following:

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

## Extensions, The Hard Way

```{warning}
This is a very manual process, and other the methods in the other guides are recommended for production uses.
```

### Get the extension assets

Assuming you have a working JupyterLab 3 installation, look in your
`{sys.prefix}/share/jupyter/labextensions`. Each folder contains either:

- if it begins with `@`, a collection of packages
- otherwise, a single pre-built extension

```bash
cd $YOUR_JUPYTERLITE
mkdir -p extensions
cd extensions
cp -r $PREFIX/share/jupyter/labextensions/@jupyter-widgets/jupyterlab-manager .
```

```{warning}
Some extensions will require _other_ extensions to be available. This can be
determined by looking in `package.json` for the extension, specifically
`#/jupyterlab/sharedPackages`.
If that's the case, you will also need to copy the required extensions to the JupyterLite directory.
```

### Handle theme assets

The Theme Manager expects to be able to load theme CSS / font assets from
`{:app}/build/themes/({:org}/){:package}`, where `app` is usually `lab`.

Continuing the example above:

```bash
cd $YOUR_JUPYTERLITE/extensions
mkdir -p ../build/themes
cp -r @*/*/themes/* ../build/themes/
cp -r @*/themes/* ../build/themes/
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
