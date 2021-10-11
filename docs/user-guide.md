# User Guide

## Contents

```{toctree}
:maxdepth: 2

kernels/index
rtc/index
translation/index
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

### How can I share a link to a file?

If you are using the JupyterLab interface, right click on the file in the file browser
and select `Copy Shareable Link`:

![share-link-file-browser](https://user-images.githubusercontent.com/591645/136811238-e4a021ef-1dbf-4cda-b38d-c0f83ec8082e.png)

If you are using the RetroLab interface, you can simply copy the URL as is:

![image](https://user-images.githubusercontent.com/591645/136811563-db16c258-d1b0-4771-b3be-5e72853dba5e.png)

If you are using [Real Time Collaboration](./rtc/index.md) features, the name of the
room will also be encoded in the URL:

![share-link-rtc](https://user-images.githubusercontent.com/591645/136810834-14bb906b-1cc9-4eae-8b4b-d5d39068ce15.gif)
