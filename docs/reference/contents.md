# Contents

This section describes how contents is integrated on a JupyterLite site and how it is
used.

## Access within the kernel

By default, contents accessible via the default filebrowser is independent of the
contents accessible within an execution kernel. Making the files available to the kernel
may depend on how kernels are implemented.

### Emscripten kernel

Kernels using Emscripten (like [pyodide](https://github.com/jupyterlite/pyodide-kernel/)
or [xeus kernels](https://github.com/jupyterlite/xeus/)) relies on the
[Emscripten filesystem](https://emscripten.org/docs/api_reference/Filesystem-API.html)
to access their contents. For such case, `@jupyterlite/services` provides a
[`DriveFS`](https://jupyterlite.readthedocs.io/en/stable/reference/api/ts/@jupyterlite/services/classes/DriveFS.html)
helper class which can be used to mount files in the Emscripten filesystem:

```ts
  const mountpoint = '/drive';
  const { FS, PATH, ERRNO_CODES } = /* provided by the emscripten module */;
  const { baseUrl } = options;
  const { DriveFS } = await import('@jupyterlite/services');

  const driveFS = new DriveFS({
    FS,
    PATH,
    ERRNO_CODES,
    baseUrl, // Website base URL
    driveName: 'my-drive', // Any name of your choosing
    mountpoint,
  });
  FS.mkdir(mountpoint);
  FS.mount(driveFS, {}, mountpoint);
  FS.chdir(mountpoint);
```

After mounting the drive, the Jupyter Server contents (the one displayed in the
filebrowser) will be available within the kernel under the folder `/drive`.

The website base URL is required for the `DriveFS` to request its content from the main
application. Diving into the drive architecture will clarify that.

```{mermaid}
flowchart LR
    subgraph main thread
        direction TB
        M[Main thread]
        M --- C[Contents]
    end
    subgraph webworker
        direction TB
        M -.- K[Kernel]
        K --- FS[Emscripten FS]
        FS --- D[DriveFS]
    end
    S[Service worker] -.-|BroadcastChannel| M
    D -.-|REST API| S
```

Three threads are at play when running a kernel inside JupyterLite:

- The main thread: it executes the main user interface and knows about the filebrowser
  contents.
- The kernel web worker: it executes the kernel (e.g. evaluate the code snippet from a
  notebook sent by the main thread). It mounts a `DriveFS` into the Emscripten
  filesystem.
- The service worker: it serves website assets from cache (to work offline). And it can
  also capture any other network requests.

Assuming the kernel executes the following python snippet code writing into a text file:

```py
Path("dummy.txt").write_text("Writing on Emscripten filesystem")
```

Here is a simplification sequence of interaction happening to perform the filesystem
operation:

```{mermaid}
sequenceDiagram
  participant P as Python interpreter
  participant F as Emscripten FS
  participant D as DriveFS
  participant S as Service Worker
  participant M as Main thread
  participant C as Contents manager

  P->>+F: Write text into file
  F->>+D: Call put
  D->>+S: Send HTTP POST /api/drive
  S->>+M: Broadcast message via channel
  M->>+C: Call `save`
  C-->>-M: None
  M-->>-S: Response
  S-->>-D: Response
  D-->>-F: Return
  F-->>-P: Done
```

When the code interacts with the filesystem, it interacts with the
[Emscripten virtual filesystem](https://emscripten.org/docs/porting/files/file_systems_overview.html).
This virtual filesystem allows classical code (like the Python snippet in this example)
to run with little or no changes. Moreover, the virtual filesystem enables developers to
provide their own mechanisms for handling filesystem I/O through a
[filesystem API](https://emscripten.org/docs/api_reference/Filesystem-API.html#filesystem-api).
In the sequence diagram, we simplify the API interaction to a single `put` operation (in
reality, multiple calls happen when writing a file). As we've plugged in a custom drive
implementation `DriveFS`, the put resolution becomes the responsibility of that code.
The implemented logic initiates a POST HTTP request to the `/api/drive` endpoint with a
body describing the filesystem operation to be performed. In this case, it looks like:

```json
{
  "method": "put",
  "path": "/dummy.txt",
  "data": { "format": "text", "data": "Writing on Emscripten filesystem" }
}
```

This request is captured by the service worker (defined in the `@jupyterlite/apputils`
package). The service worker forwards the HTTP request to the main thread via a message
in a `BroadcastChannel` named `/sw-api.v1`. This message is received by the
`ServiceWorkerManager` that is instantiated in the plugin
`@jupyterlite/application-extension:service-worker-manager`. The wrapper has access to
the Jupyter contents manager to handle the request. For example, in the case of a `put`
operation, the `save` method of the contents manager will be called. The reply is then
propagated back (through the `BroadcastChannel`, then the network request, and so on) to
the Emscripten filesystem.

Since all open tabs for the same origin may listen to messages on the
`BroadcastChannel`, the request includes a unique identifier (`browsingContextId`) as
part of its payload to identify the browsing context (i.e., browser tab) where the
message originates. When the message comes back to the `ServiceWorkerManager`, it checks
this identifier to ensure the message is for the correct tab.

The need to use an HTTP request arises from the constraint of interfacing a synchronous
API (the Emscripten filesystem) with an asynchronous API (the Jupyter contents manager).

This architecture makes it possible for lite kernels to access contents from a custom
[JupyterLab drive](https://jupyterlab.readthedocs.io/en/latest/api/interfaces/services.Contents.IDrive.html)
to support multiple sources of contents.
