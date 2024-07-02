# Accessing files and notebooks from a kernel

Starting with JupyterLite `0.1.0b9`, the contents of the user's _File Browser_ and some
kernels, including the Pyodide kernel, are automatically synchronized.

You can, for example, drag and drop a file `file.csv` into the JupyterLite UI, then load
it in Python:

```py
import pandas as pd

data = pd.read_csv('file.csv')

data
```

## How filesystem access works

Starting with JupyterLite 0.4.0, the contents of the user's _File Browser_ can be
exposed to the kernels with two different ways:

1. Synchronous communication with the kernel over `Atomics.wait` (via
   `SharedArrayBuffer`)
2. Via a Service Worker

### 1. Synchronous communication with the kernel over `Atomics.wait` (via `SharedArrayBuffer`)

By default, if the kernel supports it, synchronous communication via `SharedArrayBuffer`
will be used for accessing files from the kernels.

This approach should be more robust and help avoid most of the issues related to the
Service Worker and browser caching.

However they require setting proper HTTP headers when serving the JupyterLite
application:

- [Cross-Origin-Opener-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Opener-Policy)
- [Cross-Origin-Embedder-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Embedder-Policy)

These headers enable the use of `SharedArrayBuffer` in the browser, used by this
approach for exposing the file system contents.

As an example, you can start a local server with the following command to enable the
headers:

```
npx static-handler --cors --coop --coep --corp ./
```

```{tip}
See the various deployment guides in the [How-to section of the documentation](../index.md).
```

```{note}
File system access via `SharedArrayBuffer` is available with the following Python kernels:

- ✅ `jupyterlite-pyodide-kernel`
- ✅ `jupyterlite-xeus` with the Xeus Python kernel
```

### 2. Service Worker

If the `SharedArrayBuffer` are not available in the browser, JupyterLite will default
back to using the Service Worker (which was used by default until JupyterLite 0.4.0).

Synchronized content works by mounting a custom [Emscripten Filesystem][fs] (FS) which
communicates with the JupyterLite content manager through the JupyterLite
[`ServiceWorker`](../configure/advanced/service-worker.md)-enabled.

```{note}
The `ServiceWorker` will not always be enabled, based on
[limitations](../configure/advanced/service-worker.md#limitations) of both the
user's browser and the HTTP server.
```

```{warning}
If none of these two components are enabled, the kernel will not be able to access and manipulate files listed in the File Browser.
```

```{note}
File system access via the Service Worker is available with the following Python kernels:

- ✅ `jupyterlite-pyodide-kernel`
- ✅ `jupyterlite-xeus` with the Xeus Python kernel
```

## Verifying the Filesystem

To check if the filesystem syncing is enabled, see whether `cwd` starts with `/drive/`:

```py
import os

os.getcwd()  # If successful:  "/drive/path/to/notebook"
             # ... otherwise:  "/home/pyodide"
```

[fs]: https://emscripten.org/docs/api_reference/Filesystem-API.html
[caniuse-sw]: https://caniuse.com/serviceworkers

## Fetching remote content

It is also possible to fetch content from remote URL. For example if you are using the
Pyodide kernel, you can use the `fetch` function to do so:

```py
import pandas as pd
from js import fetch

URL = "https://raw.githubusercontent.com/jupyterlite/jupyterlite/main/examples/data/iris.csv"

res = await fetch(URL)
text = await res.text()

filename = 'data.csv'

with open(filename, 'w') as f:
    f.write(text)

data = pd.read_csv(filename, sep=',')
data
```

As an alternative, you can import the `pyodide-http` package (distributed with Pyodide
by default) to use familiar methods more seamlessly:

```py
import pyodide_http
import pandas as pd

pyodide_http.patch_all()

data = pd.read_csv("https://raw.githubusercontent.com/jupyterlite/jupyterlite/main/examples/data/iris.csv")
data
```
