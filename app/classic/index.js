// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { createRendermimePlugins } from '@jupyterlab/application/lib/mimerenderers';

import { JupyterLiteServer } from '@jupyterlite/server';

// The webpack public path needs to be set before loading the CSS assets.
import { PageConfig } from '@jupyterlab/coreutils';
// eslint-disable-next-line
__webpack_public_path__ = PageConfig.getOption('fullStaticUrl') + '/';

require('./build/style.js');

const serverMods = [
  import('@jupyterlite/javascript-kernel-extension'),
  import('@jupyterlite/p5-kernel-extension'),
  import('@jupyterlite/pyodide-kernel-extension'),
  import('@jupyterlite/server-extension')
];

window.addEventListener('load', async () => {
  // create the in-browser JupyterLite Server
  const jupyterLiteServer = new JupyterLiteServer({});
  jupyterLiteServer.registerPluginModules(await Promise.all(serverMods));
  // start the server
  await jupyterLiteServer.start();

  // retrieve the custom service manager from the server app
  const { serviceManager } = jupyterLiteServer;

  // create a JupyterLab Classic frontend
  const { App } = require('@jupyterlab-classic/application');
  const app = new App({ serviceManager });

  let mods = [
    // @jupyterlite plugins
    require('@jupyterlite/application-extension'),
    require('@jupyterlite/classic-application-extension'),
    require('@jupyterlite/theme-extension'),
    // third-party plugins
    require('@telamonian/theme-darcula'),
    // @jupyterlab-classic plugins
    // do not enable the document opener from JupyterLab Classic
    require('@jupyterlab-classic/application-extension').default.filter(
      ({ id }) => id !== '@jupyterlab-classic/application-extension:opener'
    ),
    require('@jupyterlab-classic/help-extension'),
    require('@jupyterlab-classic/notebook-extension'),

    // @jupyterlab plugins
    require('@jupyterlab/apputils-extension').default.filter(({ id }) =>
      [
        '@jupyterlab/apputils-extension:palette',
        '@jupyterlab/apputils-extension:settings',
        '@jupyterlab/apputils-extension:themes-palette-menu'
      ].includes(id)
    ),
    require('@jupyterlab/codemirror-extension').default.filter(({ id }) =>
      [
        '@jupyterlab/codemirror-extension:services',
        '@jupyterlab/codemirror-extension:codemirror'
      ].includes(id)
    ),
    require('@jupyterlab/completer-extension').default.filter(({ id }) =>
      ['@jupyterlab/completer-extension:manager'].includes(id)
    ),
    require('@jupyterlab/docmanager-extension').default.filter(({ id }) =>
      ['@jupyterlab/docmanager-extension:plugin'].includes(id)
    ),
    require('@jupyterlab/mainmenu-extension'),
    require('@jupyterlab/mathjax2-extension'),
    require('@jupyterlab/notebook-extension').default.filter(({ id }) =>
      [
        '@jupyterlab/notebook-extension:factory',
        '@jupyterlab/notebook-extension:tracker',
        '@jupyterlab/notebook-extension:widget-factory'
      ].includes(id)
    ),
    require('@jupyterlab/rendermime-extension'),
    require('@jupyterlab/shortcuts-extension'),
    require('@jupyterlab/theme-light-extension'),
    require('@jupyterlab/theme-dark-extension')
  ];

  // The motivation here is to only load a specific set of plugins dependending on
  // the current page
  const page = PageConfig.getOption('classicPage');
  switch (page) {
    case 'tree': {
      mods = mods.concat([
        // do not enable the new terminal button from JupyterLab Classic
        require('@jupyterlab-classic/tree-extension').default.filter(
          ({ id }) => id !== '@jupyterlab-classic/tree-extension:new-terminal'
        )
      ]);
      break;
    }
    case 'notebooks': {
      mods = mods.concat([
        require('@jupyterlab/completer-extension').default.filter(({ id }) =>
          ['@jupyterlab/completer-extension:notebooks'].includes(id)
        ),
        require('@jupyterlab/tooltip-extension').default.filter(({ id }) =>
          [
            '@jupyterlab/tooltip-extension:manager',
            '@jupyterlab/tooltip-extension:notebooks'
          ].includes(id)
        )
      ]);
      break;
    }
    case 'edit': {
      mods = mods.concat([
        require('@jupyterlab/completer-extension').default.filter(({ id }) =>
          ['@jupyterlab/completer-extension:files'].includes(id)
        ),
        require('@jupyterlab/fileeditor-extension').default.filter(({ id }) =>
          ['@jupyterlab/fileeditor-extension:plugin'].includes(id)
        ),
        require('@jupyterlab-classic/tree-extension').default.filter(({ id }) =>
          ['@jupyterlab-classic/tree-extension:factory'].includes(id)
        )
      ]);
      break;
    }
  }

  app.registerPluginModules(mods);

  const mimeExtensions = [
    require('@jupyterlite/iframe-extension'),
    require('@jupyterlab/json-extension')
  ];
  // register mime extensions manually
  // TODO: move to JupyterLab Classic constructor
  for (const plugin of createRendermimePlugins(mimeExtensions)) {
    app.registerPlugin(plugin);
  }

  console.log('Starting app');
  await app.start();
  console.log('JupyterLite Classic started, waiting for restore');
  await app.restored;
  console.log('JupyterLite Classic restored');
});
