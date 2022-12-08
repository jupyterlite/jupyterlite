# ServiceWorker

By default, JupyterLite tries to launch a [ServiceWorker][sw].

If available, this enables a number of useful features:

- [synced content](../../content/python.md) between browser storage and kernels
- a robust, offline-capable cache, such as for [packages](../../python/wheels.md)

## Limitations

A `ServiceWorker` will only be created and used if all of the following are true:

- the extension has not been [disabled](extensions.md#disabling-extensions-at-runtime)
- the user's current browser session supports the `ServiceWorker` API
  - see [supported browsers][caniuse-sw]
  - _Private Browsing_ in Firefox is [**known** to not work][ff-private-bug]
- the HTTP server's URL starts with one of:
  - `https://`
  - `http://127.0.0.1:{*}/` (any port)
  - `http://localhost:{*}/` (any port)

[sw]: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorker
[ff-private-bug]: https://bugzilla.mozilla.org/show_bug.cgi?id=1320796
