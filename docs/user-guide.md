# User Guide

## Contents

```{toctree}
:maxdepth: 2

kernels/index
```

## Frequently-Asked Questions

### How is JupyterLite different than JupyterLab?

If you're using a JupyterLite site, there isn't much to know. It works like a regular,
server-backed JupyterLab site, except:

- The list of [kernels](./kernels/index.md), usually visible from the _Launcher_ as
  different _Notebook_ flavors, will be different
- Your data is written to in-browser storage
  - though you may be able to copy
- None of your data leaves your browser unless...
  - Extensions are installed and enabled
  - Your _Notebooks_ include code that uses the browser's `fetch` mechanism

### How can I put my own content in JupyterLite?

See the [developer guide](./developer-guide.md): it can get pretty involved!
