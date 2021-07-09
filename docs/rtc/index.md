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

To enable RTC in JupyterLite, you need to set the `collaborative` flag in the
`jupyter-config-data`. This follows the same behavior as in JupyterLab 3.1 where real
time collaboration is an opt-in feature.

In addition to the `collaborative` flag, end users must specify the `room` query
parameter in the URL. An example of such URL is as follows:

[https://jupyterlite.readthedocs.io/en/latest/\_static/lab/index.html?room=my-custom-room](https://jupyterlite.readthedocs.io/en/latest/_static/lab/index.html?room=my-custom-room)

Users are grouped together in rooms using a combination of:

- the host, for example `jupyterlite.example.com` or `myserver:5000`
- the name of the room parsed from the query string parameter, for example
  `my-custom-room`

Currently both `collaborative` and `room` must exist for RTC to be enabled. When this is
the case, users can collaborate on documents together:

TODO: add screencast

See the [configuring](../configuring.md) section of the docs for more details on how to
configure `jupyter-lite.json`.
