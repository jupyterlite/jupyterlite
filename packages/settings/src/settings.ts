import { PageConfig, URLExt } from '@jupyterlab/coreutils';

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
    let found = settings.find((setting: IPlugin) => {
      return setting.id === plugin;
    });

    if (found == null) {
      found = await Private.getFederated(plugin);
    }

    return found;
  }

  /**
   * Get all the settings
   */
  async getAll(): Promise<{ settings: IPlugin[] }> {
    return Private.getAll();
  }

  /**
   * Save settings for a given plugin id
   *
   * @param plugin The id of the plugin
   * @param raw The raw settings
   *
   */
  async save(plugin: string, raw: string): Promise<void> {
    await Private._storage.setItem(plugin, raw);
  }
}

namespace Private {
  let _all: { settings: IPlugin[] };
  const _federated = new Map<string, IPlugin | undefined>();

  export const _storage = localforage.createInstance({
    name: STORAGE_NAME,
    description: 'Offline Storage for Settings',
    storeName: 'settings',
    version: 1
  });

  export async function getAll(): Promise<{ settings: IPlugin[] }> {
    if (_all == null) {
      const settingsUrl = PageConfig.getOption('settingsUrl') ?? '/';
      const all = (await (
        await fetch(URLExt.join(settingsUrl, 'all.json'))
      ).json()) as IPlugin[];
      const settings = await Promise.all(
        all.map(async plugin => {
          const { id } = plugin;
          const raw = ((await _storage.getItem(id)) as string) ?? plugin.raw;
          return {
            ...plugin,
            raw,
            settings: json5.parse(raw)
          };
        })
      );
      _all = { settings };
    }
    return _all;
  }

  export async function getFederated(id: string): Promise<IPlugin | undefined> {
    console.warn('federated', id);
    if (_federated.has(id)) {
      return _federated.get(id);
    }

    const [ext, plugin] = id.split(':');
    let federated: string[];
    try {
      federated = JSON.parse(PageConfig.getOption('federated_extensions'));
    } catch {
      federated = [];
    }

    if (federated.indexOf(ext)) {
      const url = URLExt.join(
        PageConfig.getOption('fullLabextensionsUrl'),
        ext,
        'schemas',
        ext,
        `${plugin}.json`
      );
      const schema = await (await fetch(url)).json();
      const raw = ((await _storage.getItem(id)) as string) ?? '{}';
      _federated.set(id, {
        id,
        raw,
        schema,
        settings: json5.parse(raw) || {},
        version: _all?.settings[0]?.version || '3.0.8'
      });
    } else {
      _federated.set(id, void 0);
    }
    return _federated.get(id);
  }
}
