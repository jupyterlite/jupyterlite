# Accessing files and notebooks from the kernel

Accessing contents like other files and notebooks from a kernel might be tricky.

Currently the content visible by the end user is a mix of server provided files, and
files saved locally in the web browser. This means that trying to access a server
provided files from Python with paradigms like `open('data.csv')` will most likely fail.

A common workaround for the Python kernel is be to manually fetch a file from a remote
URL with the `fetch` method from the browser before manipulating its content:

```py
import pandas as pd
from js import fetch

URL = "https://yourdomain.com/path/to/file.csv"

res = await fetch(URL)
text = await res.text()

filename = 'data.csv'

with open(filename, 'w') as f:
    f.write(text)

data = pd.read_csv(filename, sep=';')
data
```

```{note}
See the following issues and discussions for more information:

- [#91](https://github.com/jupyterlite/jupyterlite/discussions/91)
- [#119](https://github.com/jupyterlite/jupyterlite/issues/119)

It is also possible to manipulate the data stored in `IndexedDB` from Python, but it can be pretty involved.
See the [example notebook][emscripten-notebook] for more details.
```

[emscripten-notebook]:
  https://github.com/jupyterlite/jupyterlite/blob/main/examples/pyolite/emscripten-filesystem.ipynb
