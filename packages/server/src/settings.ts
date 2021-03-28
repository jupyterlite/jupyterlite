import { PageConfig } from '@jupyterlab/coreutils';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { StateDB } from '@jupyterlab/statedb';

import { LocalStorageConnector } from './storage';

import { JSONObject, PartialJSONObject } from '@lumino/coreutils';

import * as json5 from 'json5';

import { Router } from './router';

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

    this._router.add('GET', Private.PLUGIN_NAME_REGEX, async (req: Request) => {
      const pluginId = Private.parsePluginId(req.url);
      const settings = await this._get(pluginId);
      return new Response(JSON.stringify(settings));
    });
    this._router.add(
      'GET',
      Settings.SETTINGS_SERVICE_URL,
      async (req: Request) => {
        const plugins = await this._getAll();
        return new Response(JSON.stringify(plugins));
      }
    );
    this._router.add('PUT', Private.PLUGIN_NAME_REGEX, async (req: Request) => {
      const pluginId = Private.parsePluginId(req.url);
      const payload = await req.text();
      const parsed = JSON.parse(payload);
      const { raw } = parsed;
      this._storage.save(pluginId, raw);
      return new Response(null, { status: 204 });
    });
  }

  /**
   * Get settings by plugin name
   *
   * @param plugin the name of the plugin
   *
   */
  private async _get(plugin: string): Promise<IPlugin | undefined> {
    const all = await this._getAll();
    const settings = all.settings as IPlugin[];
    return settings.find((setting: IPlugin) => {
      return setting.id === plugin;
    });
  }

  /**
   * Get the settings
   */
  private async _getAll(): Promise<{ settings: IPlugin[] }> {
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
   * Dispatch a request to the local router.
   *
   * @param req The request to dispatch.
   */
  dispatch(req: Request): Promise<Response> {
    return this._router.route(req);
  }

  private _router = new Router();
  private _storage: StateDB<string>;
}

/**
 * A namespace for Settings statics.
 */
export namespace Settings {
  /**
   * The url for the settings service.
   */
  export const SETTINGS_SERVICE_URL = '/api/settings';
}

/**
 * A namespace for Private data.
 */
namespace Private {
  /**
   * The regex to match plugin names.
   */
  export const PLUGIN_NAME_REGEX = new RegExp(
    /(?:@([^/]+?)[/])?([^/]+?):(\w+)/
  );

  /**
   * Parse the plugin id from a URL.
   *
   * @param url The request url.
   */
  export const parsePluginId = (url: string): string => {
    const matches = new URL(url).pathname.match(PLUGIN_NAME_REGEX);
    return matches?.[0] ?? '';
  };
}
