# URL Parameters

A number of JupyterLite core features can be enabled or configured via URL GET
parameters, given of the form `?<param1>=<value1>&<param2>=<value2>`. Different
applications may have interpret features.

```{hint}
Check out the [Quick Start Guide](../../quickstart/deploy.md) to learn how to deploy your own JupyterLite website
and have full control on the environment and extensions installed.

The snippets below use the public facing [jupyterlite.github.io/demo](https://jupyterlite.github.io/demo) as an example.
```

## JupyterLab-only Features

### `path`

> `?path={:path}`

Opens a file, files, or folder.

When given multiple times, the documents will split the screen, left to right.

If one or more folders are given, the last folder will be opened in the file tree.

| multiple | examples                                                                             |
| -------- | ------------------------------------------------------------------------------------ |
| yes      | `https://jupyterlite.github.io/demo/lab/index.html?path=README.md&path=python.ipynb` |

```{hint}
Learn more about [content](../content/files.md).
```

### `mode`

> `?mode={:mode}`

Use a different UI mode. `mode` can be one of `single-document` or `multiple-document`
(default).

| multiple | examples                                                                 |
| -------- | ------------------------------------------------------------------------ |
| no       | `https://jupyterlite.github.io/demo/lab/index.html?mode=single-document` |

### `workspace`

> `?workspace={:workspace-id}`

Use a Workspace. `workspace-id` is the name of the workspace file, without the
`.jupyterlab-workspace` extension.

| multiple | examples                                                              |
| -------- | --------------------------------------------------------------------- |
| no       | `https://jupyterlite.github.io/demo/lab/index.html?workspace=default` |

```{hint}
Learn more about [workspaces](./workspaces.md).
```

### `reset`

> `reset`

Resets the current workspace to:

- expanded left sidebar
- a _Launcher_ in the main area
- collapsed right sidebar

Accept no parameters.

| multiple | examples                                                  |
| -------- | --------------------------------------------------------- |
| no       | `https://jupyterlite.github.io/demo/lab/index.html?reset` |

## REPL Features

As the primary configuration tool, these are handled more thoroughly in the
[REPL quickstart guide](../../quickstart/embed-repl.md)
