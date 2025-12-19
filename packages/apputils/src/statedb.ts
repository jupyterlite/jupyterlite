import { PromiseDelegate } from '@lumino/coreutils';

import type { IDataConnector } from '@jupyterlab/statedb';

import type localforage from 'localforage';

/**
 * The name of the local storage.
 */
const DEFAULT_STORAGE_NAME = 'JupyterLite Storage';

/**
 * A StateDB data connector backed by IndexedDB
 */
export class IndexedDBDataConnector<T> implements IDataConnector<T> {
  /**
   * Construct a new IndexedDBDataConnector.
   *
   * @param options - The options for the data connector.
   */
  constructor(options: IndexedDBDataConnector.IOptions) {
    this._localforage = options.localforage;
    this._storageName = options.storageName || DEFAULT_STORAGE_NAME;
    this._storageDrivers = options.storageDrivers || null;

    this._ready = new PromiseDelegate();
    this.initialize().catch(console.warn);
  }

  /**
   * Initialize the data connector.
   */
  async initialize() {
    await this.initStorage();
    this._ready.resolve(void 0);
  }

  /**
   * A lazy reference to the underlying storage.
   */
  protected get storage(): Promise<LocalForage> {
    return this._ready.promise.then(() => this._storage as LocalForage);
  }

  /**
   * Initialize storage instance
   */
  protected async initStorage(): Promise<void> {
    this._storage = this.createStorage();
  }

  /**
   * Get default options for localForage instances
   */
  protected get defaultStorageOptions(): LocalForageOptions {
    const driver =
      this._storageDrivers && this._storageDrivers.length ? this._storageDrivers : null;

    return {
      version: 1,
      name: this._storageName,
      ...(driver ? { driver } : {}),
    };
  }

  /**
   * Initialize the default storage for contents.
   */
  protected createStorage(): LocalForage {
    return this._localforage.createInstance({
      description: 'Offline Storage for StateDB',
      storeName: 'statedb',
      ...this.defaultStorageOptions,
    });
  }

  /**
   * Fetch a value from the data connector.
   *
   * @param id - The identifier of the value to fetch.
   *
   * @returns A promise that resolves with the fetched value, or undefined if not found.
   */
  async fetch(id: string): Promise<T | undefined> {
    const result = (await (await this.storage).getItem(id)) as T | null;
    return result ?? undefined;
  }

  /**
   * List all values in a namespace.
   *
   * @param namespace - The namespace to list values from. Defaults to ''.
   *
   * @returns A promise that resolves with the list of IDs and values.
   */
  async list(namespace = ''): Promise<{ ids: string[]; values: T[] }> {
    const storage = await this.storage;

    const items: { [key: string]: T } = {};
    for (const key of await storage.keys()) {
      // Casting to string here, we know for sure the item is there
      items[key] = (await storage.getItem(key)) as T;
    }

    const result = Object.keys(items).reduce(
      (acc, val) => {
        if (namespace === '' ? true : namespace === val.split(':')[0]) {
          acc.ids.push(val);
          acc.values.push(items[val]);
        }

        return acc;
      },
      { ids: [] as string[], values: [] as T[] },
    );

    return result;
  }

  /**
   * Remove a value from the data connector.
   *
   * @param id - The identifier of the value to remove.
   *
   * @returns A promise that resolves when the value is removed.
   */
  async remove(id: string): Promise<void> {
    await (await this.storage).removeItem(id);
  }

  /**
   * Save a value to the data connector.
   *
   * @param id - The identifier of the value to save.
   * @param value - The value to save.
   *
   * @returns A promise that resolves when the value is saved.
   */
  async save(id: string, value: T): Promise<void> {
    await (await this.storage).setItem(id, value);
  }

  private _storageName: string = DEFAULT_STORAGE_NAME;

  private _storageDrivers: string[] | null = null;

  private _ready: PromiseDelegate<void>;

  private _storage: LocalForage | undefined;

  private _localforage: typeof localforage;
}

/**
 * A namespace for statedb.
 */
export namespace IndexedDBDataConnector {
  /**
   * The options used to create a IndexedDBDataConnector.
   */
  export interface IOptions {
    /**
     * The name of the storage instance on e.g. IndexedDB, localStorage
     */
    storageName?: string | null;

    /**
     * The drivers to use for storage.
     */
    storageDrivers?: string[] | null;

    /**
     * The localForage instance to use.
     */
    localforage: typeof localforage;
  }
}
