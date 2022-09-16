// packages/services/src/workspace/index.ts

import { Token } from '@lumino/coreutils';
import { Workspace } from '@jupyterlab/services/lib/workspace';

/**
 * The token for the Workspaces service.
 */
export const IWorkspaces = new Token<IWorkspaces>(
  '@jupyterlite/workspaces:IWorkspaces'
);

/**
 * The interface for the Licenses service.
 */

export interface IWorkspaces {
  /** Get all the workspaces */
  getAll(): Promise<IWorkspaces.IWorkspacesBundle>;
  /** Get a workspace by id */
  getWorkspace(id: string): Promise<Workspace.IWorkspace>;
  /** Update a workspace by id */
  setWorkspace(
    id: string,
    workspace: Workspace.IWorkspace
  ): Promise<Workspace.IWorkspace>;
  /** Delete a workspace by id */
  deleteWorkspace(id: string): Promise<Workspace.IWorkspace>;
}

/**
 * A named bundle of workspaces
 */
export namespace IWorkspaces {
  export interface IWorkspacesBundle {
    [key: string]: Workspace.IWorkspace;
  }
}
