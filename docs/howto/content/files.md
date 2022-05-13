# Adding Content

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
[local storage drivers](#local-storage-drivers).

## Accessing local files with the `jupyterlab-filesystem-access` extension

The `jupyterlab-filesystem-access` extension allows accessing local files using the
(non-standard) Web Browser File System Access API.

The extension is available on [GitHub][filesystem-access-github] and published to
[PyPI][filesystem-access-pypi] . It is compatible with both JupyterLab and JupyterLite.

See the section below to learn how to add extensions to your deployment.

```{warning}
This extension is compatible with Chromium-based browsers only (for now).

See the [MDN][mdn] documentation for more information.
```

[mdn]: https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API
[filesystem-access-pypi]: https://pypi.org/project/jupyterlab-filesystem-access/
[filesystem-access-github]:
  https://github.com/jupyterlab-contrib/jupyterlab-filesystem-access
