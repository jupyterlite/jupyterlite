import { PageConfig, URLExt } from '@jupyterlab/coreutils';

import { ServerConnection, Setting, SettingManager } from '@jupyterlab/services';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { PromiseDelegate } from '@lumino/coreutils';

import * as json5 from 'json5';

import type localforage from 'localforage';

/**
 * The settings file to request
 */
export type SettingsFile = 'all.json' | 'all_federated.json';

/**
 * The name of the local storage.
 */
const DEFAULT_STORAGE_NAME = 'JupyterLite Storage';

/**
 * A class to manage settings in the browser.
 */
export class Settings extends SettingManager implements Setting.IManager {
  /**
   * Create a new settings service.
   */
  constructor(options: Settings.IOptions) {
    super({
      serverSettings: options.serverSettings,
    });
    this._localforage = options.localforage;
    this._storageName = options.storageName || DEFAULT_STORAGE_NAME;
    this._storageDrivers = options.storageDrivers || null;

    this._ready = new PromiseDelegate();
    void this.initialize().catch(console.warn);
  }

  /**
   * A promise that resolves when the settings storage is fully initialized
   */
  get ready(): Promise<void> {
    return this._ready.promise;
  }

  /**
   * A lazy reference to initialized storage
   */
  protected get storage(): Promise<LocalForage> {
    return this.ready.then(() => this._storage as LocalForage);
  }

  /**
   * Finish any initialization after server has started and all extensions are applied.
   */
  async initialize() {
    await this.initStorage();
    this._ready.resolve(void 0);
  }

  /**
   * Prepare the storage
   */
  protected async initStorage() {
    this._storage = this.defaultSettingsStorage();
  }

  /**
   * Get default options for localForage instances
   */
  protected get defaultStorageOptions(): LocalForageOptions {
    const driver = this._storageDrivers?.length ? this._storageDrivers : null;
    return {
      version: 1,
      name: this._storageName,
      ...(driver ? { driver } : {}),
    };
  }

  /**
   * Create a settings store.
   */
  protected defaultSettingsStorage(): LocalForage {
    return this._localforage.createInstance({
      description: 'Offline Storage for Settings',
      storeName: 'settings',
      ...this.defaultStorageOptions,
    });
  }

  /**
   * Get settings by plugin id
   *
   * @param pluginId the id of the plugin
   *
   */
  async fetch(pluginId: string): Promise<ISettingRegistry.IPlugin> {
    const all = await this.list();
    const settings = all.values as ISettingRegistry.IPlugin[];
    const setting = settings.find((setting: ISettingRegistry.IPlugin) => {
      return setting.id === pluginId;
    });
    if (!setting) {
      throw new Error(`Setting ${pluginId} not found`);
    }
    return setting;
  }

  /**
   * Get all the settings
   */
  async list(
    query?: 'ids',
  ): Promise<{ ids: string[]; values: ISettingRegistry.IPlugin[] }> {
    const allCore = await this._getAll('all.json');
    let allFederated: ISettingRegistry.IPlugin[] = [];
    try {
      allFederated = await this._getAll('all_federated.json');
    } catch {
      // handle the case where there is no federated extension
    }

    // JupyterLab 4 expects all settings to be returned in one go
    // so append the settings from federated plugins to the core ones
    const all = allCore.concat(allFederated);

    // return existing user settings if they exist
    const storage = await this.storage;
    const settings = await Promise.all(
      all.map(async (plugin) => {
        const { id } = plugin;
        const raw = ((await storage.getItem(id)) as string) ?? plugin.raw;
        return {
          ...Private.override(plugin),
          raw,
          settings: json5.parse(raw),
        };
      }),
    );

    // format the settings
    const ids = settings.map((plugin: ISettingRegistry.IPlugin) => plugin.id) ?? [];

    let values: ISettingRegistry.IPlugin[] = [];
    if (!query) {
      values =
        settings.map((plugin: ISettingRegistry.IPlugin) => {
          plugin.data = { composite: {}, user: {} };
          return plugin;
        }) ?? [];
    }

    return { ids, values };
  }

  /**
   * Save settings for a given plugin id
   *
   * @param pluginId The id of the plugin
   * @param raw The raw settings
   *
   */
  async save(id: string, raw: string): Promise<void> {
    await (await this.storage).setItem(id, raw);
  }

  /**
   * Clear all stored settings
   *
   * @returns A promise which resolves when the settings are cleared
   */
  async clear(): Promise<void> {
    await (await this.storage).clear();
  }

  /**
   * Get all the settings for core or federated plugins
   */
  private async _getAll(file: SettingsFile): Promise<ISettingRegistry.IPlugin[]> {
    const settingsUrl = PageConfig.getOption('settingsUrl') ?? '/';
    const all = (await (
      await fetch(URLExt.join(settingsUrl, file))
    ).json()) as ISettingRegistry.IPlugin[];
    return all;
  }

  private _storageName: string = DEFAULT_STORAGE_NAME;
  private _storageDrivers: string[] | null = null;
  private _storage: LocalForage | undefined;
  private _localforage: typeof localforage;
  private _ready: PromiseDelegate<void>;
}

/**
 * A namespace for settings metadata.
 */
export namespace Settings {
  /**
   * Initialization options for settings.
   */
  export interface IOptions {
    localforage: typeof localforage;
    storageName?: string | null;
    storageDrivers?: string[] | null;
    serverSettings?: ServerConnection.ISettings;
  }
}

/**
 * A namespace for private data
 */
namespace Private {
  const _overrides: Record<string, ISettingRegistry.IPlugin['schema']['default']> =
    JSON.parse(PageConfig.getOption('settingsOverrides') || '{}');

  /**
   * Override the defaults of the schema with ones from PageConfig
   *
   * @see https://github.com/jupyterlab/jupyterlab_server/blob/v2.5.2/jupyterlab_server/settings_handler.py#L216-L227
   */
  export function override(plugin: ISettingRegistry.IPlugin): ISettingRegistry.IPlugin {
    if (_overrides[plugin.id]) {
      if (!plugin.schema.properties) {
        // probably malformed, or only provides keyboard shortcuts, etc.
        plugin.schema.properties = {};
      }
      for (const [prop, propDefault] of Object.entries(_overrides[plugin.id] || {})) {
        plugin.schema.properties[prop].default = propDefault;
      }
    }
    return plugin;
  }
}
