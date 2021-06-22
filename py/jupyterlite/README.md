# jupyterlite

A build tool for creating ready-to-ship [JupyterLite][docs] sites.

It contains:

- the static assets for a baseline `jupyterlite` site
- the [command line](#command-line) tool, `jupyter lite`
- optional [integrations](#integrations) for nbconvert, sphinx

## Installation

```bash
# TBD pip install jupyterlite
# or...
# TBD mamba install -c conda-forge jupyterlite
# or...
# TBD conda install -c conda-forge jupyterlite
```

## Command Line

#### `jupyter lite init [--notebook]`

Creates a `jupyter-lite-build.json` (default) or `.ipynb` in the current working
directory with defaults, and prints the contents.

This file allows for extensible, fine-grained control over the built site.

#### `jupyter lite build [PATH]`

Updates a JupyterLite site in the current working directory (default) or given `PATH`
with the default settings.

If a `jupyter-lite-build.json` or `jupyter-lite-build.ipynb` is found, the values there
will be merged with the defaults.

##### `build` options

| Option        | Description                                                 | Notes                                      |
| ------------- | ----------------------------------------------------------- | ------------------------------------------ |
| `--serve`     | After building the site, serve it over http on `localhost`. | This is **not** a production-grade server! |
| `--port=PORT` | The port on which to serve                                  |                                            |
| `--https`     | Serve with a self-signed SSL certificate                    | Requires `trustme`.                        |

#### `jupyter lite watch [PATH]`

Watch the `PATH` for changes rebuild accordingly. Accepts all
[build options](#build-options).

## Integrations

### `jupyter nbconvert --to jupyterlite`

Uses the `jupyterlite.nbconvert.LiteExporter` to export a notebook that contains
`jupyterlite` metadata as a full site.

[docs]: https://jupyterlite.rtfd.io
