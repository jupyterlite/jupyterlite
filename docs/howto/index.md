# How-To Guides

```{note}
This set of how-to guides is geared towards creating and configuring a custom JupyterLite website at *build time*.

To learn more about using an already deployed JupyterLite website, check out the [Quickstart Guide](../quickstart/using.md).
More how-to guides on using and configuring an existing JupyterLite website at *runtime*
(focused on accessing content, working with settings) will soon be added.
```

## Configuring a JupyterLite deployment

A JupyterLite website can be configured in many ways, and reuse many of the existing
tools and extensions from the Jupyter ecosystem.

```{toctree}
:maxdepth: 1

configure/simple_extensions
configure/storage
configure/settings
configure/translation
configure/rtc
configure/latex
```

## Contents

```{toctree}
:maxdepth: 1

content/files
content/python
content/filesystem-access
content/share
```

## Configuring the Python environment

```{toctree}
:maxdepth: 1

python/packages
python/wheels
python/pyodide
```

## Deploying

```{toctree}
:maxdepth: 1

../quickstart/deploy
deployment/sphinx
deployment/vercel-netlify
deployment/gitlab
deployment/binder
```

## Extensions

JupyterLite uses the same extension system as in JupyterLab, and can be extended to add
more features and plugins, such as frontend extensions and new kernels.

```{toctree}
:maxdepth: 1

extensions/frontend
extensions/server
extensions/kernel
extensions/cli-addons
```

## Advanced configuration

```{toctree}
:maxdepth: 1

configure/advanced/optimizations
configure/advanced/offline
configure/advanced/extensions
configure/advanced/service-worker
configure/advanced/hard
```
