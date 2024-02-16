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
- The [p5 notebook](https://github.com/jtpio/p5-notebook) is a customized version of
  JupyterLite focused on simplicity and the use of the [p5.js](https://p5js.org/)
  library.

A deployment can have one or more applications available.

## Applications

### JupyterLab

JupyterLab is the next-generation user interface for Project Jupyter offering all the
familiar building blocks of the classic Jupyter Notebook (notebook, text editor, file
browser, rich outputs, etc.) in a flexible and powerful user interface. JupyterLab will
eventually replace the classic Jupyter Notebook.

![image](https://user-images.githubusercontent.com/591645/153932638-771ca1f4-0ec0-4b77-a5d4-644748c7538e.png)

### Jupyter Notebook

Jupyter Notebook is a document-centric UI for creating, editing and running Jupyter
notebooks.

![image](https://user-images.githubusercontent.com/591645/153932487-7383ced5-003d-4752-99dc-450cc780443a.png)

### REPL

The `REPL` application is a minimal UI based on the JupyterLab code console to easily
execute code in the browser.

![image](https://user-images.githubusercontent.com/591645/153935929-23a5d380-363e-490b-aabd-f0a780140588.png)

## Kernels

JupyterLite Kernels implement [Jupyter Kernel Messaging][jkm] in the browser with the
help of [`mock-socket`][mock-socket] and [WebAssembly][webassembly], without relying on
any external infrastructure.

The JupyterLite contributors develop and maintain the following kernels:

- a Python kernel based on [Pyodide][pyodide]:
  [https://github.com/jupyterlite/pyodide-kernel](https://github.com/jupyterlite/pyodide-kernel)
- a Python kernel based on [Xeus Python][xeus-python]

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

## Working with files

By default the files you create in JupyterLite are stored in the browser's local storage
(IndexedDB). They are not shared between different JupyterLite website unless they are
deployed on the same domain, and you use the same browser.

### Uploading files

JupyterLite supports uploading files from your local machine to the browser's local
storage. This can be achieved by dragging and dropping files from your local machine to
the file browser, or by using the `Upload` button in the file browser.

This is useful for example when you want to upload a dataset to use in a notebook, like
a CSV file.

However please note that the browser's local storage has a limited capacity, and you
might not be able to upload large files. But smaller files up to ~50MB should be fine.

```{note}
To learn more about the browser's storage limits, check out the [browser storage][browser-storage] reference page on MDN.
```

[browser-storage]:
  https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria

### Accessing existing files

Some JupyterLite deployments might provide access to some files by default. These files
are stored as static assets on the server, and are made available to the user via the
JupyterLite file browser. They can be edited, but the changes are not saved back to the
server. Instead a local copy is created in the browser's local storage just like when
creating a new file.

```{note}
If you would like to revert to the original file, you can delete the local copy.
This can be achieved by right-clicking on the file in the file browser and selecting `Delete`.
```

```{note}
If you are a site deployer, check out the [guide](../howto/content/files.md) to learn how to make files available to users.
```

(install-application)=

## Installing the JupyterLite application

JupyterLite can also be installed as an application if it is supported by the browser
and the operating system.

When you visit a JupyterLite website, you can install it as an application by clicking
on the `Install` button in search bar:

![a screenshot showing how to install the JupyterLite app](https://user-images.githubusercontent.com/591645/228767533-1535da26-7dd3-4223-9b43-62c6e65c4171.png)

```{note}
If the `Install` button is not visible, make sure to check with another browser.
```

### Example on Linux with Gnome

Once installed, the JupyterLite application can be launched via the overview on Gnome:

![a screenshot showing how to launch the JupyterLite app](https://user-images.githubusercontent.com/591645/175347542-f9477e79-e029-4ae0-9299-238b74a63f26.png)

The application will then be opened in a new window like a regular desktop application:

![a screenshot showing the JupyterLite application on desktop](https://user-images.githubusercontent.com/591645/228768252-35ca71ba-a8ae-4261-a24b-94ab4d896279.png)

### Example on Android

It is also possible to install the JupyterLite application on mobile devices.

On Android it will look like the following:

```{image} https://user-images.githubusercontent.com/591645/228768748-c053d450-2b88-45c6-84cd-76d838228fbf.png
:alt: a screenshot showing how to install the JupyterLite app on Android
:height: 512px
:align: center
```

After clicking on the `Install` button, the application will be available on the home
screen:

```{image} https://user-images.githubusercontent.com/591645/228768956-374ad79e-b5ee-45da-9077-bab4b6b7fce5.png
:alt: a screenshot showing the JupyterLite application on the home screen
:height: 512px
:align: center
```
