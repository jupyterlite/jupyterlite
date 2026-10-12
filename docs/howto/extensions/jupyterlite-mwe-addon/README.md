# Minimal working example of addon for JupyterLite

A addon is a Python package.

## Usage with `pixi`

```bash
pixi run jupyter lite status --debug
```

and the output should include

```
.  status:jupyterlite_mwe_addon:minimal-working-example
[LiteStatusApp] Hello Lite!
Namaste!
```

## Usage with `pip`

```bash
python3 -m pip install .
jupyter lite status --debug
```

and the output should include

```
.  status:jupyterlite_mwe_addon:minimal-working-example
[LiteStatusApp] Hello Lite!
Namaste!
```