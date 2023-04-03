# Pre-install additional packages with emscripten-forge

Using [xeus-python](https://github.com/jupyterlite/xeus-python-kernel), you can
pre-install packages available both on `conda-forge` and
[`emscripten-forge`](https://github.com/emscripten-forge/recipes) by specifying them to
the `environment.yml` file in the JupyterLite build directory.

By pre-installing packages, they are readily usable in the kernel and can be imported
without the need of installing them in the notebook with `micropip` or `piplite`.

When pre-installing packages that provides JupyterLab extensions (_e.g._ ipywidgets or
ipyleaflet), those JupyterLab extensions are automatically included in the JupyterLite
build output without the need for extra configuration.

As an example, a deployment can easily be made using the
[JupyterLite deployment demo with xeus-python](https://github.com/jupyterlite/xeus-python-demo).

This demo follows the same steps as the [quickstart](../../quickstart/deploy.md) guide
but uses Xeus Python as the kernel.
