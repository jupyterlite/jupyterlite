# Communication between a host page and a JupyterLite instance running in an IFrame

When a JupyterLite instance is embedded in a website via an IFrame, it may be relevant
to establish a communication channel between the host page and the instance.

In the following, we build a frontend extension that allows an instance of JupyterLite
located in an IFrame to receive and process a theme change order triggered by a button
on the host page. The instance is also able to send a message back to the host page.

This extension is first built for JupyterLab and then for JupyterLite.

## Create a development environment and initialize the project

It's a good practice to create a specific environment for the development of the
extension. Several methods are possible. Here we use
[conda](https://conda.io/projects/conda/en/latest/index.html), a package and environment
manager. The installation procedure for conda is
[here](https://conda.io/projects/conda/en/latest/user-guide/install/index.html).

Follow the
[JupyterLab tutorial](https://jupyterlab.readthedocs.io/en/latest/extension/extension_tutorial.html#install-nodejs-jupyterlab-etc-in-a-conda-environment)
to create an environment:

```bash
conda create -n jupyterlab-iframe-ext --override-channels --strict-channel-priority -c conda-forge -c nodefaults jupyterlab=4 nodejs=20 git copier=7 jinja2-time jupyterlite-core
conda activate jupyterlab-iframe-ext
```

Create a directory in your workspace, move to this directory, then generate an extension
template using [copier](https://copier.readthedocs.io):

```bash
copier copy https://github.com/jupyterlab/extension-template .
```

```bash
Select kind:
1 - frontend
2 - server
3 - theme
Choose from 1, 2, 3 [1]: 1
author_name [My Name]:
author_email [me@test.com]:
labextension_name [myextension]: jupyterlab-iframe-bridge-example
python_name [jupyterlab-iframe-bridge-example]: jupyterlab-iframe-bridge-example
project_short_description [A JupyterLab extension.]: Communication between a host page and an instance of JupyterLab located in an IFrame
has_settings [n]: n
has_binder [n]: n
test [y]: n
repository [https://github.com/github_username/jupyterlab-iframe-bridge-example]:
```

Finally, install the dependencies and the extension (empty for now) into the
environment, then create a symbolic link from JupyterLab to the source code in order to
avoid running `pip install` every time a modification is made:

```bash
cd jupyterlab-iframe-bridge-example
pip install -ve .
jupyter labextension develop --overwrite .
```

## Extension development

Modify the file `jupyterlab-iframe-bridge-example/src/index.ts` with a text editor.

As the host page will ask the IFrame to change the theme, import the plugin that
supports themes management:

```typescript
import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';

import { IThemeManager } from '@jupyterlab/apputils';
```

The code of the `plugin` object must also be modified:

```typescript
/**
 * Initialization data for the jupyterlab-iframe-bridge-example extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-iframe-bridge-example:plugin',
  autoStart: true,
  requires: [IThemeManager],
  activate: (app: JupyterFrontEnd, themeManager: IThemeManager) => {
    console.log('JupyterLab extension jupyterlab-iframe-bridge-example is activated!');

    /* Incoming messages management */
    window.addEventListener('message', (event) => {
      if (event.data.type === 'from-host-to-iframe') {
        console.log('Message received in the iframe:', event.data);

        if (themeManager.theme === 'JupyterLab Dark') {
          themeManager.setTheme('JupyterLab Light');
        } else {
          themeManager.setTheme('JupyterLab Dark');
        }
      }
    });

    /* Outgoing messages management */
    const notifyThemeChanged = (): void => {
      const message = { type: 'from-iframe-to-host', theme: themeManager.theme };
      window.parent.postMessage(message, '*');
      console.log('Message sent to the host:', message);
    };
    themeManager.themeChanged.connect(notifyThemeChanged);
  },
};

export default plugin;
```

The `themeManager` object implements the `IThemeManager` interface whose
[documentation](https://jupyterlab.readthedocs.io/en/latest/api/interfaces/apputils.IThemeManager-1.html)
lists the accessible properties and methods.

Two situations are to be distinguished: the reception of a message sent from the host
page and the sending of a message to the host page.

For the first situation, we use the `themeManager.theme` property to identify the
current theme and the `themeManager.setTheme` method to change it. The theme change is
triggered when the IFrame receives a message whose type is `from-host-to-iframe`.

For the second situation, the `themeManager.themeChanged` property is used. This signal
is fired when the theme has actually changed. It is used to notify the host page through
the `postMessage` method
([documentation](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)).

## From JupyterLab extension to JupyterLite extension

Start by installing the dependencies shown in the previous code:

```bash
jlpm add @jupyterlab/apputils
jlpm add @jupyterlab/application
```

Build JupyterLab extension:

```bash
jlpm run build
```

The JupyterLab extension is created! The following command checks if it is correctly
loaded in the environment:

```bash
jupyter labextension list
```

Move to a directory where the extension should be tested and run the build of this
extension for JupyterLite:

```bash
mkdir examples
cd examples
jupyter lite build --output-dir lite
```

The following lines show that the extension has been correctly built:

```
...
federated_extensions:copy:ext:jupyterlab-iframe-bridge-example
.  pre_build:federated_extensions:copy:ext:jupyterlab-iframe-bridge-example
...
```

A `jupyterlab-iframe-bridge-example/examples/lite/` directory containing everything
needed for JupyterLite to work is created (notice the presence of our extension in the
`extensions` subdirectory).

## Test the extension

To test the communication between a host page and an IFrame containing JupyterLite,
create a file `jupyterlab-iframe-bridge-example/examples/index.html`. Edit this file
with the following code:

```html
<html>
  <title>Example bridge between a host app and JupyterLite</title>
  <body>
    <script type="text/javascript">
      /* Outgoing messages */
      function toggle() {
        window.frames.jupyterlab.postMessage({ type: 'from-host-to-iframe' });
      }

      /* Incoming messages */
      window.addEventListener('message', (event) => {
        if (event.data.type === 'from-iframe-to-host') {
          document.getElementById('chosenTheme').innerText = event.data.theme;
        }
      });
    </script>
    <h2>Below is a JupyterLite site running in an IFrame</h2>
    <p>
      Click the following button sends a message to the JupyterLab IFrame to toggle the
      theme.
    </p>
    <p>The IFrame indicates that the current theme is: <em id="chosenTheme"></em></p>
    <input type="button" value="Toggle the JupyterLab Theme" onclick="toggle()" />
    <iframe
      name="jupyterlab"
      src="lite/"
      width="100%"
      height="600px"
      sandbox="allow-scripts allow-same-origin"
    ></iframe>
  </body>
</html>
```

When the user clicks on the button, the `toggle` function sends a message to the IFrame
via the `postMessage` method. This message is intercepted by our extension which changes
the theme. Moreover, when the host page receives a message from the IFrame notifying of
an effective theme change, it displays it to the user.

In order to visualize this process, launch a minimalist server from the `examples`
directory:

```bash
cd examples
python -m http.server -b 127.0.0.1
```

In a browser, at the address `http://127.0.0.1:8000`, you should be able to notice the
communication between the host page and the IFrame (refresh the browser if necessary):

![jupyterlite-bridge-iframe](https://user-images.githubusercontent.com/44410933/218969739-2f78788d-00a3-4715-b20e-59c48bb2f2bd.gif)

In addition, the browser console should display messages similar to the following:

![image](https://user-images.githubusercontent.com/44410933/218319071-0095cbe5-ca53-45e5-9bae-a9beeb6197e2.png)
