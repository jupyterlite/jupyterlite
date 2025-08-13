// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { Token } from '@lumino/coreutils';

/**
 * An interface for the workspace router
 */
export interface IWorkspaceRouter {
  // nothing to see here yet
}

/**
 * A token to advertise the workspace router is installed
 */
export const IWorkspaceRouter = new Token<IWorkspaceRouter>(
  '@jupyterlite/apputils:IWorkspaceRouter',
);
