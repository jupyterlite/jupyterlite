import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { JSONObject, PartialJSONObject, Token } from '@lumino/coreutils';

/**
 * The token for the settings service.
 */
export const ISettings = new Token<ISettings>('@jupyterlite/settings:ISettings');

/**
 * An interface for the plugin settings.
 */
export interface IPlugin extends PartialJSONObject {
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
 * The interface for the Settings service.
 */
export interface ISettings {
  /**
   * A promise that resolves after the settings have been full initialized
   */
  ready: Promise<void>;

  /**
   * Get settings by plugin id
   *
   * @param pluginId the id of the plugin
   *
   */
  get(pluginId: string): Promise<IPlugin | undefined>;

  /**
   * Get all the settings
   */
  getAll(): Promise<{ settings: IPlugin[] }>;

  /**
   * Save settings for a given plugin id
   *
   * @param pluginId The id of the plugin
   * @param raw The raw settings
   *
   */
  save(pluginId: string, raw: string): Promise<void>;
}
