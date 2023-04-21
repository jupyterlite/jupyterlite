# Customizing Settings

With the [CLI](../../reference/cli.ipynb), if you create an `{lite-dir}/overrides.json`
in either the root, or a specific `{lite-dir}/{app}/` directory, these will be merged
into `{output-dir}/{app?/}jupyter-lite.json#/jupyter-config-data/settingsOverrides`.

## Examples

### Customize the `REPL` app

Let's say you would like to customize the behavior of the `REPL` app, and use the
terminal interaction mode.

You can create the following `overrides.json` in `{lite-dir}/repl/` before building:

```json
{
  "@jupyterlab/console-extension:tracker": {
    "interactionMode": "terminal"
  }
}
```

One of the effects of using `terminal` for the `interactionMode` will be the switch from
<kbd>Shift-Enter</kbd> to <kbd>Enter</kbd> for executing code.

### Add a download button in the notebook menu bar

If you want to add a download button in the notebook menu bar, you can add the following
lines in `overrides.json`:

```json
{
  "@jupyterlab/notebook-extension:panel": {
    "toolbar": [
      {
        "name": "download",
        "label": "Download",
        "args": {},
        "command": "docmanager:download",
        "icon": "ui-components:download",
        "rank": 50
      }
    ]
  }
}
```

You will now have a menu bar similar to the one below:

![notebook-menu-bar-download-button](https://user-images.githubusercontent.com/733861/231521636-35d5a1c8-c80d-4d76-800e-426948cbc011.png)
