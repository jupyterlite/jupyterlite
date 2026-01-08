# JupyterLite

[![ci-badge]][ci] [![lite-badge]][lite] [![docs-badge]][docs] [![zulip-badge]][zulip]

[ci-badge]: https://github.com/jupyterlite/jupyterlite/workflows/Build/badge.svg
[lite-badge]: https://jupyterlite.rtfd.io/en/latest/_static/badge.svg
[lite]: https://jupyterlite.rtfd.io/en/stable/try/lab
[ci]: https://github.com/jupyterlite/jupyterlite/actions?query=branch%3Amain
[docs-badge]: https://readthedocs.org/projects/jupyterlite/badge/?version=latest
[docs]: https://jupyterlite.readthedocs.io/en/stable/?badge=latest
[zulip-badge]: https://img.shields.io/badge/social_chat-zulip-blue.svg
[zulip]: https://jupyter.zulipchat.com

JupyterLite is a JupyterLab distribution that **runs entirely in the browser** built
from the ground-up using JupyterLab components and extensions.

## ⚡ Status ⚡

JupyterLite is part of the [Project Jupyter](https://jupyter.org/)
[Frontends subproject](https://jupyterlab-team-compass.readthedocs.io).

Not all the features available in JupyterLab and the Classic Notebook will work with
JupyterLite, but many do!

Don't hesitate to check out the
[documentation](https://jupyterlite.readthedocs.io/en/stable/howto/index.html) for more
information and project updates.

## ✨ Try it in your browser ✨

JupyterLite works with both the [JupyterLab](https://github.com/jupyterlab/jupyterlab)
and [Jupyter Notebook](https://github.com/jupyter/notebook) interfaces.

| [Try it with JupyterLab] | [Try it with Jupyter Notebook] |
| :----------------------: | :----------------------------: |
|    ![lab-screenshot]     |     ![notebook-screenshot]     |

[try it with jupyterlab]: https://jupyterlite.readthedocs.io/en/stable/try/lab
[lab-screenshot]:
  https://github.com/jupyterlite/jupyterlite/assets/591645/8cd26a4e-59db-4b34-bf9b-cd2e9cbc7f98
[try it with jupyter notebook]: https://jupyterlite.readthedocs.io/en/stable/try/tree
[notebook-screenshot]:
  https://github.com/jupyterlite/jupyterlite/assets/591645/39acb251-69aa-4e2e-8768-6f33fc32b3e2

## 🏗️ Build your own JupyterLite 🏗️

You can build your own JupyterLite website in a couple of minutes, with custom
extensions and packages.

See the
[documentation](https://jupyterlite.readthedocs.io/en/stable/quickstart/deploy.html) for
more details.

### Browser-based Interactive Computing

JupyterLite is all about accessible browser-based interactive computing:

- Python kernels running in a Web Worker:
  - [Pyodide](https://pyodide.org) :
    [jupyterlite-pyodide-kernel](https://github.com/jupyterlite/pyodide-kernel)
  - [Xeus Python](https://xeus-python.readthedocs.io/en/latest/) :
    [jupyterlite-xeus](https://github.com/jupyterlite/xeus)
- Support for interactive visualization libraries such as `altair`, `bqplot`,
  `ipywidgets`, `matplotlib`, and `plotly`
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
- Fine-grained configurability of page settings, including reuse of federated JupyterLab
  extensions

## Version Compatibility

The table below shows the versions of JupyterLab and Jupyter Notebook bundled with each
JupyterLite core release.

| jupyterlite-core | jupyterlab | notebook | supported |
| ---------------- | ---------- | -------- | --------- |
| 0.7.0            | 4.5.0      | 7.5.0    | ✅        |
| 0.6.0            | 4.4.3      | 7.4.3    | ✅        |
| 0.5.0            | 4.3.4      | 7.3.2    | ❌        |
| 0.4.0            | 4.2.4      | 7.2.0    | ❌        |
| 0.3.0            | 4.1.1      | 7.1.0    | ❌        |
| 0.2.0            | 4.0.7      | 7.0.6    | ❌        |
| 0.1.0            | 3.5.3      | -        | ❌        |

> **Note:** Only the last two releases are actively supported.

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
- [Basthon](https://basthon.fr): A Jupyter notebook implementation using Pyodide

## 👥 Contributors

<div align="center">
  <a href="https://github.com/jupyterlite/jupyterlite/graphs/contributors">
    <img src="https://contrib.rocks/image?repo=jupyterlite/jupyterlite&max=100&columns=10" style="margin: 5px;" />
  </a>
  <p>Join our community and become a contributor today! 🚀 </p>
</div>
