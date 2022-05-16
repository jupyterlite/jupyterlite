# Deploy JupyterLite on a standalone server or locally

Deploying a JupyterLite site requires:

- a copy of the JupyterLite site assets
  - often provided by the `pip`-installable python package `jupyterlite`
- an option set of [configurations](./configuring.md) for the site and different apps
  - different options offer trade-offs between reproducibility, build speed, deployment
    size, and end-user performance, privacy, and security
- a [local](#local), [on-premises](#on-premises), or [hosted](#hosted) HTTP server
  (doesn't presently work with `file://` URLs)

```{warning}
Serving some of the [kernels](./kernels/index.md) requires that your web server supports
serving `application/wasm` files with the correct headers
```

```{hint}
An HTTPS-capable server is recommended for all but the simplest `localhost` cases.
```

## Get an Empty JupyterLite Site

The minimum deployable site archive contains enough to run all of the default
[applications](./applications/index.md), but no content.

```{hint}
Use of the CLI is optional, but **recommended**. It offers substantially better
integration with other Jupyter tools.
```

To get the [Python CLI](./cli.ipynb) and [API](./api/index.md) from [PyPI]:

```bash
python -m pip install --pre jupyterlite
# TODO: mamba install jupyterlite
```

To build an empty site (just the JupyterLite static assets):

```bash
jupyter lite init
```

### Static Site: The Hard Way

- download a release archive from [GitHub Releases][releases]
- download nightly/work-in-progress builds from [GitHub actions]
- clone/fork the [repository] and do a [development build](../contributing.md)
- _TBD: use `cookiecutter-jupyterlite`_
- _TBD: `yarn add @jupyterlite/builder` from `npmjs.com`_

[github actions]: https://github.com/jupyterlite/jupyterlite/actions
[releases]: https://github.com/jupyterlite/jupyterlite/releases
[pypi]: https://pypi.org/project/jupyterlite/

```{hint}
It is recommended to put these files under revision control. See [Configuring](./configuring.md)
for what you can configure in your JupyterLite.
```

## Build Tools

While the JupyterLite CLI will create the correct assets for JupyterLite, it might not
be enough to deploy along with the rest of your content.

### WebPack

At present, the core JupyterLite site and apps are not published as reusable packages.
At some point in the future, a WebPack plugin might allow for integrating at this level.

## Standalone Servers

### Local

Suitable for local development, many languages provide easy-to-use servers that can
serve your JupyterLite locally while you get it working the way you want.

#### `jupyter lite serve`

The `jupyter lite serve` command offers either a web server powered by Python's built-in
`http.server` or `tornado`, which is likely to be available if any other Jupyter tools
are installed.

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

If you are using a recently-released Python 3.7+, this will correctly serve
`application/wasm` files for pyodide.

#### NodeJS

Most nodejs-based servers will be able to host JupyterLite without any problems. Note,
however, that `http-server` does not support the `application/wasm` MIME type.
