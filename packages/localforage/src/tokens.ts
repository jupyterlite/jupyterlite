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
