# Embed a live REPL on a website

JupyterLite includes a minimal `REPL` application by default, based on the JupyterLab
Code Console.

![image](https://user-images.githubusercontent.com/591645/153935929-23a5d380-363e-490b-aabd-f0a780140588.png)

```{hint}
Check out the [Quick Start Guide](../quickstart/deploy.md) to learn how to deploy your own JupyterLite website
and have full control on the environment and extensions installed.

The snippets below use the public facing [jupyterlite.github.io/demo](https://jupyterlite.github.io/demo) as an example.
```

## Embedding the REPL on another website

Once you have a JupyterLite deployment ready to use, you can embed the REPL on any
website with the following code snippet:

```html
<iframe
  src="https://jupyterlite.github.io/demo/repl/index.html"
  width="100%"
  height="100%"
></iframe>
```

## Configuration

The behavior and the look of the REPL can be configured via URL parameters.

### Select a kernel by default

To avoid the kernel selection dialog and choose a given kernel by default:

```html
<iframe
  src="https://jupyterlite.github.io/demo/repl/index.html?kernel=python"
  width="100%"
  height="100%"
></iframe>
```

### Enable the toolbar

The toolbar can be enabled (opt-in) to add a couple of useful buttons:

```html
<iframe
  src="https://jupyterlite.github.io/demo/repl/index.html?toolbar=1"
  width="100%"
  height="100%"
></iframe>
```

### Auto execute code on startup

Custom code can automatically be executed on startup:

```html
<iframe
  src="https://jupyterlite.github.io/demo/repl/index.html?kernel=python&code=import numpy as np"
  width="100%"
  height="100%"
></iframe>
```

### Themes

It is also possible to select a theme, for example to use `JupyterLab Dark`:

```html
<iframe
  src="https://jupyterlite.github.io/demo/repl/index.html?theme=JupyterLab Dark"
  width="100%"
  height="100%"
></iframe>
```

Additional themes can be installed with `pip` if they are distributed as a JupyterLab
prebuilt extension. For example:

```bash
pip install jupyterlab-gt-coar-theme
```

See the [how-to guides](../howto/index.md) for more details on how to customize the
environment and add more themes and extensions.
