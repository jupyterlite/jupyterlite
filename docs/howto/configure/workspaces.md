# Workspaces

JupyterLab workspaces store the current state of the application between browser
reloads. This allows restarting work right where you left off. In JupyterLite, these are
[stored in the browser](#customizing-workspace-storage), or can use
[`.jupyterlab-workspace` files](#workspace-files). s

## Overloading the `default` Workspace

By default, a `default` workspace will be loaded. Adding a
`<lite_dir>/workspaces/default.jupyterlab-workspace` will use this one by default, with
any user changes being saved in browser storage.

Adding more workspaces allows for different techniques for loading, and can be used to
link to different confections of files.

## Workspace Files

Workspaces are JSON files with a specific [format][workspaces-file-format].

These can be extracted from a running JupyterLab or JupyterLite site, and customized as
needed.

[workspaces-file-format]:
  https://jupyterlab.readthedocs.io/en/stable/user/urls.html#workspace-file-format

### Getting Workspace Files from JupyterLite

- Open a JupyterLite application
- Open various main area activities and sidebars
- Use the JupyterLab Command _Save Current Workspace_
  - Optionally use _Save Current Workspace As..._ to provide a filename
- See the `.jupyterlab-workspace` file

At this point, the workspace is ready to be used either by double-clicking in the UI or
downloading and using as part of a future `jupyter lab build`.

### Adding a Workspace to a built JupyterLite site

- Copy the file to `<lite_dir>/workspaces/<workspace-id>.jupyterlab-workspace`
- Run `jupyter lab build`

Now, when the application is opened, the workspace will be available to use in URLs.

If not otherwise configured, the `default` workspace will be used: the default can be
overridden by setting `jupyter-lite.json#jupyter-config-data/workspace` to the id of the
Workspace, and making that workspace available during `jupyter lite build`.

## Workspace URLs

### Opening a Workspace File from Contents

By including workspace files as [contents](../content/files.md), the
`?path=<workspace-id>.jupyterlab-workspace` URL parameter can be used to link directly
to a workspace.

This is useful for debugging a customized workspace file, but will cause an extra page
reload.

### Opening a custom Workspace

Adding `?workspace=<workspace-id>` to an existing workspace will use that one for that
browser session.

### Resetting the Workspace

Adding a `?reset` to a JupyterLite URL will reset the workspace.

## Limitations of JupyterLite Workspaces

Some workspace features are driven by features that don't work in JupyterLite. For
example, opening a _Notebook_ with a kernel shared _Console_ won't work correctly when
the page reloads, as these rely on stable kernel ids on the server.

## Disabling Workspaces

Workspaces can be disabled with in
`jupyter-lite.json#jupyter-config-data/disabledExtensions`.

```json
{
  "jupyter-lite-schema-version": 0,
  "jupyter-config-data": {
    "disabledExtensions": ["@jupyterlab/apputils-extension:workspaces"]
  }
}
```

## Customizing Workspace Storage

By default, all of a user's workspaces on the same domain will be available to all
JupyterLite instances hosted there. To create separate content stores, change the
`jupyter-lite.json#jupyter-config-data/workspaceStorageName` from the default of
`JupyterLite Storage`.

By default, the best available, persistent storage driver will be used. One may force a
particular set of drivers to try with
`jupyter-lite.json#jupyter-config-data/workspaceStorageDrivers`. See more about
[local storage drivers](../configure/storage.md#local-storage-drivers).
