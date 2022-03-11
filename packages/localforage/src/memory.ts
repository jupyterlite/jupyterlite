// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import type localforage from 'localforage';

import memoryStorageDriver from 'localforage-memoryStorageDriver';

/**
 * Ensure a localforage singleton has had the memory storage driver installed
 */
export function ensureMemoryStorage(theLocalforage: typeof localforage): void {
  theLocalforage.defineDriver(memoryStorageDriver);
}
