# Pre-install additional packages with emscripten-forge

Using the [xeus-python](https://github.com/jupyter-xeus/xeus-python) kernel, you can
pre-install packages from either
[conda-forge](https://conda-forge.org/feedstock-outputs/) or
[emscripten-forge](https://github.com/emscripten-forge/recipes) by specifying them in
the `environment.yml` file in the JupyterLite build directory.

By pre-installing packages, they are readily usable in the kernel and can be imported
without the need of installing them in the notebook with `micropip` or `piplite`.

When pre-installing packages that provide JupyterLab extensions (_e.g._
[ipywidgets](https://ipywidgets.readthedocs.io/) or
[ipyleaflet](https://ipyleaflet.readthedocs.io/)), those JupyterLab extensions are
automatically included in the JupyterLite build output without the need for extra
configuration.

As an example, a deployment can easily be made using the
[JupyterLite deployment demo with xeus-python](https://github.com/jupyterlite/xeus-python-demo).

This demo follows the same steps as the [quickstart](../../quickstart/deploy.md) guide
but uses Xeus Python as the kernel.

Check out the
[jupyterlite-xeus documentation](https://jupyterlite-xeus.readthedocs.io/en/latest/index.html)
for more information.
