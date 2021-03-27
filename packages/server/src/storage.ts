import { IDataConnector } from '@jupyterlab/statedb';

type LocalStorageValue = string | undefined;

/**
 * A string key/value data connector on top of `localStorage`.
 */
export class LocalStorageConnector implements IDataConnector<string> {
  /**
   * Construct a new LocalStorageConnector
   *
   * @param namespace The namespace of the localStorage data.
   */
  constructor(namespace: string) {
    this._namespace = namespace;
  }

  /**
   * Retrieve an item from the data connector.
   *
   * @param id The item key.
   */
  async fetch(id: string): Promise<LocalStorageValue> {
    return localStorage.getItem(this._getStorageKey(id)) ?? undefined;
  }

  /**
   * Retrieve the list of items available from the data connector.
   */
  async list(): Promise<{ ids: string[]; values: string[] }> {
    const items = {
      ids: [],
      values: []
    } as { ids: string[]; values: string[] };
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(this._namespace)) {
        continue;
      }
      items.ids.push(key);
      items.values.push(localStorage.getItem(key) as string);
    }
    return items;
  }

  /**
   * Remove a value using the data connector.
   *
   * @param id The id of the item to remove.
   */
  async remove(id: string): Promise<void> {
    localStorage.removeItem(this._getStorageKey(id));
  }

  /**
   * Save a value using the data connector.
   *
   * @param id The id of the item to save.
   * @param value The value of the item to save.
   */
  async save(id: string, value: string): Promise<void> {
    localStorage.setItem(this._getStorageKey(id), value);
  }

  /**
   * Get the localStorage key for the plugin.
   *
   * @param plugin The plugin id
   *
   * @returns The storage key for the plugin.
   */
  private _getStorageKey(plugin: string): string {
    return `${this._namespace}-${plugin}`;
  }

  private _namespace = '_';
}
