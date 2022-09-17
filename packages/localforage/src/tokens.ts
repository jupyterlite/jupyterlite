// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import type localforage from 'localforage';

import { Token } from '@lumino/coreutils';

/**
 * The token for the localforage singleton.
 */
export const ILocalForage = new Token<ILocalForage>(
  '@jupyterlite/localforge:ILocalForage'
);

/**
 *  An interface for the localforage singleton.
 */
export interface ILocalForage {
  localforage: typeof localforage;
}

/** An interface for a customizable local forage */
export interface IForager {
  /**
   * A promise that resolves when the storage is fully initialized
   */
  ready: Promise<void>;

  /**
   * A lazy reference to initialized storage
   */
  storage: Promise<LocalForage>;

  /**
   * Finish any initialization after server has started and all extensions are applied.
   */
  initialize(): Promise<void>;
}

export namespace IForager {
  /** The default name for a localforage storage */
  export const DEFAULT_STORAGE_NAME = 'JupyterLite Storage';

  /** Initialization options for an IForager usually available from the application */
  export interface IOptions {
    localforage: typeof localforage;
    storageName?: string | null;
    storageDrivers?: string[] | null;
  }
}
