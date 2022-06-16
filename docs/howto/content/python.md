# Accessing files and notebooks from the kernel

You can now access content from the Pyolite kernel.

You can for example drag and drop a file `file.csv` into the JupyterLite UI, then load
it in Python:

```py
import pandas as pd

data = pd.read_csv('file.csv')

data
```

The Pyolite kernel makes content available by mounting a custom Emscripten File-System
which communicates with the JupyterLite content manager through a service worker.

```{note}
This only works if your browser supports service workers, see https://caniuse.com/serviceworkers

There is a known issue that prevents service workers to work in Firefox private mode: https://bugzilla.mozilla.org/show_bug.cgi?id=1320796
```

An easy way to check if the Emscripten File-System mounting was a success, is to check
that the `cwd` starts with `"drive"`:

```py
import os

os.getcwd()  # Should return "/drive/path/to/notebook"
```

[emscripten-notebook]:
  https://github.com/jupyterlite/jupyterlite/blob/main/examples/pyolite/emscripten-filesystem.ipynb
