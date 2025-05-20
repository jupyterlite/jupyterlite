# Showing a Loading Indicator

JupyterLite includes a loading indicator that appears during the initial loading of the
application. This loading indicator helps users understand that the application is still
loading, especially on slower connections.

[a screenshot of the loading indicator](../../changelog_assets/0.6-jupyterlite-loading-indicator.png)

## Default Behavior

By default, the loading indicator is:

- Visible in JupyterLab application
- Hidden in Jupyter Notebook and REPL applications

## Enable or Disable the Loading Indicator

You can configure whether the loading indicator appears by setting the
`showLoadingIndicator` option in your JupyterLite configuration.

### Using jupyter-lite.json

To configure the loading indicator for all applications, create or edit a
`jupyter-lite.json` file in the root of your JupyterLite deployment:

```json
{
  "jupyter-lite-schema-version": 0,
  "jupyter-config-data": {
    "showLoadingIndicator": true
  }
}
```

Setting `"showLoadingIndicator": false` will hide the loading indicator for all
applications.

### App-Specific Configuration

You can also configure the loading indicator for specific applications by placing the
configuration file in the respective application directory:

- For JupyterLab: `lab/jupyter-lite.json`
- For Jupyter Notebook:
  - `tree/jupyter-lite.json`
  - `notebooks/jupyter-lite.json`
  - `edit/jupyter-lite.json`
  - `consoles/jupyter-lite.json`
- For REPL: `repl/jupyter-lite.json`

For example, to enable the loading indicator for the REPL interface only, create a file
at `repl/jupyter-lite.json` with:

```json
{
  "jupyter-lite-schema-version": 0,
  "jupyter-config-data": {
    "showLoadingIndicator": true
  }
}
```
