// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { JupyterLiteServer } from '@jupyterlite/server';

// The webpack public path needs to be set before loading the CSS assets.
import { PageConfig } from '@jupyterlab/coreutils';

import { VoilaApp, plugins } from '@voila-dashboards/voila';

require('./style.js');

const serverExtensions = [
  import('@jupyterlite/javascript-kernel-extension'),
  import('@jupyterlite/pyolite-kernel-extension'),
  import('@jupyterlite/server-extension')
];

const mimeExtensionsMods = [
  // import('@jupyterlite/iframe-extension'),
  // import('@jupyterlab/javascript-extension'),
  import('@jupyterlab/json-extension'),
  // import('@jupyterlab/vega5-extension')
];

const disabled = ['@jupyter-widgets/jupyterlab-manager'];

async function createModule(scope, module) {
  try {
    const factory = await window._JUPYTERLAB[scope].get(module);
    return factory();
  } catch (e) {
    console.warn(`Failed to create module: package: ${scope}; module: ${module}`);
    throw e;
  }
}

/**
 * The main entry point for the application.
 */
export async function main() {
  const mimeExtensions = await Promise.all(mimeExtensionsMods);

  let baseMods = [
    // Voila plugins
    plugins,
    // @jupyterlite plugins
    // require('@jupyterlite/application-extension'),
    // require('@jupyterlite/retro-application-extension'),
    // @retrolab plugins
    // do not enable the document opener from RetroLab
    // require('@retrolab/application-extension').default.filter(
    //   ({ id }) => ![
    //     '@retrolab/application-extension:logo',
    //     '@retrolab/application-extension:opener'
    //   ].includes(id)
    // ),
    // require('@retrolab/help-extension'),
    // require('@retrolab/notebook-extension'),

    // @jupyterlab plugins
    // require('@jupyterlab/application-extension').default.filter(({ id }) =>
    //   [
    //     '@jupyterlab/application-extension:commands',
    //     '@jupyterlab/application-extension:context-menu',
    //     '@jupyterlab/application-extension:faviconbusy'
    //   ].includes(id)
    // ),
    // require('@jupyterlab/apputils-extension').default.filter(({ id }) =>
    //   [
    //     // '@jupyterlab/apputils-extension:palette',
    //     '@jupyterlab/apputils-extension:settings',
    //     // '@jupyterlab/apputils-extension:state',
    //     // '@jupyterlab/apputils-extension:themes',
    //     // '@jupyterlab/apputils-extension:themes-palette-menu',
    //     // '@jupyterlab/apputils-extension:toolbar-registry'
    //   ].includes(id)
    // ),
    // require('@jupyterlab/codemirror-extension').default.filter(({ id }) =>
    //   [
    //     '@jupyterlab/codemirror-extension:services',
    //     '@jupyterlab/codemirror-extension:codemirror'
    //   ].includes(id)
    // ),
    // require('@jupyterlab/completer-extension').default.filter(({ id }) =>
    //   ['@jupyterlab/completer-extension:manager'].includes(id)
    // ),
    // require('@jupyterlab/console-extension'),
    // require('@jupyterlab/docmanager-extension').default.filter(({ id }) =>
    //   [
    //     '@jupyterlab/docmanager-extension:plugin',
    //     '@jupyterlab/docmanager-extension:manager'
    //   ].includes(id)
    // ),
    // require('@jupyterlab/filebrowser-extension').default.filter(({ id }) =>
    //   [
    //     '@jupyterlab/filebrowser-extension:factory'
    //   ].includes(id)
    // ),
    // require('@jupyterlab/mainmenu-extension'),
    require('@jupyterlab/mathjax2-extension'),
    // require('@jupyterlab/notebook-extension').default.filter(({ id }) =>
    //   [
    //     '@jupyterlab/notebook-extension:factory',
    //     '@jupyterlab/notebook-extension:tracker',
    //     '@jupyterlab/notebook-extension:widget-factory'
    //   ].includes(id)
    // ),
    require('@jupyterlab/markdownviewer-extension'),
    require('@jupyterlab/rendermime-extension'),
    // require('@jupyterlab/shortcuts-extension'),
    // require('@jupyterlab/theme-light-extension'),
    // require('@jupyterlab/theme-dark-extension'),
    // require('@jupyterlab/translation-extension')
  ];

  // The motivation here is to only load a specific set of plugins dependending on
  // the current page
  const page = PageConfig.getOption('voilaPage');
  switch (page) {
    case 'render': {
      // TODO WHAT
      // baseMods = baseMods.concat([
      //   require('@jupyterlab/filebrowser-extension').default.filter(({ id }) =>
      //     [
      //       '@jupyterlab/filebrowser-extension:browser',
      //       '@jupyterlab/filebrowser-extension:file-upload-status',
      //       '@jupyterlab/filebrowser-extension:open-with',
      //     ].includes(id)
      //   ),
      //   // do not enable the new terminal button from RetroLab
      //   require('@retrolab/tree-extension').default.filter(
      //     ({ id }) => id !== '@retrolab/tree-extension:new-terminal'
      //   )
      // ]);
      break;
    }
    case 'tree': {
      // TODO WHAT
      // baseMods = baseMods.concat([
      //   require('@jupyterlab/cell-toolbar-extension'),
      //   require('@jupyterlab/completer-extension').default.filter(({ id }) =>
      //     ['@jupyterlab/completer-extension:notebooks'].includes(id)
      //   ),
      //   require('@jupyterlab/tooltip-extension').default.filter(({ id }) =>
      //     [
      //       '@jupyterlab/tooltip-extension:manager',
      //       '@jupyterlab/tooltip-extension:notebooks'
      //     ].includes(id)
      //   )
      // ]);
      break;
    }
  }

  const mods = [];
  const federatedExtensionPromises = [];
  const federatedMimeExtensionPromises = [];
  const federatedStylePromises = [];
  const litePluginsToRegister = [];
  const liteExtensionPromises = [];

  // This is all the data needed to load and activate plugins. This should be
  // gathered by the server and put onto the initial page template.
  const extensions = JSON.parse(
    PageConfig.getOption('federated_extensions')
  );

  // The set of federated extension names.
  const federatedExtensionNames = new Set();

  extensions.forEach(data => {
    if (data.liteExtension) {
      liteExtensionPromises.push(createModule(data.name, data.extension));
      return;
    }
    if (data.extension) {
      federatedExtensionNames.add(data.name);
      federatedExtensionPromises.push(createModule(data.name, data.extension));
    }
    if (data.mimeExtension) {
      federatedExtensionNames.add(data.name);
      federatedMimeExtensionPromises.push(createModule(data.name, data.mimeExtension));
    }
    if (data.style) {
      federatedStylePromises.push(createModule(data.name, data.style));
    }
  });

  /**
   * Iterate over active plugins in an extension.
   */
  function* activePlugins(extension) {
    // Handle commonjs or es2015 modules
    let exports;
    if (extension.hasOwnProperty('__esModule')) {
      exports = extension.default;
    } else {
      // CommonJS exports.
      exports = extension;
    }

    let plugins = Array.isArray(exports) ? exports : [exports];
    for (let plugin of plugins) {
      if (
        PageConfig.Extension.isDisabled(plugin.id) ||
        disabled.includes(plugin.id) ||
        disabled.includes(plugin.id.split(':')[0])
      ) {
        continue;
      }
      yield plugin;
    }
  }

  // Add the base frontend extensions
  const baseFrontendMods = await Promise.all(baseMods);
  baseFrontendMods.forEach(p => {
    for (let plugin of activePlugins(p)) {
      mods.push(plugin);
    }
  });

  // Add the federated mime extensions.
  const federatedMimeExtensions = await Promise.allSettled(federatedMimeExtensionPromises);
  federatedMimeExtensions.forEach(p => {
    if (p.status === "fulfilled") {
      for (let plugin of activePlugins(p.value)) {
        mimeExtensions.push(plugin);
      }
    } else {
      console.error(p.reason);
    }
  });

  // Add the federated extensions.
  const federatedExtensions = await Promise.allSettled(federatedExtensionPromises);
  federatedExtensions.forEach(p => {
    if (p.status === "fulfilled") {
      for (let plugin of activePlugins(p.value)) {
        mods.push(plugin);
      }
    } else {
      console.error(p.reason);
    }
  });

  // Add the base serverlite extensions
  const baseServerExtensions = await Promise.all(serverExtensions);
  baseServerExtensions.forEach(p => {
    for (let plugin of activePlugins(p)) {
      litePluginsToRegister.push(plugin);
    }
  });

  // Add the serverlite federated extensions.
  const federatedLiteExtensions = await Promise.allSettled(liteExtensionPromises);
  federatedLiteExtensions.forEach(p => {
    if (p.status === "fulfilled") {
      for (let plugin of activePlugins(p.value)) {
        litePluginsToRegister.push(plugin);
      }
    } else {
      console.error(p.reason);
    }
  });

  // create the in-browser JupyterLite Server
  const jupyterLiteServer = new JupyterLiteServer({});
  jupyterLiteServer.registerPluginModules(litePluginsToRegister);
  // start the server
  await jupyterLiteServer.start();

  // retrieve the custom service manager from the server app
  const { serviceManager } = jupyterLiteServer;

  // create a RetroLab frontend
  const app = new VoilaApp({ serviceManager, mimeExtensions });

  app.name = PageConfig.getOption('appName') || 'Voilite';

  app.registerPluginModules(mods);

  await app.start();
  await app.restored;

  await serviceManager.ready;

  console.log('App', app);
  console.log('jupyterLiteServer', jupyterLiteServer);

  const search = window.location.search;
  const urlParams = new URLSearchParams(search);
  const notebookName = urlParams.get('notebook')?.trim();

  let notebook;
  try {
    notebook = await app.serviceManager.contents.get(decodeURIComponent(notebookName));
  } catch(e) {
    // TODO Do this earlier and maybe differently
    const errordiv = document.createElement('div');
    errordiv.innerHTML = `404 ${notebookName} not found ${e}`;
    document.body.appendChild(errordiv);
    return;
  }

  console.log('notebook', notebook);

  // TODO Fill the HTML body with the requested template
  // TODO Spawn a kernel
  // 1) Find the requested notebook path
  // 2) Load the Notebook cells content and get kernel name
  // 3) Spawn kernel and render cell outputs in the right places

  // const sessionManager = serviceManager.sessions;
  // await sessionManager.ready;

  // const connection = await sessionManager.startNew({
  //   // name: 'notebook.ipynb',
  //   // path: kernelOptions.path,
  //   type: 'notebook',
  //   path: '',
  //   kernel: {
  //     name: 'python',
  //   },
  // });
  // await connection.kernel.ready;
  // window.voiliteKernel = connection.kernel;

  window.jupyterapp = app;
}
