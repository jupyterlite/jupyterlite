# Making content read-only

By default, when a user opens a notebook or file served by JupyterLite, they can edit
and save it. The saved copy is stored in the browser's local storage (usually IndexedDB)
and will take precedence over the server-hosted version on subsequent visits, even if
the server content has been updated.

If certain files are not intended for editing (e.g. reference notebooks, example data
files), this can be confusing — a user would have to manually delete their local copy to
get back to the original version.

You can mark files as **read-only** so they are never saved to local storage. When
read-only files are opened, the Save button is disabled and they always reflect the
original content provided at build time.

## How it works

During the build (`jupyter lite build`), JupyterLite uses
[`jupyter_server`'s `FileContentsManager`](https://jupyter-server.readthedocs.io/en/latest/developers/contents.html)
to generate the Contents API responses (`api/contents/*/all.json`). The
`FileContentsManager` checks each file's write permissions using
`os.access(path, os.W_OK)`, and sets the `writable` field in the JSON output
accordingly.

When the browser loads the contents, JupyterLab reads the `writable` flag from the
Contents API response and disables editing features for files marked as non-writable.

## Making files read-only before building

To make specific files read-only, remove the write permission on the source files
**before** running `jupyter lite build`. The build system preserves file permissions, so
the read-only flag will propagate to the generated API responses.

### Single files

```bash
# Make a specific notebook read-only
chmod -w files/example.ipynb

# Or equivalently, remove write for all users
chmod a-w files/my-data.csv

# Then build
jupyter lite build
```

### All files in a directory

```bash
# Make all files in a directory read-only (recursively)
chmod -R a-w files/reference-notebooks/

# Then build
jupyter lite build
```

### Mixing read-only and editable content

You can selectively mark only some files as read-only while keeping others editable:

```bash
# Start with all files editable (default)
# Then mark specific ones as read-only
chmod -w files/instructions.ipynb
chmod -w files/reference-data.csv

# Keep other files editable (no changes needed)
# files/workspace.ipynb  — stays editable
# files/scratch.py       — stays editable

jupyter lite build
```

## Verifying the result

After building, you can inspect the generated Contents API responses to confirm that
files are marked as non-writable. For example:

```bash
# Check a specific directory listing
cat _output/api/contents/all.json | python -m json.tool | grep -A2 '"name"'
```

In the JSON output, read-only files will have `"writable": false`:

```json
{
  "name": "example.ipynb",
  "path": "example.ipynb",
  "type": "notebook",
  "writable": false
}
```

## Limitations

- **"Save As" still works**: While the Save button is disabled for read-only files,
  users can still use "Save As" (or "Save Notebook As") to save a copy under a different
  name. This is by design — it allows users to create their own editable copies of
  read-only content.
- **Applies at build time only**: The read-only flag is determined when
  `jupyter lite build` runs. You cannot change it at runtime.
- **File permissions must be set before building**: Since the build copies files with
  `shutil.copy2` (which preserves permissions), the source files need their permissions
  set correctly before running the build.
