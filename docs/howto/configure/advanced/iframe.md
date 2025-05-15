# Communication between a host page and a JupyterLite instance running in an IFrame

When a JupyterLite instance is embedded in a website via an IFrame, it may be relevant
to establish a communication channel between the host page and the instance.

## Using the `jupyter-iframe-commands` extension

The [jupyter-iframe-commands](https://github.com/TileDB-Inc/jupyter-iframe-commands)
extension is a JupyterLab extension that provides an API to execute JupyterLab commands
from a host page, with JupyterLite embedded in an iframe.

### Installation

Install the extension in your environment:

```bash
pip install jupyter-iframe-commands
```

Then rebuild your JupyterLite site:

```bash
jupyter lite build
```

### Usage

The extension consists of two packages:

1. `jupyter-iframe-commands`: The JupyterLab extension that runs inside the iframe
2. `jupyter-iframe-commands-host`: A JavaScript package for the host page interacting
   with the JupyterLite instance

To use the extension in your host page:

```html
<html>
  <head>
    <title>JupyterLite in an iframe</title>
    <script type="module">
      import { createBridge } from 'jupyter-iframe-commands-host';

      // Create a bridge to the JupyterLite instance
      const commandBridge = createBridge({ iframeId: 'jupyter-iframe' });

      // Example: Toggle the left sidebar
      async function toggleLeftSidebar() {
        await commandBridge.execute('application:toggle-left-area');
      }

      // Example: Change the theme
      async function setDarkTheme() {
        await commandBridge.execute('apputils:change-theme', {
          theme: 'JupyterLab Dark',
        });
      }

      // List all available JupyterLab commands
      async function listCommands() {
        const commands = await commandBridge.listCommands();
        console.log(commands);
      }

      // Make functions available globally
      window.toggleLeftSidebar = toggleLeftSidebar;
      window.setDarkTheme = setDarkTheme;
      window.listCommands = listCommands;
    </script>
  </head>
  <body>
    <h2>JupyterLite with command bridge</h2>
    <div>
      <button onclick="toggleLeftSidebar()">Toggle Left Sidebar</button>
      <button onclick="setDarkTheme()">Set Dark Theme</button>
      <button onclick="listCommands()">List Commands (check console)</button>
    </div>
    <iframe
      id="jupyter-iframe"
      src="path/to/jupyterlite/"
      width="100%"
      height="600px"
      sandbox="allow-scripts allow-same-origin"
    ></iframe>
  </body>
</html>
```

The `jupyter-iframe-commands` extension provides access to all JupyterLab commands, so
you can control various aspects of the JupyterLite instance, such as:

- Toggling UI elements (sidebars, panels, etc.)
- Creating new notebooks or files
- Changing the theme

For more information, refer to the
[jupyter-iframe-commands repository](https://github.com/TileDB-Inc/jupyter-iframe-commands).

## Exposing additional functionality

If you need additional functionality beyond what the `jupyter-iframe-commands` extension
provides, you can develop your own custom JupyterLab extension. Custom extensions can
implement new commands to expose more functionality to the host page.

For information on developing JupyterLab extensions, refer to the
[JupyterLab Extension Developer Guide](https://jupyterlab.readthedocs.io/en/stable/extension/extension_dev.html).
