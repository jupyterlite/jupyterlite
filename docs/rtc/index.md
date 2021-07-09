# Real Time Collaboration

JupyterLite enables basic support for Real Time Collaboration over WebRTC.

## What is Real Time Collaboration

Real Time Collaboration (RTC for short) makes it possible for users to collaborate on
the same document at the same time.

Here is an example screencast of what it looks like in JupyterLab:

![rtc-demo](https://user-images.githubusercontent.com/591645/117701750-e6940280-b1c7-11eb-92e6-2ce0331febeb.gif)

Since JupyterLite reuses most of the upstream JupyterLab components and plugins, it also
gets support for RTC almost automatically.

The main differences compared to JupyterLab are:

- the user content is decentralized: users store notebooks and files in their own
  browser local storage
- the communication with peers and the initial syncing mechanism happens over WebRTC,
  instead of the WebSocket Jupyter Server handler in JupyterLab

## Enabling RTC in JupyterLite

See the [configuring](../configuring.md) section of the docs for more details on how to
configure `jupyter-lite.json`.
