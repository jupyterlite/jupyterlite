// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { JupyterLab } from '@jupyterlab/application';

import { JupyterLiteServer } from '@jupyterlite/server';

// The webpack public path needs to be set before loading the CSS assets.
import { PageConfig } from '@jupyterlab/coreutils';
// eslint-disable-next-line
__webpack_public_path__ = PageConfig.getOption('fullStaticUrl') + '/';

const styles = import('./build/style.js');

const extensions = [
  import('@jupyterlite/application-extension'),
  import('@jupyterlite/theme-extension'),
  import('@jupyterlab/application-extension'),
  import('@jupyterlab/apputils-extension'),
  import('@jupyterlab/codemirror-extension'),
  import('@jupyterlab/completer-extension'),
  import('@jupyterlab/console-extension'),
  import('@jupyterlab/csvviewer-extension'),
  import('@jupyterlab/docmanager-extension'),
  import('@jupyterlab/filebrowser-extension'),
  import('@jupyterlab/fileeditor-extension'),
  import('@jupyterlab/help-extension'),
  import('@jupyterlab/imageviewer-extension'),
  import('@jupyterlab/inspector-extension'),
  import('@jupyterlab/launcher-extension'),
  import('@jupyterlab/mainmenu-extension'),
  import('@jupyterlab/markdownviewer-extension'),
  import('@jupyterlab/mathjax2-extension'),
  import('@jupyterlab/notebook-extension'),
  import('@jupyterlab/rendermime-extension'),
  import('@jupyterlab/running-extension'),
  import('@jupyterlab/settingeditor-extension'),
  import('@jupyterlab/shortcuts-extension'),
  import('@jupyterlab/statusbar-extension'),
  import('@jupyterlab/theme-dark-extension'),
  import('@jupyterlab/theme-light-extension'),
  import('@jupyterlab/tooltip-extension'),
  import('@jupyterlab/ui-components-extension'),
  import('@telamonian/theme-darcula')
];

const mimeExtensions = [import('@jupyterlab/json-extension')];

const mods = [
  import('@jupyterlite/javascript-kernel-extension'),
  import('@jupyterlite/server-extension')
];

window.addEventListener('load', async () => {
  // Make sure the styles have loaded
  await styles;

  // create the in-browser JupyterLite Server
  const jupyterLiteServer = new JupyterLiteServer({});
  jupyterLiteServer.registerPluginModules(await Promise.all(mods));
  // start the server
  await jupyterLiteServer.start();

  // retrieve the custom service manager from the server app
  const { serviceManager } = jupyterLiteServer;

  // create a full-blown JupyterLab frontend
  const lab = new JupyterLab({
    mimeExtensions: await Promise.all(mimeExtensions),
    serviceManager
  });

  const disabled = [
    '@jupyterlab/apputils-extension:themes',
    '@jupyterlab/apputils-extension:workspaces',
    '@jupyterlab/application-extension:tree-resolver'
  ];
  const plugins = (await Promise.all(extensions)).map(mod => {
    let data = mod.default;
    if (!Array.isArray(data)) {
      data = [data];
    }
    return data.filter(mod => !disabled.includes(mod.id));
  });

  lab.registerPluginModules(plugins);

  /* eslint-disable no-console */
  console.log('Starting app');
  await lab.start();
  console.log('JupyterLite started, waiting for restore');
  await lab.restored;
  console.log('JupyterLite restored');
});
