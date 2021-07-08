// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { JupyterLab } from '@jupyterlab/application';

import { JupyterLiteServer } from '@jupyterlite/server';

// The webpack public path needs to be set before loading the CSS assets.
import { PageConfig } from '@jupyterlab/coreutils';

const styles = import('./style.js');

const serverExtensions = [
  import('@jupyterlite/javascript-kernel-extension'),
  import('@jupyterlite/p5-kernel-extension'),
  import('@jupyterlite/pyolite-kernel-extension'),
  import('@jupyterlite/server-extension')
];

// custom list of disabled plugins
const disabled = [
  ...JSON.parse(PageConfig.getOption('disabledExtensions') || '[]'),
  '@jupyterlab/apputils-extension:workspaces',
  '@jupyterlab/application-extension:logo',
  '@jupyterlab/application-extension:main',
  '@jupyterlab/application-extension:tree-resolver',
  '@jupyterlab/apputils-extension:resolver',
  '@jupyterlab/docmanager-extension:download',
  '@jupyterlab/filebrowser-extension:download',
  '@jupyterlab/help-extension:about'
];

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
  // Make sure the styles have loaded
  await styles;

  const pluginsToRegister = [];
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

  // Handle the mime extensions.
  const mimeExtensions = [];
  {{#each mimeExtensions}}
  if (!federatedExtensionNames.has('{{@key}}')) {
    try {
      let ext = require('{{@key}}{{#if this}}/{{this}}{{/if}}');
      for (let plugin of activePlugins(ext)) {
        mimeExtensions.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  {{/each}}

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

  // Handled the standard extensions.
  {{#each extensions}}
  if (!federatedExtensionNames.has('{{@key}}')) {
    try {
      let ext = require('{{@key}}{{#if this}}/{{this}}{{/if}}');
      for (let plugin of activePlugins(ext)) {
        pluginsToRegister.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  {{/each}}

  // Add the federated extensions.
  const federatedExtensions = await Promise.allSettled(federatedExtensionPromises);
  federatedExtensions.forEach(p => {
    if (p.status === "fulfilled") {
      for (let plugin of activePlugins(p.value)) {
        pluginsToRegister.push(plugin);
      }
    } else {
      console.error(p.reason);
    }
  });

  // Load all federated component styles and log errors for any that do not
  (await Promise.allSettled(federatedStylePromises)).filter(({status}) => status === "rejected").forEach(({reason}) => {
     console.error(reason);
    });

  // create the in-browser JupyterLite Server
  const jupyterLiteServer = new JupyterLiteServer({});
  jupyterLiteServer.registerPluginModules(await Promise.all(serverExtensions));
  // start the server
  await jupyterLiteServer.start();

  // retrieve the custom service manager from the server app
  const { serviceManager } = jupyterLiteServer;

  // create a full-blown JupyterLab frontend
  const lab = new JupyterLab({
    mimeExtensions,
    serviceManager
  });
  lab.name = 'JupyterLite';

  lab.registerPluginModules(pluginsToRegister);

  /* eslint-disable no-console */
  console.log('Starting app');
  await lab.start();
  console.log(`${lab.name} started, waiting for restore`);
  await lab.restored;
  console.log(`${lab.name} restored`);
}

main();
