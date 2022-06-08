# Enable Real Time Collaboration

JupyterLite can be extended to enable basic support for Real Time Collaboration over
WebRTC.

```{note}
Prior to version `0.1.0b6`, the WebRTC document provider was built directly into
JupyterLite. While still enabled on the JupyterLite demo site, this feature was moved to
a [separate repository](https://github.com/jupyterlite/jupyterlab-webrtc-docprovider) to
allow for more configurability, UI customization, and independent iteration with some
patches against upstream dependencies.
```

## What is Real Time Collaboration?

Real Time Collaboration (RTC for short) makes it possible for users to collaborate on
the same document at the same time.

Here is an example screencast of what it looks like in JupyterLab:

![rtc-demo](https://user-images.githubusercontent.com/591645/117701750-e6940280-b1c7-11eb-92e6-2ce0331febeb.gif)

Since JupyterLite reuses most of the upstream JupyterLab components and plugins, it also
gets support for RTC _almost_ automatically.

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

As an advanced feature with some privacy considerations, enabling collaborative editing
requires a few steps to prepare for, deploy, and then use.

### Install the Document Provider Extension

Add `jupyterlab-webrtc-docprovider` which provides a [prebuilt JupyterLab extension] to
your build environment's `environment.yml` or `requirements.txt`, or install it
interactively with one of:

```bash
                 pip install jupyterlab-webrtc-docprovider
mamba install -c conda-forge jupyterlab-webrtc-docprovider
conda install -c conda-forge jupyterlab-webrtc-docprovider
```

As long as `ignore_sys_prefix` is not enabled, the extension will be discovered and
included in the next `jupyter lab build`.

[prebuilt jupyterlab extension]:
  https://jupyterlab.readthedocs.io/en/stable/user/extensions.html#installing-extensions

### Enable the Collaborative Flag

to set the `collaborative` flag setting in `jupyter-config-data` in the appropriate
`jupyter-lite.json` configuration file:

```json
{
  "jupyter-config-data": {
    "collaborative": true
  }
}
```

_Note that each [JupyterLite application](../../quickstart/using.md#applications) can
use its own `jupyter-lite.json` file to override global defaults._

### Configure Rooms and Identity

Enabling RTC in JupyterLite follows the same behavior as in JupyterLab 3.1 where real
time collaboration is an opt-in feature.

In addition to the `collaborative` flag, end users must specify the `room` query
parameter in the URL. An example of such URL is as follows:

`https://your-lite-deployment.example.com/lab/index.html?room=4869637241`

Similarly, the `username` and `usercolor` can be provided by settings or query
parameters. This can be useful when generating a link in an external application that
already provides identity.

```{hint}
Alternately, these can be configured via `overrides.json`, as described in
the `jupyterlab-webrtc-docprovider` repository.
```

Users are grouped together in rooms using a combination of:

- a room prefix: by default, the host, for example `jupyterlite.example.com` or
  `myserver:5000`
- the name of the room parsed from the query string parameter or settings, for example
  `my-custom-room`

These values are then hashed together, such that requests to the upstream signaling
server contain less easily-identifiable information.

Currently both `collaborative` and `room` must be configured for RTC to be enabled. When
this is the case, users can collaborate on documents together:

![rtc-rtd](https://user-images.githubusercontent.com/591645/125045331-2af33000-e09d-11eb-909b-a7d1d46910f6.gif)

See the [reference](../../reference/index.md) section of the docs for more details on
how to configure `jupyter-lite.json`.
