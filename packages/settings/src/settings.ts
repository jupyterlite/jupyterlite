import { PageConfig, URLExt } from '@jupyterlab/coreutils';
import { IFederatedExtension } from '@jupyterlite/types';

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
   * @param pluginId the id of the plugin
   *
   */
  async get(pluginId: string): Promise<IPlugin | undefined> {
    const all = await this.getAll();
    const settings = all.settings as IPlugin[];
    let found = settings.find((setting: IPlugin) => {
      return setting.id === pluginId;
    });

    if (!found) {
      found = await this._getFederated(pluginId);
    }

    return found;
  }

  /**
   * Get all the settings
   */
  async getAll(): Promise<{ settings: IPlugin[] }> {
    const settingsUrl = PageConfig.getOption('settingsUrl') ?? '/';
    const all = (await (
      await fetch(URLExt.join(settingsUrl, 'all.json'))
    ).json()) as IPlugin[];
    const settings = await Promise.all(
      all.map(async plugin => {
        const { id } = plugin;
        const raw = ((await this._storage.getItem(id)) as string) ?? plugin.raw;
        return {
          ...Private.override(plugin),
          raw,
          settings: json5.parse(raw)
        };
      })
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
    await this._storage.setItem(pluginId, raw);
  }

  /**
   * Get the settings for a federated extension
   *
   * @param pluginId The id of a plugin
   */
  private async _getFederated(pluginId: string): Promise<IPlugin | undefined> {
    const [packageName, schemaName] = pluginId.split(':');

    if (!Private.isFederated(packageName)) {
      return;
    }

    const labExtensionsUrl = PageConfig.getOption('fullLabextensionsUrl');
    const schemaUrl = URLExt.join(
      labExtensionsUrl,
      packageName,
      'schemas',
      packageName,
      `${schemaName}.json`
    );
    const packageUrl = URLExt.join(labExtensionsUrl, packageName, 'package.json');
    const schema = await (await fetch(schemaUrl)).json();
    const packageJson = await (await fetch(packageUrl)).json();
    const raw = ((await this._storage.getItem(pluginId)) as string) ?? '{}';
    const settings = json5.parse(raw) || {};
    return Private.override({
      id: pluginId,
      raw,
      schema,
      settings,
      version: packageJson.version || '3.0.8'
    });
  }

  private _storage = localforage.createInstance({
    name: STORAGE_NAME,
    description: 'Offline Storage for Settings',
    storeName: 'settings',
    version: 1
  });
}

/**
 * A namespace for private data
 */
namespace Private {
  const _overrides: Record<string, IPlugin['schema']['default']> = JSON.parse(
    PageConfig.getOption('settingsOverrides') || '{}'
  );

  /**
   * Test whether this package is configured in `federated_extensions` in this app
   *
   * @param packageName The npm name of a package
   */
  export function isFederated(packageName: string): boolean {
    let federated: IFederatedExtension[];

    try {
      federated = JSON.parse(PageConfig.getOption('federated_extensions'));
    } catch {
      return false;
    }

    for (const { name } of federated) {
      if (name === packageName) {
        return true;
      }
    }

    return false;
  }

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
