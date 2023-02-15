# Add additional extensions to a JupyterLite website

JupyterLite reuses the same system of _prebuilt_ extensions as in JupyterLab 3.0+.
Prebuilt extensions are also sometimes called _federated extensions_. In JupyterLab they
can be installed via `pip` and `conda` without rebuilding the whole JupyterLab
application.

All the applications shipped with JupyterLite by default are built with JupyterLab
components. This allows for most of the existing third-party JupyterLab extensions to
also work with JupyterLite.

## Adding new extensions from an environment

### Creating a new environment

The easiest way to add new extensions is to use the `jupyterlite` CLI in a Python
environment where extensions have already been installed.

You can choose the tool of your choice to manage these dependencies, such as `pip`,
`conda` or `mamba`. For `conda` and `mamba` there are typically defined in
`environment.yml`, and in `requirements.txt` for `pip`.

If you want to build a JupyterLite website locally on your machine, it is preferable to
first create a new environment.

This can be done with the `venv` module:

```bash
python -m venv .
source bin/activate
```

Or with `conda` / `mamba`:

```bash
mamba create -n my-jupyterlite-deployment -c conda-forge python=3.10 -y
mamba activate my-jupyterlite-deployment
```

### Install `jupyterlite`

JupyterLite is distributed on PyPI, but is currently a _prerelease_. Install it with:

```bash
pip install --pre jupyterlite[lab]
```

While it is _possible_ to install `jupyterlite` without `jupyterlab`, it can be useful
to force installation to help the `pip` solver pull compatible packages.

### Installing the extensions in the environment

As an example let's use the following `requirements.txt`, starting with `jupyterlite`
itself and some JupyterLab extensions:

```
# requirements.txt
jupyterlite[lab] ==<the version you installed>
# some frontend-only labextensions
jupyterlab-tour
jupyterlab-night
```

This file defines list two extensions, one of them is a theme. Run the following command
to install them:

```bash
python -m pip install -r requirements.txt
```

If you have `jupyterlab` installed, you can verify they are correctly installed with:

```bash
jupyter labextension list
```

Which should return something similar to the following:

```text
JupyterLab v3.*.*
PREFIX/share/jupyter/labextensions
        jupyterlab-tour  v*.*.* enabled OK
        jupyterlab-night v*.*.* enabled OK
```

### Build the JupyterLite website

Now we need to produce the JupyterLite `output_dir` that will include these extensions.
This can be done with the following command:

```bash
jupyter lite build
```

When you run `jupyter lite build`, all pre-built extensions in your JupyterLab
environment, e.g. `{sys.prefix}/share/jupyter/labextensions` will be:

- copied to `{output-dir}/extensions`
- have their theme information copied to `{output-dir}/{app/?}theme/`

## The case of Jupyter Widgets and custom renderers

Some extensions like Jupyter Widgets and custom renderers also need a Python package to
be installed at runtime when working with a notebook. This is, for example, the case
with `bqplot`.

To install the frontend extensions, a recommended approach is to ensure these packages
are available in the environment where `jupyterlite` is installed before running
`jupyter lite build`.

For example, continuing from the `requirements.txt` file defined above, create a new
file, `requirements-run.txt`:

```text
# requirements-run.txt
bqplot
```

... and reference it from `requirements.txt`

```text
# requirements.txt
jupyterlite[lab] ==<the version you installed>
# some frontend-only labextensions
jupyterlab-tour
jupyterlab-night
# add runtime dependencies
-r ./requirements-run.txt
```

The end users of your JupyterLite instance will **still need to install** the
dependencies at runtime in their notebooks with the IPython-compatible `%pip` magic:

```py
%pip install -q bqplot
```

... which translates to:

```py
import piplite
await piplite.install(["bqplot"])
```

Alternately, if the `requirements-run.txt` is included as _contents_ in the build:

```pip
%pip install -r requirements-run.txt
```

### Avoid the drift of versions between the frontend extension and the Python package

At some point, the versions of the packages installed at runtime with `%pip install` or
`await piplite.install` might not be compatible with the deployed frontend extension
anymore.

This can, for example, happen when a JupyterLite website was built and deployed a couple
of weeks ago, and new versions of the Python packages were released since. In that case
the frontend extension have not been updated since they are still available as static
files as part of the deployment.

One way to avoid this mismatch is to pin the dependencies more explicitly. For example:

```text
# requirements-run.txt
ipywidgets ==8.0.4
bqplot ==0.12.36
```

The user-facing code in the notebook will then also have to use the same versions to
stay compatible. This is where the `requirements-run.txt` file really shines, as

```py
%pip install -q -r requirements-run.txt
```

... is much easier to keep accurate than:

```py
%pip install -q "ipywidgets==8.0.4" "bqplot==0.12.36"
```

... which translates to:

```py
import piplite
await piplite.install(["ipywidgets==8.0.4", "bqplot==0.12.36"])
```

### More about reproducible sitess

The above techniques are, unfortunately, somewhat brittle.

There on-going work to improve the situation in future versions of JupyterLite, such as
providing more information about the frontend packages to kernel.

In the meantime, the [guide on configuring the piplite URLs](../python/wheels.md)
describes more ways to control the site's dependencies, a substantial part of building
[reproducible sites](./advanced/offline.md) which will continue working for years.

These techniques have trade-offs, but generally improve the maintainability of the site,
and improve the overall experience for users.

For example, the experimental `--piplite-install-on-import` flag, when combined with
`--piplite-wheels`, removes the need for the explicit `%pip install` step, but requires
more planning and work up-front.

## How to know if an extension is compatible with JupyterLite?

A good starting point for extensions that _might_ work is the JupyterLab issue
_[Extension Compatibility with 3.0 (#9461)][#9461]_. Additionally, this site
demonstrates a few [extensions](../../reference/demo.md).

[#9461]: https://github.com/jupyterlab/jupyterlab/issues/9461
[pre-built extensions]: https://jupyterlab.readthedocs.io/en/stable/user/extensions.html
