# Configuring `jupyter_lite_config.json`, `jupyter-lite.json` and `overrides.json`

JupyterLite can be configured via a set of well-known files:

- `jupyter_lite_config.json` - for build time configuration, typically when running
  `jupyter lite build`
- `jupyter-lite.json` - for runtime configuration, typically when loading the page
- `overrides.json` - for overriding the plugins and extension settings at runtime when
  opening JupyterLite in a browser

## `jupyter_lite_config.json`

The `jupyter_lite_config.json` file is used to configure the build time configuration of
JupyterLite. It is a JSON file that can contain several keys at the top level for
configuring the main build process, but also extra CLI addons.

It is commonly used the configure common build settings such as the output directory or
the contents folder.

Here is an example of a `jupyter_lite_config.json` to configure the `contents` and
`outputDir`:

```json
{
  "LiteBuildConfig": {
    "contents": ["notebooks"],
    "output_dir": "dist"
  }
}
```

You can refer to some of the guides to learn more about the configuration options:

- [](../content/files.md)
- [](./advanced/offline.md)

```{note}

Check out the [CLI reference](../../reference/cli.ipynb) for a more complete list of build time configuration options
```

## `jupyter-lite.json`

The `jupyter-lite.json` file is used to configure the runtime configuration of
JupyterLite.

For example it can be used to configure the `appName` of the JupyterLite application or
the list of `disabledExtensions`.

Here is an example of a `jupyter-lite.json`:

```json
{
  "jupyter-lite-schema-version": 0,
  "jupyter-config-data": {
    "appName": "My JupyterLite App",
    "disabledExtensions": ["@jupyterlab/application-extension:logo"]
  }
}
```

You can refer to some of the guides to learn more about the configuration options:

- [](../configure/advanced/extensions.md)
- [](../configure/storage.md)

```{note}
JupyterLite offers a few more ways to provide runtime configuration. Check out [](../../reference/config.md) for more details.
```

```{note}
Check out the [](../../reference/schema.md) for a complete list of the available configuration options.
```

## `overrides.json`

The `overrides.json` file is used to override the plugins and extension settings of
JupyterLite.

For example it can be used to override the default theme when users launch JupyterLite.
The content of the file then be:

```json
{
  "@jupyterlab/apputils-extension:themes": {
    "theme": "JupyterLab Dark"
  }
}
```

It can be used to override other plugins and extensions that are part of the JupyterLite
main application, but also third-party extensions.

You can refer to the following guides to see more examples:

- [](../configure/settings.md)
