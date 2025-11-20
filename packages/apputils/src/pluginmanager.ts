// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import type { IEntry } from '@jupyterlab/pluginmanager';
import { PluginListModel } from '@jupyterlab/pluginmanager';

/**
 * Custom PluginModel for use in JupyterLite
 */
export class LitePluginListModel extends PluginListModel {
  /**
   * Create a new PluginListModel.
   */
  constructor(options: PluginListModel.IOptions) {
    super(options);
    this._availablePlugins = options.pluginData.availablePlugins.map((plugin) => {
      let tokenLabel = plugin.provides ? plugin.provides.name.split(':')[1] : undefined;
      if (plugin.provides && !tokenLabel) {
        tokenLabel = plugin.provides.name;
      }
      return {
        ...plugin,
        tokenLabel,
        // keep all plugins locked and enabled for now until there is
        // a way to enable/disable plugins in JupyterLite
        locked: true,
        enabled: true,
      };
    });
  }

  get available(): ReadonlyArray<IEntry> {
    return this._availablePlugins;
  }

  async refresh(): Promise<void> {
    // no-op
  }

  async enable(entry: IEntry): Promise<void> {
    // no-op
  }

  async disable(entry: IEntry): Promise<void> {
    // no-op
  }

  private _availablePlugins: IEntry[];
}
