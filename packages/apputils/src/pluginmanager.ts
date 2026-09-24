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
    this._pluginInfo = options.pluginData;
    this._entries = toEntries(this._pluginInfo.availablePlugins);
  }

  get available(): ReadonlyArray<IEntry> {
    return this._entries;
  }

  /**
   * Rebuild the entries, for example once the plugins of the disabled
   * federated extensions are known.
   */
  async refresh(): Promise<void> {
    // The base constructor refreshes before the plugin data is stored.
    if (!this._pluginInfo) {
      return;
    }
    this._entries = toEntries(this._pluginInfo.availablePlugins);
    this.stateChanged.emit();
  }

  async enable(entry: IEntry): Promise<void> {
    // no-op
  }

  async disable(entry: IEntry): Promise<void> {
    // no-op
  }

  private _pluginInfo: PluginListModel.IPluginData;
  private _entries: IEntry[] = [];
}

/**
 * Convert the plugin info to plugin manager entries.
 */
function toEntries(plugins: PluginListModel.IPluginData['availablePlugins']): IEntry[] {
  return plugins.map((plugin) => {
    let tokenLabel = plugin.provides ? plugin.provides.name.split(':')[1] : undefined;
    if (plugin.provides && !tokenLabel) {
      tokenLabel = plugin.provides.name;
    }
    // Plugins stay locked until there is a way to enable and disable
    // them in JupyterLite.
    return {
      ...plugin,
      tokenLabel,
      locked: true,
    };
  });
}
