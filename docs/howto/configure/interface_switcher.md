# Enable switching between the JupyterLab and Notebook interfaces

By default JupyterLite includes both the JupyterLab and Notebook interfaces.

The JupyterLab interface is available under the `/lab` path, and the Notebook file
browser is available under the `/tree` path. However there is no convenient way to
switch between the two interfaces by default.

To add menu entries and toolbar items to help switching between interfaces, you can
install the `notebook` package in the build environment, just like any other extension.

## Installing the `notebook` package

In your build environment, install the `notebook` package:

```shell
pip install notebook
```

Or add it to your `requirements.txt` or similar file for managing dependencies:

```text
notebook
```

Then build your JupyterLite site as usual:

```shell
jupyter lite build
```

The `notebook` package includes a JupyterLab extensions that adds the menu entries and
toolbar items to switch between interfaces.

## Launch the Jupyter Notebook File Browser menu item

The `notebook` package adds a menu item to launch the Jupyter Notebook File Browser via
the `Help > Launch Jupyter Notebook File Browser`:

![a screenshot showing how to launch Jupyter Notebook from the menu entry](https://github.com/jupyterlite/jupyterlite/assets/591645/bc45a79a-1ede-44ca-b6ca-3deb5fe56187)

## Switch between JupyterLab and Notebook interfaces

The `notebook` package also adds a toolbar item to switch between the JupyterLab and
Notebook interfaces:

![a screenshot showing how to launch JupyterLab from a notebook](https://github.com/jupyterlite/jupyterlite/assets/591645/009c5e32-d8bf-4658-a711-b28c45dcdd1d)

## References

Check out the [guide for adding extensions](../configure/simple_extensions.md) for more
information about how to add extensions to your JupyterLite site.
