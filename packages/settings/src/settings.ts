import { PageConfig } from '@jupyterlab/coreutils';

import * as json5 from 'json5';

import localforage from 'localforage';

import { IPlugin } from './tokens';

/**
 * The name of the local storage.
 */
const STORAGE_NAME = 'JupyterLite Storage';

/**
 * A class to handle requests to /api/settings
 */
export class Settings {
  /**
   * Get settings by plugin id
   *
   * @param plugin the id of the plugin
   *
   */
  async get(plugin: string): Promise<IPlugin | undefined> {
    const all = await this.getAll();
    const settings = all.settings as IPlugin[];
    return settings.find((setting: IPlugin) => {
      return setting.id === plugin;
    });
  }

  /**
   * Get all the settings
   */
  async getAll(): Promise<{ settings: IPlugin[] }> {
    const settingsUrl = PageConfig.getOption('settingsUrl') ?? '/';
    const all = (await (await fetch(`${settingsUrl}/all.json`)).json()) as IPlugin[];
    const settings = await Promise.all(
      all.map(async plugin => {
        const { id } = plugin;
        const raw = ((await this._storage.getItem(id)) as string) ?? plugin.raw;
        return {
          ...plugin,
          raw,
          settings: json5.parse(raw)
        };
      })
    );
    return {
      settings
    };
  }

  /**
   * Save settings for a given plugin id
   *
   * @param plugin The id of the plugin
   * @param raw The raw settings
   *
   */
  async save(plugin: string, raw: string): Promise<void> {
    await this._storage.setItem(plugin, raw);
  }

  private _storage = localforage.createInstance({
    name: STORAGE_NAME,
    description: 'Offline Storage for Settings',
    storeName: 'settings',
    version: 1
  });
}
