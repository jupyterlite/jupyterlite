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
  - however, an initial WebSocket connection to one or more _WebRTC Signaling Servers_
    are made in order to help discover other peers
  - a custom list of signaling servers can be configured with `fullWebRtcSignalingUrls`
    in `jupyter-config-data`

## Enabling RTC in JupyterLite

To enable RTC in JupyterLite, you need to set the `collaborative` flag setting in
`jupyter-config-data` in the appropriate `jupyter-lite.json` configuration file:

```json
{
  "jupyter-config-data": {
    "collaborative": true
  }
}
```

_Note that each JupyterLite application - JupyterLab, RetroLab, REPL – can use its own
`jupyter-lite.json` file to override global defaults._

Enabling RTC in JupyterLite follows the same behavior as in JupyterLab 3.1 where real
time collaboration is an opt-in feature.

In addition to the `collaborative` flag, end users must specify the `room` query
parameter in the URL. An example of such URL is as follows:
`you-lite-deployment.example.com/lab/index.html?room=4869637241`

Users are grouped together in rooms using a combination of:

- the host, for example `jupyterlite.example.com` or `myserver:5000`
- the name of the room parsed from the query string parameter, for example
  `my-custom-room`

Currently both `collaborative` and `room` must exist for RTC to be enabled. When this is
the case, users can collaborate on documents together:

![rtc-rtd](https://user-images.githubusercontent.com/591645/125045331-2af33000-e09d-11eb-909b-a7d1d46910f6.gif)

See the [configuring](../configuring.md) section of the docs for more details on how to
configure `jupyter-lite.json`.
