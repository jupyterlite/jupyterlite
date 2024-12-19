# Enable Real Time Collaboration

```{warning}
There is currently no official support for Real Time Collaboration in JupyterLite.
```

## What is Real Time Collaboration?

Real Time Collaboration (RTC for short) makes it possible for users to collaborate on
the same document at the same time.

Here is an example screencast of what it looks like in JupyterLab:

![rtc-demo](https://user-images.githubusercontent.com/591645/117701750-e6940280-b1c7-11eb-92e6-2ce0331febeb.gif)

JupyterLite brings some key differences compared to JupyterLab when it comes to real
time collaboration:

- the user content is decentralized: users store notebooks and files in their own
  browser local storage
- the communication with peers and the initial syncing mechanism happens over WebRTC,
  instead of the WebSocket Jupyter Server handler in JupyterLab

## The current state of Real Time Collaboration in JupyterLite

There used to be some basic support for RTC in JupyterLite 0.1.x, via the
[jupyterlba-webrtc-provider extension](https://github.com/jupyterlite/jupyterlab-webrtc-docprovider).

Currently there is **no official** support for JupyterLite 0.2.x or higher, but it is
tracked in
[this issue](https://github.com/jupyterlite/jupyterlab-webrtc-docprovider/issues/16)

There is however a new experiment happening in a new
[jupyter-shared-drived extension](https://github.com/davidbrochart/jupyter-shared-drive).
