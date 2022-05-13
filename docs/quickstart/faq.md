# Frequently-Asked Questions

## How can I put my own content in JupyterLite?

See the [corresponding guide](../howto/content/files.md): it can get pretty involved!

## How can I read content from Python?

Accessing contents like other files and notebooks from a kernel might be tricky.

Currently the content visible by the end user is a mix of server provided files, and
files saved locally in the web browser. This means that trying to access a server
provided files from Python with paradigms like `open('data.csv')` will most likely fail.

A common workaround is be to manually fetch a file from a remote URL with the `fetch`
method from the browser before manipulating its content:

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

### How can I share a link to a file?

If you are using the JupyterLab interface, right click on the file in the file browser
and select `Copy Shareable Link`:

![share-link-file-browser](https://user-images.githubusercontent.com/591645/136811238-e4a021ef-1dbf-4cda-b38d-c0f83ec8082e.png)

If you are using the RetroLab interface, you can simply copy the URL as is:

![image](https://user-images.githubusercontent.com/591645/136811563-db16c258-d1b0-4771-b3be-5e72853dba5e.png)

If you are using [Real Time Collaboration](../howto/configure/rtc.md) features, the name
of the room will also be encoded in the URL:

![share-link-rtc](https://user-images.githubusercontent.com/591645/136810834-14bb906b-1cc9-4eae-8b4b-d5d39068ce15.gif)
