# Create a new frontend extension

## Introduction

There are two types of extensions in JupyterLite:

- frontend extensions
- server extensions

Frontend extensions are JupyterLab extensions, and are meant to extend the interfaces
and functionalities of the JupyterLab and Notebook UIs.

Example of such extensions are:

- [jupyterlab-tour]: walk users through the JupyterLab interface
- [jupyterlab-night]: custom dark theme for JupyterLab

In this guide, we cover frontend extensions. If you would like to create a server
extension, check out [Server Extension Guide](./server.md).

[jupyterlab-tour]: https://github.com/jupyterlab-contrib/jupyterlab-tour
[jupyterlab-night]: https://github.com/martinRenou/jupyterlab-night

## Creating the extension

Since JupyterLite reuses the same extension system as in JupyterLab, you can develop the
extension the same way as you would develop a normal JupyterLab extension.

### Create a new environment

A best practice is to create a new environment for working on the extension. You can use
`mamba` for this:

```bash
mamba create -n my-jupyterlite-extension -c conda-forge python nodejs
mamba activate my-jupyterlite-extension
```

### Follow the Extension Tutorial

Follow the [Extension Tutorial][extension-tutorial] to get started.

After the tutorial, you should have a new local folder with the extension activate in
JupyterLab.

[extension-tutorial]:
  https://jupyterlab.readthedocs.io/en/stable/extension/extension_tutorial.html

### Load the extension in JupyterLite

By default JupyterLite is able to find JupyterLab extensions installed in the same
environment under `PREFIX/share/labextensions`.

The `jupyterlite` CLI does this automatically by default. In your local environment:

1. Install the `jupyterlite` CLI with: `pip install jupyterlite`
2. Build the website: `jupyter lite build`. In the build logs you should see something
   like the following that indicates the extension was correctly found and copied:

```
...
federated_extensions:copy:ext:jupyterlab_apod
.  pre_build:federated_extensions:copy:ext:jupyterlab_apod
...
```

3. Serve the website: `jupyter lite serve`

Then open your browser at `http://localhost:8000` and you should be able to see the
Astronomy Picture of the Day (APOD) extension loaded:

![apod-tutorial]

If you iterate and make new changes to the extension:

- Rebuild the extension with `jlpm run build`
- Re-run `jupyter lite build`
- Refresh the page

[apod-tutorial]:
  https://user-images.githubusercontent.com/591645/171583522-f5677259-b91a-4ab0-8812-9770807a088e.gif

## Publishing the extension

Once you have your extension running you might want to publish to PyPI so it can be
installed by other folks.

By default the extension created from the cookiecutter is compatible with the Jupyter
Releaser.

The Jupyter Releaser simplifies the release process and ensure best practices.

You can learn more about publishing the extension on the [JupyterLab
documentation][publish-extension].

[publish-extension]:
  https://jupyterlab.readthedocs.io/en/stable/extension/extension_tutorial.html#publishing-your-extension
