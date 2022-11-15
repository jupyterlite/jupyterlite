# Adding content: notebook, files and static assets

## Content with the CLI

With the [CLI](../../reference/cli.ipynb) installed, run:

```bash
jupyter lite build
```

Any contents found in:

- `{lite-dir}/files/`
- any _content roots_ added via:
  - the CLI flag `--contents`
  - the `#/LiteBuildConfig/contents` in `jupyter_lite_config.json`

Will be:

- copied to the built site under `{output-dir}/files/`
  - may have timestamps changed if `--source-date-epoch` is provided.
- indexed to provide `{output-dir}/api/contents/{subdir?}/all.json`

```{note}
If no contents are provided when building the JupyterLite website,
the following error message might be logged in the browser console and can be safely ignored:

    Failed to load resource: the server responded with a status of 404 (File not found) :8000/api/contents/all.json:1

```

## Server Contents and Local Contents

When a user changes a server-hosted file, a copy will be made to the browser's storage,
usually in `IndexedDB`. A user's locally-modified copy will take precedence over any
server contents, even if the server contents are newer.

## Customizing Content Storage

By default, all of a user's contents on the same domain will be available to all
JupyterLite instances hosted there. To create separate content stores, change the
`jupyter-lite.json#jupyter-config-data/contentsStorageName` from the default of
`JupyterLite Storage`.

By default, the best available, persistent storage driver will be used. One may force a
particular set of drivers to try with
`jupyter-lite.json#jupyter-config-data/contentsStorageDrivers`. See more about
[local storage drivers](../configure/storage.md).

## Customizing MIME types

[MIME types](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types)
drive a great number of JupyterLab's (and therefore JupyterLite's) features. When
uploaded as pre-indexed contents, the build process will usually detect MIME types
correctly.

In the browser, things are a bit trickier: a number of well-known file types (included
everything needed to serve a core JupyterLite site) will be automatically detected when
they are uploaded, but some customization might be required.

The default file types, and any configured via `#/LiteBuildConfig/extra_file_types` will
be merged with the default types into `jupyter-lite.json#jupyter-config-data/fileTypes`,
and these will be used.

```{note}
These will not impact how the JupyterLite UI actually displays files: these are
provided by
[MIME renderer plugins][mime-docs], such as those listed on [PyPI][mime-pypi]

[mime-docs]: https://jupyterlab.readthedocs.io/en/stable/extension/extension_dev.html#mime-renderer-plugins
[mime-pypi]: https://pypi.org/search/?q=&o=&c=Framework+%3A%3A+Jupyter+%3A%3A+JupyterLab+%3A%3A+Extensions+%3A%3A+Mime+Renderers
```

For example, to ensure the `.fasta` file format is served correctly as `text/plain`:
`jupyter_lite_config.json`:

```json
{
  "LiteBuildConfig": {
    "extra_file_types": {
      "fasta": {
        "name": "fasta",
        "extensions": [".fasta"],
        "mimetypes": ["text/plain"],
        "fileFormat": "text"
      }
    }
  }
}
```

## Hidden Files

Files and directories that start with `.` are considered
[hidden](https://jupyterlab.readthedocs.io/en/stable/user/files.html#displaying-hidden-files),
and by default will not be

- indexed by the `jupyter_server.ContentsManager` which handles building Jupyter
  Contents API responses
- displayed in the _File Browser_

To **ignore** these files entirely from being copied or indexed, provide the following
for e.g. files in the `.binder`.

```json
{
  "LiteBuildConfig": {
    "extra_ignore_contents": ["/\\.binder/"]
  }
}
```

To **include** these files in the output, add the following to
`jupyter_lite_config.json`:

```json
{
  "ContentsManager": {
    "allow_hidden": true
  }
}
```

```{note}
If _included_, users will be able to open these files directly:
- clicking links to the file in files that are not hidden
- via the _Open from Path..._ JupyterLab command
- from within kernels that support unified contents like the default [python kernel](./python.md)
- from within [collaborative editing](../configure/rtc.md) sessions
```

### Showing Hidden Files

To make hidden files visible by default in the file browser, add the following to
`overrides.json`:

```json
{
  "@jupyterlab/filebrowser-extension:browser": {
    "showHiddenFiles": true
  }
}
```
