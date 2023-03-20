# Using an existing JupyterLite deployment

If this is the first time you hear about JupyterLite, you might want to first try it
out.

## How is JupyterLite different than JupyterLab?

If you're using a JupyterLite site, there isn't much to know. It works like a regular,
server-backed JupyterLab site, except:

- The list of kernels, usually visible from the _Launcher_ as different _Notebook_
  flavors, will be different. See [the Kernels section below](#kernels).
- Your data is written to in-browser storage
  - though you may be able to copy
- None of your data leaves your browser unless...
  - Extensions are installed and enabled, and send data to external services
  - Your _Notebooks_ include code that uses the browser's `fetch` mechanism

## Using JupyterLite

Using JupyterLite is _simple_: just visit the URL of a deployment in a web browser!

There are a couple of public-facing JupyterLite instances out there, with different sets
of extensions, packages and content:

- The JupyterLite `main` site, built on top of the `main` branch of the
  [jupyterlite](https://github.com/jupyterlite/jupyterlite) repo, deployed to
  ReadTheDocs:
  [https://jupyterlite.rtfd.io/en/latest/try/lab](https://jupyterlite.rtfd.io/en/latest/try/lab).
  In fact it lives really next to this current documentation, and you can launch the
  different interfaces via the `Try` buttons in the top left corner of the page.
- The JupyterLite `demo` repository:
  [https://github.com/jupyterlite/demo](https://jupyterlite.github.io/demo/). This repo
  can also be used as a template to create a your website, see the
  [quick-start guide](../quickstart/deploy.md) to learn how to deploy your own.
- The [Try Jupyter](https://jupyter.org/try) deployment:
  [https://jupyter.org/try-jupyter/lab/](https://jupyter.org/try-jupyter/lab/)

A deployment can have one or more applications available.

## Applications

### JupyterLab

JupyterLab is the next-generation user interface for Project Jupyter offering all the
familiar building blocks of the classic Jupyter Notebook (notebook, text editor, file
browser, rich outputs, etc.) in a flexible and powerful user interface. JupyterLab will
eventually replace the classic Jupyter Notebook.

![image](https://user-images.githubusercontent.com/591645/153932638-771ca1f4-0ec0-4b77-a5d4-644748c7538e.png)

### RetroLab

RetroLab is a JupyterLab distribution with a retro look and feel, similar to the classic
Jupyter Notebook.

![image](https://user-images.githubusercontent.com/591645/153932487-7383ced5-003d-4752-99dc-450cc780443a.png)

### REPL

The `REPL` application is a minimal UI based on the JupyterLab code console to easily
execute code in the browser.

![image](https://user-images.githubusercontent.com/591645/153935929-23a5d380-363e-490b-aabd-f0a780140588.png)

## Kernels

JupyterLite Kernels implement [Jupyter Kernel Messaging][jkm] in the browser with the
help of [`mock-socket`][mock-socket] and [WebAssembly][webassembly], without relying on
any external infrastructure.

The JupyterLite contibutors develop and maintain the following kernels:

- a Python kernel based on [Pyodide][pyodide]:
  [https://github.com/jupyterlite/pyodide-kernel](https://github.com/jupyterlite/pyodide-kernel)
- a JavaScript kernel running in a Web Worker, developed as part of the
  `jupyterlite/jupyterlite` repository but distributed via the
  `jupyterlite-javascript-kernel` package on PyPI
- a Python kernel based on [Xeus Python][xeus-python]:
  [https://github.com/jupyterlite/xeus-python-kernel](https://github.com/jupyterlite/xeus-python-kernel)

There are a few more third-party in-browser kernels also compatible with JupyterLite.
See this [GitHub discussion][github-discussion-kernels] for more information.

Check out the [How-to Guides](../howto/index.md) of the documentation to learn how to
use and configure kernels.

[jkm]: https://jupyter-client.readthedocs.io/en/stable/messaging.html
[mock-socket]: https://github.com/thoov/mock-socket
[webassembly]: https://developer.mozilla.org/en-US/docs/WebAssembly
[github-discussion-kernels]: https://github.com/jupyterlite/jupyterlite/discussions/968
[pyodide]: https://pyodide.org
[xeus-python]: https://github.com/jupyter-xeus/xeus-python
