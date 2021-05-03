# Deploying

Deploying your JupyterLite requires:

- an actual HTTP server (doesn't presently work with `file://` URLs)

```{warning}
Serving some of the [kernels](./kernels/index.md) requires that your web server supports
serving `application/wasm` files with the correct headers
```

## Start with an Empty Site

You can get an empty JupyterLite by:

- _TBD: downloading a release archive from [GitHub Releases][releases]_
- _TBD: using `cookiecutter-jupyterlite`_
- _TBD: installing `jupyterlite` from [PyPI]_
- _TBD: installing `@jupyterlite/builder` from [npmjs.com]_
- cloning/forking the repository and doing a [development build](../contributing.md)

```{hint}
It is recommended to put these files under revision control. See [Configuring](./configuring.md)
for what you can configure in your JupyterLite.
```

## Standalone Servers

### Local

Suitable for local development, many languages provide easy-to-use servers that can
serve your JupyterLite locally while you get it working the way you want.

#### Jupyter

If you're already running a [Jupyter Server]-powered app, such as JupyterLab, your files
will be served correctly on e.g. `http://localhost:8888/files`.

#### Python

##### http.server

The `http` module in the Python standard library is a suitably-effective server for
local purposes.

```bash
python -m http.server -b 127.0.0.1
```

##### sphinx-autobuild

The [sphinx-autobuild](https://github.com/executablebooks/sphinx-autobuild) provides a
convenient way to manage both static content and rich interactive HTML like JupyterLite.

```bash
sphinx-autobuild docs docs/_build
```

This will regenerate your docs site and automatically refresh any browsers you have
open.

```{hint}
See the [ReadTheDocs](#readthedocs) section for configuration options
```

#### NodeJS

Most nodejs-based servers will be able to host JupyterLite without any problems. Note,
however, that `http-server` does not support the `application/wasm` MIME type.

## On-Premises

### nginx

> TBD

### httpd

> TBD

### IIS

> TBD

## Hosted

### Binder

A JupyterLite can be deployed behind `jupyter-server-proxy` using a [local](#local)
method. This is a good way to test deployment interactively.

### ReadTheDocs

In a sphinx-based build, include the JupyterLite assets in `_static`, or configure with
`html_static_path`.

```python
html_static_path = ["_static", "../my-jupyterlite"]
```

### Vercel

> TBD

### GitHub Pages

> TBD

### GitLab Pages

> TBD

### Heroku

> TBD
