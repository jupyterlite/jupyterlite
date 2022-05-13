# How to add additional extensions to a JupyterLite website

JupyterLite reuses the same system of _prebuilt_ extensions as in JupyterLab 3.0+.
Prebuilt extensions are also sometimes called _federated extensions_. In JupyterLab they
can be installed via `pip` and `conda` without rebuilding the whole JupyterLab
application.

All the applications shipped with JupyterLite by default are built with JupyterLab
components. This allows most of the existing third-party JupyterLab extensions to also
work with JupyterLite.

## Adding a new extension to a build

By default, JupyterLite looks

### Extensions with the CLI

#### Environment Extensions

When you run `jupyter lite build`, all pre-built extensions in your JupyterLab
environment, e.g. `{sys.prefix}/share/jupyter/labextensions` will be:

- copied to `{output-dir}/extensions`
- have its theme information copied to `{output-dir}/{app/?}theme/`

This discovery behavior can be disabled with the CLI flag `--ignore-sys-prefix` or
`LiteBuildConfig/ignore_sys_prefix`.

The `--ignore-sys-prefix` CLI flag will disable using components from the JupyterLab
environment for _all_ addons. This behavior can be configured in a more granular way on
a per-addon basis, for example:

```json
{
  "LiteBuildConfig": {
    "ignore_sys_prefix": ["federated_extensions"]
  }
}
```

#### Extensions for a Specific App

Similar to the above, by updating `$YOUR_JUPYTERLITE/{app}/jupyter-lite.json`, the
pre-built extensions will only be available for pages within that file tree.

#### Custom Extensions

By placing extensions under `{lite-dir}/extensions/{org/?}{package}/`, these will also
be copied into the `output-dir` _after_ any environment extensions, and all will be
added to `{output-dir}/jupyter-lite.json#jupyter-config-data/federated_extensions`.

```{hint}
For example, after building a lab extension, you can copy the contents of
`packages.json#/jupyterlab/outputDir` right into the `lite-dir` to preview your
extension.
```

Finally, the `--federated-extensions` CLI flag and the
`LiteBuildConfig/federated_extensions` config entry allow for adding additional
federated extensions, as packaged in Python `.whl` or conda `.tar.bz2` packages.

## The case of Jupyter Widgets

Some extensions like Jupyter Widgets also need a Python package to be installed at
runtime when working with a notebook. This is for example the case with `ipyleaflet` or
`bqplot`.

## How to know if an extension is compatible with JupyterLite?

A good starting point for extensions that _might_ work is the JupyterLab issue
_[Extension Compatibility with 3.0 (#9461)][#9461]_. Additionally, this site
demonstrates a few [extensions](#demo-extension-notes).

[#9461]: https://github.com/jupyterlab/jupyterlab/issues/9461
[pre-built extensions]: https://jupyterlab.readthedocs.io/en/stable/user/extensions.html
