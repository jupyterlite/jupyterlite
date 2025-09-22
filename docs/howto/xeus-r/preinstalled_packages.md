# Pre-install additional packages with emscripten-forge

Using the [xeus-r](https://github.com/jupyter-xeus/xeus-r) kernel, you can pre-install
packages from either [conda-forge](https://conda-forge.org/feedstock-outputs/) or
[emscripten-forge](https://github.com/emscripten-forge/recipes) by specifying them in
the `environment.yml` file in the JupyterLite build directory.

By pre-installing packages, they are readily usable in the kernel and can be imported
without the need of installing them in the notebook.

As an example, a deployment can easily be made using the
[Xeus-Lite demo](https://github.com/jupyterlite/xeus-lite-demo).

This demo follows the same steps as the [quickstart](../../quickstart/deploy.md) guide
but uses Xeus R as the kernel.

Check out the
[jupyterlite-xeus documentation](https://jupyterlite-xeus.readthedocs.io/en/latest/index.html)
for more information.
