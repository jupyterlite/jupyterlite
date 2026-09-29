// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { {{ appClassName }} } from '{{ appModuleName }}';

// The webpack public path needs to be set before loading the CSS assets.
import { PageConfig } from '@jupyterlab/coreutils';

import { UserDisabledExtensions } from '@jupyterlite/apputils';

import { PluginRegistry } from '@lumino/coreutils';

import { Signal } from '@lumino/signaling';

import './style.js';

// custom list of disabled plugins
const disabled = [
{{#each disabledExtensions}}
  "{{this}}",
{{/each}}
];

async function createModule(scope, module) {
  try {
    const factory = await window._JUPYTERLAB[scope].get(module);
    const instance = factory();
    instance.__scope__ = scope;
    return instance;
  } catch (e) {
    console.warn(`Failed to create module: package: ${scope}; module: ${module}`);
    throw e;
  }
}

const IDLE_TIMEOUT = 5000;

/**
 * Resolve once the browser is idle, or on the next task when
 * `requestIdleCallback` is not available (Safari before 16.4).
 */
function whenIdle() {
  return new Promise(resolve => {
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(() => resolve(), { timeout: IDLE_TIMEOUT });
    } else {
      setTimeout(resolve, 0);
    }
  });
}

/**
 * The main entry point for the application.
 */
export async function main() {
  const allPlugins = [];
  const disabledPluginIds = [];
  const pluginsToRegister = [];
  const federatedExtensionPromises = [];
  const federatedMimeExtensionPromises = [];
  const federatedStylePromises = [];
  const deferredDisabledFederatedModules = [];

  // The disabled entries from the page config, the app build and the user.
  const disabledExtensions = [
    ...PageConfig.Extension.disabled,
    ...disabled,
    ...(await UserDisabledExtensions.list())
  ];

  // Whether a plugin id, or the name of the extension it belongs to, is disabled.
  const isPluginDisabled = id => {
    const separatorIndex = id.indexOf(':');
    const extName = separatorIndex === -1 ? '' : id.slice(0, separatorIndex);
    return disabledExtensions.some(val => val === id || (extName && val === extName));
  };

  // A package listed in `disabledExtensions` is disabled as a unit, including
  // its plugins whose id does not start with the package name.
  const isExtensionDisabled = name => {
    return disabledExtensions.includes(name);
  };

  const warnAboutPackageLevelDisable = (pluginId, scope) => {
    console.warn(
      `Plugin ${pluginId} does not start with the name of the extension providing it (${scope}), which is disabled, so this plugin is disabled too. To keep it enabled, list the plugin ids to disable in disabledExtensions instead of ${scope}.`
    );
  };

  // This is all the data needed to load and activate plugins. This should be
  // gathered by the server and put onto the initial page template.
  const extensions = JSON.parse(
    PageConfig.getOption('federated_extensions')
  );

  // The set of federated extension names.
  const federatedExtensionNames = new Set();

  extensions.forEach(data => {
    const isDisabled = isExtensionDisabled(data.name);
    if (data.extension) {
      federatedExtensionNames.add(data.name);
      if (isDisabled) {
        deferredDisabledFederatedModules.push({
          name: data.name,
          module: data.extension
        });
      } else {
        federatedExtensionPromises.push(createModule(data.name, data.extension));
      }
    }
    if (data.mimeExtension) {
      federatedExtensionNames.add(data.name);
      if (isDisabled) {
        deferredDisabledFederatedModules.push({
          name: data.name,
          module: data.mimeExtension
        });
      } else {
        federatedMimeExtensionPromises.push(createModule(data.name, data.mimeExtension));
      }
    }
    if (data.style && !isDisabled) {
      federatedStylePromises.push(createModule(data.name, data.style));
    }
  });

  function getPlugins(extension) {
    // Handle commonjs or es2015 modules
    let exports;
    if (extension.hasOwnProperty('__esModule')) {
      exports = extension.default;
    } else {
      // CommonJS exports.
      exports = extension;
    }
    return Array.isArray(exports) ? exports : [exports];
  }

  function createPluginInfo(plugin, extension, isDisabled) {
    return {
      id: plugin.id,
      description: plugin.description,
      requires: plugin.requires ?? [],
      optional: plugin.optional ?? [],
      provides: plugin.provides ?? null,
      autoStart: plugin.autoStart,
      enabled: !isDisabled,
      extension: extension.__scope__
    };
  }

  function recordPlugin(plugin, extension, isDisabled) {
    allPlugins.push(createPluginInfo(plugin, extension, isDisabled));
    if (isDisabled) {
      disabledPluginIds.push(plugin.id);
    }
  }

  function collectDisabledPlugins(extension) {
    const plugins = [];
    for (let plugin of getPlugins(extension)) {
      if (!isPluginDisabled(plugin.id)) {
        warnAboutPackageLevelDisable(plugin.id, extension.__scope__);
      }
      plugins.push(createPluginInfo(plugin, extension, true));
    }
    return plugins;
  }

  /**
   * Iterate over active plugins in an extension.
   *
   * #### Notes
   * This also populates the list of all plugins and of the disabled ones.
   */
  function* activePlugins(extension) {
    for (let plugin of getPlugins(extension)) {
      const disabledById = isPluginDisabled(plugin.id);
      const isDisabled = disabledById || isExtensionDisabled(extension.__scope__);
      if (isDisabled && !disabledById) {
        warnAboutPackageLevelDisable(plugin.id, extension.__scope__);
      }
      recordPlugin(plugin, extension, isDisabled);
      if (isDisabled) {
        continue;
      }
      yield plugin;
    }
  }

  // Only collects plugin metadata; disabled plugins must not be registered.
  async function loadDeferredDisabledFederatedPlugins() {
    const deferredDisabledFederatedPlugins = await Promise.allSettled(
      deferredDisabledFederatedModules.map(data => createModule(data.name, data.module))
    );
    const disabledPlugins = [];

    deferredDisabledFederatedPlugins.forEach(p => {
      if (p.status === 'fulfilled') {
        try {
          disabledPlugins.push(...collectDisabledPlugins(p.value));
        } catch (e) {
          console.error(e);
        }
      } else {
        console.error(p.reason);
      }
    });

    return disabledPlugins;
  }

  // Handle the mime extensions.
  const mimeExtensions = [];
  {{#each mimeExtensions}}
  if (!federatedExtensionNames.has('{{@key}}')) {
    try {
      let ext = require('{{@key}}{{#if this}}/{{this}}{{/if}}');
      ext.__scope__ = '{{@key}}';
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

  // Handle the standard extensions.
  {{#each extensions}}
  if (!federatedExtensionNames.has('{{@key}}')) {
    try {
      let ext = require('{{@key}}{{#if this}}/{{this}}{{/if}}');
      ext.__scope__ = '{{@key}}';
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

  // 1. Create a plugin registry
  const pluginRegistry = new PluginRegistry();

  // 2. Register the plugins
  pluginRegistry.registerPlugins(pluginsToRegister);

  // 3. Get and resolve the service manager and connection status plugins
  const IServiceManager = require('@jupyterlab/services').IServiceManager;
  const serviceManager = await pluginRegistry.resolveRequiredService(IServiceManager);

  // The plugins of the disabled federated extensions are only known once the
  // application started; the application appends them to its info.
  const availablePluginsAdded = new Signal({});

  // create the application
  const app = new {{ appClassName }}({
    pluginRegistry,
    mimeExtensions,
    serviceManager,
    disabled: {
      matches: disabledPluginIds,
      patterns: disabledExtensions
    },
    availablePlugins: allPlugins,
    availablePluginsAdded
  });
  app.name = PageConfig.getOption('appName') || 'JupyterLite';

  // Expose global app instance when in dev mode or when toggled explicitly.
  const exposeAppInBrowser =
    (PageConfig.getOption('exposeAppInBrowser') || '').toLowerCase() === 'true';

  if (exposeAppInBrowser) {
    window.jupyterapp = app;
  }

  // 4. Start the application, which will activate the other plugins
  await app.start({ bubblingKeydown: true });
  await app.restored;

  // Keep the disabled extensions from competing with the startup work: wait
  // for all the plugins to be activated when the app reports it, then for an
  // idle period.
  const startupDone = app.allPluginsActivated ?? Promise.resolve();
  startupDone
    .then(whenIdle)
    .then(loadDeferredDisabledFederatedPlugins)
    .then(plugins => {
      availablePluginsAdded.emit(plugins);
    })
    .catch(reason => {
      console.error('Error when loading disabled federated extensions:', reason);
    });
}
