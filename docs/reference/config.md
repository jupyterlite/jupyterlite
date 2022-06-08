# Runtime Configuration Files

The behavior JupyterLite in the browser can be controlled by creating specially-named
files at any level of the file tree. It is expected each file conforms to the
[schema](./schema.md). For an example, see the [demo configuration](./demo.md).

| File                 | Config Location              | `jupyter-config-data` | Note                                            |
| -------------------- | ---------------------------- | --------------------- | ----------------------------------------------- |
| `jupyter-lite.ipynb` | `#/metadata/jupyter-lite`    | ✔️                    | integrates into existing Jupyter workflows      |
| `jupyter-lite.json`  | whole file                   | ✔️                    | good for simple/automated configuration         |
| `index.html`         | `script#jupyter-config-data` | ✔️                    | configuration of last resort, _not recommended_ |

Each can be omitted from the file tree, and will result in a harmless (though noisy)
`404` response.

```{hint}
Configuration cascades _down_, such that the closest, most-user-editable file
to the `index.html` being served takes highest precedence. Like-named keys will
be _replaced_  by higher-priority files, with the notable exceptions of:

- the `federated_extensions` and `disabledExtensions` lists are appended and
  deduplicated
- the `settingsOverrides` dictionary will be merged at the top level of each plugin
```
