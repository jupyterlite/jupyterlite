# Customizing Settings

With the [CLI](../../reference/cli.ipynb), if you create an `overrides.json` in either
the root, or a specific `app` directory, these will be merged into
`{output-dir}/{app?}/jupyter-lite.json#/jupyter-config-data/settingsOverrides`

## Example

Let's say you would like to customize the behavior of the `REPL` app, and use the
terminal interaction mode.

You can create the following `overrides.json` file in
`{output-dir}/repl/jupyter-lite.json`:

```json
{
  "@jupyterlab/console-extension:tracker": {
    "interactionMode": "terminal"
  }
}
```

One of the effects of using `terminal` for the `interactionMode` will be the switch from
`Shift-Enter` to `Enter` for executing code.
