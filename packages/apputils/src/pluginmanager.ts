// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { PluginListModel } from '@jupyterlab/pluginmanager';

import { ServerConnection } from '@jupyterlab/services';

import { UserDisabledExtensions } from './disabledextensions';

/**
 * Custom PluginModel for use in JupyterLite
 */
export class LitePluginListModel extends PluginListModel {
  /**
   * Create a new PluginListModel.
   *
   * The base model only talks to the plugin manager API through its server
   * settings, so their `fetch` answers the API from the browser.
   */
  constructor(options: PluginListModel.IOptions) {
    const { pluginData } = options;
    super({
      ...options,
      serverSettings: ServerConnection.makeSettings({
        fetch: (input, init) =>
          Private.handleRequest(new Request(input, init), pluginData),
      }),
    });
  }
}

/**
 * A namespace for private functionality.
 */
namespace Private {
  /**
   * Answer a request to the plugin manager API.
   */
  export async function handleRequest(
    request: Request,
    pluginData: PluginListModel.IPluginData,
  ): Promise<Response> {
    if (request.method === 'POST') {
      const { cmd, plugin_name: pluginId } = await request.json();
      await UserDisabledExtensions.set(pluginId, cmd === 'disable');
      return new Response(JSON.stringify({ status: 'ok' }));
    }
    // The plugins disabled by the site, or by disabling their extension, are locked.
    const userDisabled = await UserDisabledExtensions.get();
    const lockRules = pluginData.availablePlugins
      .filter((plugin) => !plugin.enabled && !userDisabled.has(plugin.id))
      .map((plugin) => plugin.id);
    return new Response(JSON.stringify({ allLocked: false, lockRules }));
  }
}
