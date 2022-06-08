# Create a server extension

JupyterLite uses the same plugin architecture for server components as in JupyterLab.

Server components allow for kernel and session management, handling user settings,
themes and display languages.

For more information on how this fits within the whole application, check out the
[Architecture Diagram](../../reference/architecture.md).

## Creating a new server extension

The extension development system is the same as the one used to build JupyterLab
Extensions.

If you are new to developing extensions for JupyterLab, you might want to check the
[documentation] and the [extension tutorial] first to get familiar with the toolchain.

[documentation]: https://jupyterlab.readthedocs.io/en/latest/user/extensions.html
[extension tutorial]:
  https://jupyterlab.readthedocs.io/en/latest/extension/extension_tutorial.html
[cookiecutter]: https://github.com/jupyterlite/serverlite-cookiecutter-ts

### Bootstrapping the extension

First create a new development environment with:

```bash
# create the environment
mamba create -n myliteextension -c conda-forge python nodejs jupyterlab jupyter-packaging cookiecutter -y

# activate the environment
conda activate myliteextension

# install the jupyterlite CLI tool
python -m pip install jupyterlite
```

```{note}
It is recommended to use a [Long Term Support (LTS)][lts] release of NodeJS: the simple rule
of thumb is stick to **even** numbered releases.
```

Then let's generate a new extension from the [cookiecutter]:

```bash
cookiecutter https://github.com/jupyterlite/serverlite-cookiecutter-ts
```

When prompted, enter values for your extension. This will create the structure to
develop the JupyterLite extension.

[lts]: https://nodejs.org/en/about/releases/

### Build

To build the extension:

```bash
# install package in development mode
python -m pip install -e .

# link your development version of the extension
jupyter labextension develop . --overwrite

# rebuild the source after making changes
jlpm run build
```

To check the extension is correctly built and installed, make sure it is listed with the
following command:

```bash
$ jupyter labextension list
JupyterLab v3.*.*
/home/user/miniforge3/envs/tmp/share/jupyter/labextensions
        myliteextension v0.1.0 enabled OK
```

### Test

Finally, to see the extension in action in JupyterLite:

```bash
# build a new JupyterLite website
# this will pick up the extension linked locally
jupyter lite build --force

# serve the website
jupyter lite serve
```

Then open `http://localhost:8000` in a web browser. You should be able to see the
following message printed to the developer tools console:

![jupyterlite-server-extension](https://user-images.githubusercontent.com/591645/136397303-deb1187f-8ab0-4b8c-aa61-f4f8eab76258.png)

## Publishing the extension

The simplest way to publish the extension is to use the [Jupyter Releaser].

The generated repository should already be compatible with the releaser. You can then
follow the [Jupyter Releaser Documentation] to learn how to add the `PyPI` and `npm`
tokens as GitHub Secrets.

Once published, you can check the extension can be installed locally in a new
environment:

```bash
python -m pip install myliteextension
```

[jupyter releaser]: https://github.com/jupyter-server/jupyter_releaser
[jupyter releaser documentation]: https://jupyter-releaser.readthedocs.io/en/latest/

## Using the extension in a JupyterLite deployment

In most cases, this would mean adding the extension to a `requirements.txt` file:

```
jupyterlite
myliteextension
```

For more information on adding extensions to a JupyterLite website, check out the
[configuration guide](../configure/simple_extensions.md).

If a lot of customization is required, it may also be worth
[extending the JupyterLite CLI](../extensions/cli-addons.md) in your package.

However the build environment is built, once it works _well_, it is _highly recommended_
to generate and check in a full list of locked package versions. Some package managers,
such as `poetry` and `pipenv`, support this out of the box.

```{hint}
Some lightweight tools for locking requirements in formats for common package
manager tools are also available:
- [pip-tools](https://github.com/jazzband/pip-tools)
- [conda-lock](https://github.com/conda-incubator/conda-lock)
```

## References

For more information, check out the following repositories:

- [p5-kernel](https://github.com/jupyterlite/p5-kernel)
- [echo-kernel](https://github.com/jupyterlite/echo-kernel)
