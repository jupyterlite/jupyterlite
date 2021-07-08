# JupyterLite

[![ci-badge]][ci] [![binder-badge]][binder] [![docs-badge]][docs]

[ci-badge]: https://github.com/jupyterlite/jupyterlite/workflows/Build/badge.svg
[ci]: https://github.com/jupyterlite/jupyterlite/actions?query=branch%3Amain
[binder-badge]: https://mybinder.org/badge_logo.svg
[binder]: https://mybinder.org/v2/gh/jupyterlite/jupyterlite/main?urlpath=lab
[docs-badge]: https://readthedocs.org/projects/jupyterlite/badge/?version=latest
[docs]: https://jupyterlite.readthedocs.io/en/latest/?badge=latest

JupyterLite is a JupyterLab distribution that **runs entirely in the browser** built
from the ground-up using JupyterLab components and extensions.

## ⚡ Status ⚡

Although JupyterLite is currently being developed by core Jupyter developers, the
project is still _unofficial_.

Not all the usual features available in JupyterLab and the Classic Notebook will work
with JupyterLite, but many already do!

Don't hesitate to check out the
[documentation](https://jupyterlite.readthedocs.io/en/latest/user-guide.html#frequently-asked-questions)
for more information and project updates.

## ✨ Try it in your browser ✨

JupyterLite works with both [JupyterLab](https://github.com/jupyterlab/jupyterlab) and
[RetroLab](https://github.com/jupyterlab/retrolab).

| [Try it with JupyterLab!] | [Try it with RetroLab!] |
| :-----------------------: | :---------------------: |
|     ![lab-screenshot]     |   ![retro-screenshot]   |

[try it with jupyterlab!]: https://jupyterlite.readthedocs.io/en/latest/try/lab
[lab-screenshot]:
  https://user-images.githubusercontent.com/591645/114009512-7fe79600-9863-11eb-9aac-3a9ef6345011.png
[try it with retrolab!]: https://jupyterlite.readthedocs.io/en/latest/try/retro
[retro-screenshot]:
  https://user-images.githubusercontent.com/591645/114454062-78fdb200-9bda-11eb-9cda-4ee327dd1c77.png

## 🏗️ Build your own JupyterLite 🏗️

Install `jupyterlite` from PyPI, which comes with the CLI and a pre-built, empty site
archive.

```bash
python -m pip install --pre jupyterlite
```

Use the [`jupyter lite` CLI][cli] to `build`, `check`, or create a [reproducible],
remixable `archive` of your site, then [publish] your built site to any static host,
such as GitHub Pages or ReadTheDocs.

| `jupyter lite` | description                                         | extras                                |
| -------------: | --------------------------------------------------- | ------------------------------------- |
|         `init` | build an empty site from the bundled app archive    |                                       |
|        `build` | add your own notebooks, labextensions, and settings | `jupyter_server` for indexing content |
|        `serve` | try out your site locally                           | `tornado` for snappier serving        |
|        `check` | check your site's metadata                          | `jsonschema` for schema validation    |
|      `archive` | create a single-file archive                        |                                       |

[cli]: https://jupyterlite.readthedocs.io/en/latest/cli.html
[publish]: https://jupyterlite.readthedocs.io/en/latest/deploying.html
[reproducible]:
  https://jupyterlite.readthedocs.io/en/latest/cli.html#reproducible-archives

## Features

> For more details, see the [JupyterLite documentation](https://jupyterlite.rtfd.io).

### Browser-based Interactive Computing

- Python kernel backed by [Pyodide](https://pyodide.org) running in a Web Worker
  - Initial support for interactive visualization libraries such as `altair`, `bqplot`,
    `ipywidgets`, `matplotlib`, and `plotly`
- JavaScript and [P5.js] kernels running in an `IFrame`
- View hosted example Notebooks and other files, then edit, save, and download from the
  browser's `IndexDB` (or `localStorage`)
- Support for saving settings for JupyterLab/Lite core and federated extensions
- Basic session and kernel management to have multiple kernels running at the same time
- Support for
  [Code Consoles](https://jupyterlab.readthedocs.io/en/stable/user/code_console.html)

[p5.js]: https://p5js.org/

### Ease of Deployment

- Served via well-cacheable, static HTTP(S), locally or on most static web hosts
- Embeddable within larger applications
- Requires no dedicated _application server_ much less a container orchestrator
- Fine-grained [configurability] of page settings, including reuse of federated
  extensions

[configurability]: https://jupyterlite.readthedocs.io/en/latest/configuring.html

## Showcase

### Jupyter Interactive Widgets

![widgets](https://user-images.githubusercontent.com/591645/123929339-086f6180-d98f-11eb-8ab0-c7f9661ff41e.gif)

### JupyterLab Mimerender Extensions

![image](https://user-images.githubusercontent.com/591645/123927543-3d7ab480-d98d-11eb-9e7e-eb47baf76bc0.png)

### Matplotlib Figures

![image](https://user-images.githubusercontent.com/591645/123927611-4d929400-d98d-11eb-9201-c46dd47b9047.png)

### Altair

![altair](https://user-images.githubusercontent.com/591645/123929321-04dbda80-d98f-11eb-9d5f-c5429d7aeb51.gif)

### Plotly

![plotly](https://user-images.githubusercontent.com/591645/123929332-06a59e00-d98f-11eb-8c51-4a094859c128.gif)

## Development install

See the
[contributing guide](https://github.com/jupyterlite/jupyterlite/blob/main/CONTRIBUTING.md)
for a development installation.

## Related

JupyterLite is a reboot of several attempts at making a full static Jupyter distribution
that runs in the browser, without having to start the Python Jupyter Server on the host
machine.

The goal is to provide a lightweight computing environment accessible in a matter of
seconds with a single click, in a web browser and without having to install anything.

This project is a collection of packages that can be remixed together in variety of ways
to create new applications and distributions. Most of the packages in this repo focus on
providing server-like components that run in the browser (to manage kernels, files and
settings), so existing JupyterLab extensions and plugins can be reused out of the box.

See also:

- [p5-notebook](https://github.com/jtpio/p5-notebook): A minimal Jupyter Notebook UI for
  p5.js kernels running in the browser
- [jyve](https://github.com/deathbeds/jyve): Jupyter Kernels, right inside JupyterLab
- [Starboard Notebook](https://github.com/gzuidhof/starboard-notebook): In-browser
  literal notebooks
- [Basthon](https://basthon.fr/about.html): A Jupyter notebook implementation using
  Pyodide
