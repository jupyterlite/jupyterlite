import { PageConfig } from '@jupyterlab/coreutils';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { StateDB } from '@jupyterlab/statedb';

import { LocalStorageConnector } from '@jupyterlite/storage';

import { JSONObject, PartialJSONObject } from '@lumino/coreutils';

import * as json5 from 'json5';

/**
 * An interface for the plugin settings.
 */
interface IPlugin extends PartialJSONObject {
  /**
   * The name of the plugin.
   */
  id: string;

  /**
   * The settings for the plugin.
   */
  settings: JSONObject;

  /**
   * The raw user settings data as a string containing JSON with comments.
   */
  raw: string;

  /**
   * The JSON schema for the plugin.
   */
  schema: ISettingRegistry.ISchema;

  /**
   * The published version of the NPM package containing the plugin.
   */
  version: string;
}

/**
 * A class to handle requests to /api/settings
 */
export class Settings {
  /**
   * Construct a new Settings.
   */
  constructor() {
    const connector = new LocalStorageConnector('settings');
    this._storage = new StateDB<string>({
      connector
    });
  }

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
   * Get the settings
   */
  async getAll(): Promise<{ settings: IPlugin[] }> {
    const settingsUrl = PageConfig.getOption('settingsUrl') ?? '/';
    const all = (await (
      await fetch(`${settingsUrl}/all.json`)
    ).json()) as IPlugin[];
    const settings = await Promise.all(
      all.map(async plugin => {
        const { id } = plugin;
        const raw = (await this._storage.fetch(id)) ?? plugin.raw;
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
    return this._storage.save(plugin, raw);
  }

  private _storage: StateDB<string>;
}
