# Deploy JupyterLite on a standalone server or locally

Deploying a JupyterLite site requires:

- a copy of the JupyterLite site assets
  - often provided by the `pip`-installable python package `jupyterlite`
- an option set of configurations for the site and different apps
  - different options offer trade-offs between reproducibility, build speed, deployment
    size, and end-user performance, privacy, and security

## Get an Empty JupyterLite Site

The minimum deployable site archive contains enough to run all of the default
[applications](./using.md#applications), but no content.

```{hint}
Use of the CLI is optional, but **recommended**. It offers substantially better
integration with other Jupyter tools.
```

To get the [Python CLI](../reference/cli.ipynb) and [API](../reference/api/index.md)
from [PyPI]:

```bash
python -m pip install --pre jupyterlite
```

```{note}
`jupyterlite` will soon be available on [conda forge]
```

To build an empty site (just the JupyterLite static assets):

```bash
jupyter lite init
```

By default the JupyterLite website will be placed in the `_output` folder. You can
specific a different with `--output-dir` parameter. For instance:

```bash
jupyter lite build --output-dir dist
```

## Standalone Servers

Now that the static assets have been built, you can use a plain HTTP server to serve
them and access JupyterLite from a web browser.

Suitable for local development, many languages provide easy-to-use servers that can
serve your JupyterLite locally while you get it working the way you want.

```{warning}
Serving some of the kernels requires that your web server supports
serving `application/wasm` files with the correct headers
```

```{hint}
An HTTPS-capable server is recommended for all but the simplest `localhost` cases.
```

### `jupyter lite serve`

The `jupyter lite serve` command offers either a web server powered by Python's built-in
`http.server` or `tornado`, which is likely to be available if any other Jupyter tools
are installed.

In the same directory, run the following command to start the server:

```bash
jupyter lite serve
```

```{note}
More options are also available such as changing the port and log level.
Check out the help with `jupyter lite serve --help` to learn more.
```

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
`application/wasm` files for WebAssembly kernels.

#### NodeJS

Most nodejs-based servers will be able to host JupyterLite without any problems. Note,
however, that `http-server` does not support the `application/wasm` MIME type.

## Using a release archive

As an alternative to using the `jupyterlite` CLI, you can also download a release
archive from the [GitHub Releases][releases] page.

Download it an extract it, then use one of the approaches mentioned above to start the
server.

Nightly and work-in-progress archives are also available from [GitHub actions].

[github actions]: https://github.com/jupyterlite/jupyterlite/actions
[releases]: https://github.com/jupyterlite/jupyterlite/releases
[pypi]: https://pypi.org/project/jupyterlite/
[conda forge]: https://conda-forge.org/
[jupyter server]: https://jupyter-server.readthedocs.io/en/latest/
