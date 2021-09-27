// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { JupyterLiteServer } from '@jupyterlite/server';

// The webpack public path needs to be set before loading the CSS assets.
import { PageConfig } from '@jupyterlab/coreutils';

require('./style.js');

const serverMods = [
  import('@jupyterlite/javascript-kernel-extension'),
  import('@jupyterlite/p5-kernel-extension'),
  import('@jupyterlite/pyolite-kernel-extension'),
  import('@jupyterlite/server-extension')
];

const mimeExtensionsMods = [
  import('@jupyterlite/iframe-extension'),
  import('@jupyterlab/json-extension'),
  import('@jupyterlab/vega5-extension')
];

const disabled = JSON.parse(PageConfig.getOption('disabledExtensions') || '[]');

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
async function main() {
  // create the in-browser JupyterLite Server
  const jupyterLiteServer = new JupyterLiteServer({});
  jupyterLiteServer.registerPluginModules(await Promise.all(serverMods));
  // start the server
  await jupyterLiteServer.start();

  // retrieve the custom service manager from the server app
  const { serviceManager } = jupyterLiteServer;

  const mimeExtensions = await Promise.all(mimeExtensionsMods);

  let mods = [
    // @jupyterlite plugins
    require('@jupyterlite/application-extension'),
    require('@jupyterlite/retro-application-extension'),
    // @retrolab plugins
    // do not enable the document opener from RetroLab
    require('@retrolab/application-extension').default.filter(
      ({ id }) => ![
        '@retrolab/application-extension:logo',
        '@retrolab/application-extension:opener'
      ].includes(id)
    ),
    require('@retrolab/help-extension'),
    require('@retrolab/notebook-extension'),

    // @jupyterlab plugins
    require('@jupyterlab/application-extension').default.filter(({ id }) =>
      [
        '@jupyterlab/application-extension:commands',
        '@jupyterlab/application-extension:context-menu',
        '@jupyterlab/application-extension:faviconbusy'
      ].includes(id)
    ),
    require('@jupyterlab/apputils-extension').default.filter(({ id }) =>
      [
        '@jupyterlab/apputils-extension:palette',
        '@jupyterlab/apputils-extension:settings',
        '@jupyterlab/apputils-extension:state',
        '@jupyterlab/apputils-extension:themes',
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
    require('@jupyterlab/console-extension'),
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
    require('@jupyterlab/theme-dark-extension'),
    require('@jupyterlab/translation-extension')
  ];

  // The motivation here is to only load a specific set of plugins dependending on
  // the current page
  const page = PageConfig.getOption('retroPage');
  switch (page) {
    case 'tree': {
      mods = mods.concat([
        require('@jupyterlab/filebrowser-extension').default.filter(({ id }) =>
          [
            '@jupyterlab/filebrowser-extension:browser',
            '@jupyterlab/filebrowser-extension:factory',
            '@jupyterlab/filebrowser-extension:file-upload-status',
            '@jupyterlab/filebrowser-extension:open-with',
            '@jupyterlab/filebrowser-extension:share-file'
          ].includes(id)
        ),
        // do not enable the new terminal button from RetroLab
        require('@retrolab/tree-extension').default.filter(
          ({ id }) => id !== '@retrolab/tree-extension:new-terminal'
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
    case 'consoles': {
      mods = mods.concat([
        require('@jupyterlab/completer-extension').default.filter(({ id }) =>
          ['@jupyterlab/completer-extension:consoles'].includes(id)
        ),
        require('@jupyterlab/tooltip-extension').default.filter(({ id }) =>
          [
            '@jupyterlab/tooltip-extension:manager',
            '@jupyterlab/tooltip-extension:consoles'
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
        require('@jupyterlab/filebrowser-extension').default.filter(({ id }) =>
          [
            '@jupyterlab/filebrowser-extension:browser',
            '@jupyterlab/filebrowser-extension:factory'
          ].includes(id)
        ),
      ]);
      break;
    }
  }

  const federatedExtensionPromises = [];
  const federatedMimeExtensionPromises = [];
  const federatedStylePromises = [];

  // This is all the data needed to load and activate plugins. This should be
  // gathered by the server and put onto the initial page template.
  const extensions = JSON.parse(
    PageConfig.getOption('federated_extensions')
  );

  // The set of federated extension names.
  const federatedExtensionNames = new Set();

  extensions.forEach(data => {
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
      // skip the plugin (or extension) if disabled
      if (
        disabled.includes(plugin.id) ||
        disabled.includes(plugin.id.split(':')[0])
      ) {
        continue;
      }
      yield plugin;
    }
  }

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

  // create a RetroLab frontend
  const { RetroApp } = require('@retrolab/application');
  const app = new RetroApp({ serviceManager, mimeExtensions });

  app.name = 'RetroLite';

  app.registerPluginModules(mods);

  console.log('Starting app');
  await app.start();
  console.log(`${app.name} started, waiting for restore`);
  await app.restored;
  console.log(`${app.name} restored`);
}

main();
