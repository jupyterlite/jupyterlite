# URL Parameters

A number of JupyterLite core features can be enabled or configured via URL GET
parameters of the form `?<param1>=<value1>&<param2>=<value2>`. Different applications
may support different parameters.

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

### `open-with`

> `?open-with={:viewer}`

Opens the files given with `path` with a viewer that is not their default viewer. The
value can be a widget factory name, a file type name or a file extension. For example,
`txt` opens the text editor, `json` opens the JSON viewer and `ipynb` opens the notebook
viewer. To write a space in a widget factory name, use `+` or `%20`, as in
`Markdown+Preview`. When the value matches no viewer, the files open in their default
viewer.

| multiple | examples                                                                           |
| -------- | ---------------------------------------------------------------------------------- |
| no       | `https://jupyterlite.github.io/demo/lab/index.html?path=intro.ipynb&open-with=txt` |

### `mode`

> `?mode={:mode}`

Use a different UI mode. `mode` can be one of `single-document` or `multiple-document`
(default).

| multiple | examples                                                                 |
| -------- | ------------------------------------------------------------------------ |
| no       | `https://jupyterlite.github.io/demo/lab/index.html?mode=single-document` |

The `doc` page is a shortcut to the `single-document` mode, also known as the _Simple
Interface_. It redirects to the `lab` page with `mode=single-document` and keeps the
other parameters, such as `path`.

| examples                                                           |
| ------------------------------------------------------------------ |
| `https://jupyterlite.github.io/demo/doc/index.html`                |
| `https://jupyterlite.github.io/demo/doc/index.html?path=README.md` |

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

Accepts no value.

| multiple | examples                                                  |
| -------- | --------------------------------------------------------- |
| no       | `https://jupyterlite.github.io/demo/lab/index.html?reset` |

## Jupyter Notebook Features

The `tree`, `notebooks` and `edit` pages of the Jupyter Notebook interface support the
`path` parameter to open a single folder or document.

### `path`

> `?path={:path}`

- `tree/index.html?path={:path}` opens the file browser in the given folder, or
  redirects to the `notebooks` or `edit` page if the path is a file.
- `notebooks/index.html?path={:path}` opens the given notebook.
- `edit/index.html?path={:path}` opens the given file in the text editor.

Without a `path`, the `notebooks` and `edit` pages redirect to the file browser
(`tree`). If the path is a folder, they redirect to the file browser opened in that
folder. If the path does not exist, a dialog says so and offers to open the file
browser.

The file browser also updates `?path=` when navigating to a folder, so the URL can be
bookmarked or shared.

| multiple | examples                                                                    |
| -------- | --------------------------------------------------------------------------- |
| no       | `https://jupyterlite.github.io/demo/notebooks/index.html?path=python.ipynb` |

### `open-with`

> `?open-with={:viewer}`

Opens the file given with `path` with a viewer that is not its default viewer, with the
same values as the [`open-with` parameter of JupyterLab](#open-with). The page redirects
to the `notebooks` page for a notebook viewer, and to the `edit` page for other viewers.

Older versions used the `factory` parameter instead, with the exact name of a widget
factory. Links with `factory` still work. When a URL has both parameters, `factory` has
priority.

| multiple | examples                                                                             |
| -------- | ------------------------------------------------------------------------------------ |
| no       | `https://jupyterlite.github.io/demo/tree/index.html?path=intro.ipynb&open-with=json` |

## REPL Features

As the primary configuration tool, these are handled more thoroughly in the
[REPL quickstart guide](../../quickstart/embed-repl.md)
