# JupyterLite

[![ci-badge]][ci] [![binder-badge]][binder] [![docs-badge]][docs]

[ci-badge]: https://github.com/jtpio/jupyterlite/workflows/Build/badge.svg
[ci]: https://github.com/jtpio/jupyterlite/actions?query=branch%3Amain
[binder-badge]: https://mybinder.org/badge_logo.svg
[binder]: https://mybinder.org/v2/gh/jtpio/jupyterlite/main?urlpath=lab
[docs-badge]: https://readthedocs.org/projects/jupyterlite/badge/?version=latest
[docs]: https://jupyterlite.readthedocs.io/en/latest/?badge=latest

JupyterLite is a JupyterLab distribution that **runs entirely in the browser** built
from the ground-up using JupyterLab components and plugins.

## ✨ Try it in your browser ✨

JupyterLite works with both [JupyterLab](https://github.com/jupyterlab/jupyterlab) and
[JupyterLab Classic](https://github.com/jtpio/jupyterlab-classic).

### [Try it with JupyterLab!](https://jupyterlite.readthedocs.io/en/latest/try/lab)

![image](https://user-images.githubusercontent.com/591645/114009512-7fe79600-9863-11eb-9aac-3a9ef6345011.png)

### [Try it with JupyterLab Classic!](https://jupyterlite.readthedocs.io/en/latest/try/classic)

![image](https://user-images.githubusercontent.com/591645/114454062-78fdb200-9bda-11eb-9cda-4ee327dd1c77.png)

## Features

- Python kernel backed by [Pyodide](https://pyodide.org) running in a Web Worker
- JavaScript kernel running in an IFrame
- Offline Notebook storage in the browser
- Support for saving settings
- Basic session and kernel management to have multiple kernels running at the same time
- Support for code consoles

## Status

⚠️ Currently in active development ⚠️

## Development install

See the
[contributing guide](https://github.com/jtpio/jupyterlite/blob/main/CONTRIBUTING.md) for
a development installation.

## Related

JupyterLite is a reboot of several attemps at making a full static Jupyter distribution
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
