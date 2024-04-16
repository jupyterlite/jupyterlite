# Troubleshooting

## Not able to access files from the kernel

JupyterLite lets you access files displayed in the file browser from within the kernel.

However in some cases you might see some errors such as the following:

```
FileNotFoundError: [Errno 44] No such file or directory: 'data/iris.csv'
```

![a screenshot showing an error while trying to access a local file from the kernel](https://github.com/jupyterlite/jupyterlite/assets/591645/3edffdc3-77ef-45fe-8a4a-8cd7147dd235)

This seems to happen when code is executed before a kernel is fully ready. See
[issue #1371 ](https://github.com/jupyterlite/jupyterlite/issues/1371). If this
regularly happens, please try to wait until the kernel indicator is ready before
starting to execute code.

JupyterLite uses a [Service Worker](./howto/configure/advanced/service-worker.md) to
allow accessing files from a kernel. But in some cases the Service Worker may fail to
register, which results in an error displayed in the dev tools console:

![image](https://github.com/jupyterlite/jupyterlite/assets/591645/9e6de7b6-a564-4e71-9273-d0f0cb6becf8)

To fix this issue, you can try the following:

- Use a different browser. Currently we support the latest Chrome and Firefox versions.
  However it is known that Service Workers are not supported in Firefox private windows.
- Clear the browser cache. This can help purge older versions of the Service Worker that
  might still be registered, for example after a JupyterLite version update.

See the [Contents](./reference/contents.md) documentation for more information.
