<ul class="demo-links">
  <li>
    <label>
      <i class="fa-solid fa-external-link"></i>
      <i>Open demo in a new tab</i>
    </label>
  </li>
  <li>
    <a href="./_static/lab/index.html?path=intro.ipynb" target="_blank" title="try JupyterLab, a multi-document app">
      <i class="fa-solid fa-flask"></i>
      JupyterLab
    </a>
  </li>
  <li>
    <a href="./_static/notebooks/index.html?path=intro.ipynb" target="_blank" title="try RetroLab, a single-document app">
      <i class="fa-solid fa-book"></i>
      Jupyter Notebook
    </a>
  </li>
  <li>
    <a href="./_static/repl/index.html?toolbar=1&kernel=python&code=import%20this" target="_blank" title="try REPL, the minimal console app">
      <i class="fa-solid fa-terminal"></i>
      REPL
    </a>
  </li>
</ul>

<style>
  .demo-links {
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: row;
    list-style: none;
  }
  .demo-links li {
    list-style: none;
    flex: 0;
    text-align: right;
    white-space: nowrap;
    margin: 0 1em 0 1em;
  }
  .demo-links li:first-child {
    flex: 1;
  }
</style>

```{include} ../README.md

```

## Documentation Contents

```{toctree}
:maxdepth: 2

quickstart/index
howto/index
reference/index
troubleshooting
migration
contributing
changelog
```
