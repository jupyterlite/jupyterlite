# Adding kernels

By default the `jupyterlite-core` package used to create a JupyterLite website does not
include any kernels.

If you build a JupyterLite website with `jupyter lite build` and do not have any kernel
installed you will likely see the following launcher when opening the application:

![a screenshot showing a JupyterLite instance with no kernel available](https://user-images.githubusercontent.com/591645/226575239-0cccd2de-b881-4be9-a396-c33ba0117087.png)

To add a kernel, you need to install the corresponding Python package in the environment
used to build the website.

## Choosing a kernel

Since JupyterLite kernels run in the browser, they are limited in what they can do. This
means that many of the existing Jupyter kernels like `ipykernel` will not work out of
the box in JupyterLite.

However a couple of JupyterLite kernels targeting different languages are already
available.

### Adding a Python kernel

In the case of Python there are currently two options:

- `jupyterlite-pyodide-kernel`: a Python kernel based on
  [Pyodide](https://pyodide.org/en/stable/), a Python distribution running in the
  browser.
- `jupyterlite-xeus`: JupyterLite loader for Xeus kernels
  (https://github.com/jupyterlite/xeus).

#### `jupyterlite-pyodide-kernel`

- Is based on [Pyodide](https://github.com/pyodide/pyodide)
- Uses [IPython](https://github.com/ipython/ipython) for the code execution (access to
  IPython magics, support for the inline Matplotlib backend, _etc_)
- Provides a way to dynamically install packages with `piplite` (**e.g.**
  `await piplite.install("ipywidgets")`)
- **Does not support** sleeping with `from time import sleep`
- **Does not support** pre-installing packages

Check out the dedicated guides for configuring the Pyodide kernel:

```{toctree}
:maxdepth: 1

../pyodide/packages
../pyodide/wheels
../pyodide/pyodide
```

#### `jupyterlite-xeus`

`jupyterlite-xeus` is a loader package to enable
[Xeus-based](https://github.com/jupyter-xeus/xeus) kernels in JupyterLite.

In particular it can enable [xeus-python](https://github.com/jupyter-xeus/xeus-python)
to be used in JupyterLite.

Xeus Python:

- Uses [IPython](https://github.com/ipython/ipython) for the code execution (access to
  IPython magics, support for the inline Matplotlib backend, _etc_)
- **Does not provide** (yet) a way to dynamically install packages. There is ongoing
  work for building a `mamba` package manager for WebAssembly that would allow for
  installing packages on the fly.
- **Supports** sleeping with `from time import sleep`
- **Supports** pre-installing packages from `emscripten-forge` and `conda-forge`, by
  providing an `environment.yml` file defining the runtime environment

Check out the dedicated guides for configuring the Xeus Python kernel:

```{toctree}
:maxdepth: 1

../xeus-python/preinstalled_packages
```

```{note}
These two Python kernels are very similar but yet still have some slight differences.

There are plans to converge the two implementations in the future. Concretely, this could mean being able to reuse packages from `emscripten-forge` and `conda-forge` in the Pyodide kernel. Or make some of the Pyodide features more easily reusable so they can be leveraged in the Xeus Python kernel as well.
There is ongoing work between the Pyodide and Emscripten Forge developers to make this happen.
```

```{note}
Both kernels run in a [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) to allow for better isolation and to avoid blocking the main execution thread. However it is not possible to directly manipulate the DOM from inside a worker. So using the `js.document` module in Pyodide to access elements on the page will likely give errors.
```

### Adding other kernels

Other kernels are available for other languages. You can include more than one kernel in
your JupyterLite website.

Some are listed in the [JupyterLite Kernels](../../quickstart/using.md#kernels) section
of the documentation. There might be more third-party kernels compatible with
JupyterLite.

## Installing the kernel

To include a kernel in a JupyterLite website, you need to install the corresponding
Python package in the environment used to build the website.

If you are using GitHub Pages to host your website like in the
[quickstart guide](../../quickstart/deploy.md), you can use the `requirements.txt` file
to specify the kernel to install.

For example, to install the `jupyterlite-pyodide-kernel` kernel, you can add the
following line to the `requirements.txt` file:

```
# existing dependencices
# ...
# add the Pyodide kernel
jupyterlite-pyodide-kernel
```

As an alternative, you can also install the `jupyterlite-pyodide-kernel` in your build
environment, for example with:

```
python -m pip install jupyterlite-pyodide-kernel
```

Then rebuild the website with `jupyter lite build`.

The kernel should now be available in the launcher:

![a screenshot showing a JupyterLite instance with the pyodide kernel available](https://user-images.githubusercontent.com/591645/226577204-b2e0196d-5439-4001-9bc5-ca709eb941e7.png).

## Next steps

Now that you have a JupyterLite website with a kernel, you can start creating notebooks
and running code in the browser.

If you would like to customize the JupyterLite environment more, you can read the
following sections:

- [Adding extensions](./simple_extensions.md)
- [Customizing Settings](./settings.md)
