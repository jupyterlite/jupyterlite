# Configure a JupyterLite site

Once you have initialized a JupyterLite site, configuration changes can be made by
either adding or editing configutation files in the
[Lite Dir](../reference/cli.ipynb#the-lite-dir).

Configuration values are set in one or more of the
[Runtime Configuration Files](../reference/config.md) in
[well known locations in the Lite Dir](../reference/cli.ipynb#the-lite-dir).
Configuration information is merged in a cascade, allowing settings to be set in the
root of the [Lite Dir](../reference/cli.ipynb#the-lite-dir), and superceeded by settings
for an individual app such as `retro` and `lab`.

Available options are defined in the Jupyter Config Data
[Schema](../reference/schema-v0.md) and include settings such as `appName`,
`appVersion`, `settingsOverrides`, `exposeAppInBrowser`.

## Overrides

In addition to the [Runtime Configuration Files](../reference/config.md) additional
`overrides.json` files can be created as described in
[Customizing Settings](../howto/configure/settings.md). These override specific
`@jupyterlab` settings, are merged into the `settingsOverrides` of the jupyter config.
