// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import type localforage from 'localforage';

import { PromiseDelegate } from '@lumino/coreutils';

import { IForager } from './tokens';

/** A reusable class for storing application data in localforage */
export class Forager implements IForager {
  constructor(options: Forager.IOptions) {
    this._storeName = options.storeName;
    this._description = options.description;
    this._localforage = options.localforage;
    this._storageName = options.storageName || IForager.DEFAULT_STORAGE_NAME;
    this._storageDrivers = options.storageDrivers || null;
    this._ready = new PromiseDelegate();
  }

  /**
   * A promise that resolves when the workspace storage is fully initialized
   */
  get ready(): Promise<void> {
    return this._ready.promise;
  }

  /**
   * A lazy reference to initialized storage
   */
  get storage(): Promise<LocalForage> {
    return this.ready.then(() => this._storage as LocalForage);
  }

  /**
   * Prepare the storage
   */
  protected async initStorage() {
    this._storage = this.defaultStorage();
  }

  /**
   * Finish any initialization after server has started and all extensions are applied.
   */
  async initialize() {
    await this.initStorage();
    this._ready.resolve(void 0);
  }

  /**
   * Create a workspaces store.
   */
  protected defaultStorage(): LocalForage {
    return this._localforage.createInstance({
      description: this._description,
      storeName: this._storeName,
      ...this.defaultStorageOptions,
    });
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

  private _storageName: string;
  private _storeName: string;
  private _description: string;
  private _storageDrivers: string[] | null = null;
  private _storage: LocalForage | undefined;
  private _localforage: typeof localforage;
  private _ready: PromiseDelegate<void>;
}

export namespace Forager {
  export interface IOptions {
    /** A name for the store inside the storage, viewable in the browser. */
    storeName: string;
    /** A description for the store inside the storage, viewable in the browser. */
    description: string;
    /** A reference to localforage  */
    localforage: typeof localforage;
    /** The top-level name of the storage */
    storageName?: string | null;
    /** The list of available storage drivers */
    storageDrivers?: string[] | null;
  }
}
