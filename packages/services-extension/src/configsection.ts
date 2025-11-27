// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import type {
  ConfigSection,
  ConfigSectionManager,
  IConfigSection,
} from '@jupyterlab/services';
import { ServerConnection } from '@jupyterlab/services';

import type { JSONObject } from '@lumino/coreutils';

/**
 * A class to manager config sections in the browser.
 */
export class LiteConfigSectionManager implements ConfigSection.IManager {
  /**
   * Construct a new config section manager.
   */
  constructor(options: { serverSettings?: ServerConnection.ISettings }) {
    this._serverSettings = options.serverSettings ?? ServerConnection.makeSettings();
  }

  /**
   * The server settings.
   */
  get serverSettings(): ServerConnection.ISettings {
    return this._serverSettings;
  }

  /**
   * Create a new config section.
   */
  async create(options: ConfigSectionManager.ICreateOptions): Promise<IConfigSection> {
    return {
      data: {},
      serverSettings: this._serverSettings,
      update: async (newData: JSONObject): Promise<JSONObject> => {
        return newData;
      },
    };
  }

  private _serverSettings: ServerConnection.ISettings;
}
