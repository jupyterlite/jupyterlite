import { PageConfig, URLExt } from '@jupyterlab/coreutils';

import { PromiseDelegate } from '@lumino/coreutils';

import * as json5 from 'json5';

import type localforage from 'localforage';

import { IPlugin, ISettings, SettingsFile } from './tokens';

/**
 * The name of the local storage.
 */
const DEFAULT_STORAGE_NAME = 'JupyterLite Storage';

/**
 * A class to handle requests to /api/settings
 */
export class Settings implements ISettings {
  constructor(options: Settings.IOptions) {
    this._localforage = options.localforage;
    this._storageName = options.storageName || DEFAULT_STORAGE_NAME;
    this._storageDrivers = options.storageDrivers || null;

    this._ready = new PromiseDelegate();
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
  async get(pluginId: string): Promise<IPlugin | undefined> {
    const all = await this.getAll();
    const settings = all.settings as IPlugin[];
    const setting = settings.find((setting: IPlugin) => {
      return setting.id === pluginId;
    });
    return setting;
  }

  /**
   * Get all the settings
   */
  async getAll(): Promise<{ settings: IPlugin[] }> {
    const allCore = await this._getAll('all.json');
    let allFederated: IPlugin[] = [];
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
    return { settings };
  }

  /**
   * Save settings for a given plugin id
   *
   * @param pluginId The id of the plugin
   * @param raw The raw settings
   *
   */
  async save(pluginId: string, raw: string): Promise<void> {
    await (await this.storage).setItem(pluginId, raw);
  }

  /**
   * Get all the settings for core or federated plugins
   */
  private async _getAll(file: SettingsFile): Promise<IPlugin[]> {
    const settingsUrl = PageConfig.getOption('settingsUrl') ?? '/';
    const all = (await (
      await fetch(URLExt.join(settingsUrl, file))
    ).json()) as IPlugin[];
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
  }
}

/**
 * A namespace for private data
 */
namespace Private {
  const _overrides: Record<string, IPlugin['schema']['default']> = JSON.parse(
    PageConfig.getOption('settingsOverrides') || '{}',
  );

  /**
   * Override the defaults of the schema with ones from PageConfig
   *
   * @see https://github.com/jupyterlab/jupyterlab_server/blob/v2.5.2/jupyterlab_server/settings_handler.py#L216-L227
   */
  export function override(plugin: IPlugin): IPlugin {
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
