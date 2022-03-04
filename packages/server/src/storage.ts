// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { Token } from '@lumino/coreutils';
import type localforage from 'localforage';

export const IMemoryStorage = new Token<IMemoryStorage>(
  '@jupyterlite/server-extension:IMemoryStorage'
);

/**
 * A placeholder for localforage with the memoryStorageDriver
 */
export interface IMemoryStorage {
  localforage: typeof localforage;
}

/**
 * Return a localforage known to have memoryStorages
 */
export async function ensureMemoryStorage(): Promise<IMemoryStorage> {
  const localforage = await import('localforage');
  const memoryStorageDriver = await import('localforage-memoryStorageDriver');
  localforage.defineDriver(memoryStorageDriver.default);
  return { localforage };
}
