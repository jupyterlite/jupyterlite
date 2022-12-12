# Accessing files and notebooks from a kernel

Starting with JupyterLite `0.1.0b9`, the contents of the user's _File Browser_ and some
kernels, including Pyolite, are automatically synchronized.

You can, for example, drag and drop a file `file.csv` into the JupyterLite UI, then load
it in Python:

```py
import pandas as pd

data = pd.read_csv('file.csv')

data
```

Synchronized content works by mounting a custom [Emscripten Filesystem][fs] (FS) which
communicates with the JupyterLite content manager through the JupyterLite
[`ServiceWorker`](../configure/advanced/service-worker.md)-enabled.

```{note}
The `ServiceWorker` will not always be enabled, based on
[limitations](../configure/advanced/service-worker.md#limitations) of both the
user's browser and the HTTP server.
```

## Verifying the Filesystem

To check if the filesystem syncing is enabled, see whether `cwd` starts with `/drive/`:

```py
import os

os.getcwd()  # If successful:  "/drive/path/to/notebook"
             # ... otherwise:  "/home/pyodide"
```

[emscripten-notebook]:
  https://github.com/jupyterlite/jupyterlite/blob/main/examples/pyolite/emscripten-filesystem.ipynb
[fs]: https://emscripten.org/docs/api_reference/Filesystem-API.html
[caniuse-sw]: https://caniuse.com/serviceworkers
