import type { Workspace } from '@jupyterlab/services';
import { ServerConnection } from '@jupyterlab/services';
import { PageConfig, URLExt } from '@jupyterlab/coreutils';

import { IndexedDBDataConnector } from './statedb';

/**
 * A named bundle of Workspaces
 */
export namespace IWorkspaces {
  /**
   * A bundle of workspaces
   */
  export interface IWorkspacesBundle {
    [key: string]: Workspace.IWorkspace;
  }
}

/**
 * A workspace manager for workspaces stored in the browser and on the server.
 */
export class LiteWorkspaceManager extends IndexedDBDataConnector<Workspace.IWorkspace> {
  /**
   * Construct a new LiteWorkspaceManager.
   *
   * @param options - The options for the workspace manager.
   */
  constructor(options: LiteWorkspaceManager.IOptions) {
    super({ ...options });

    this.serverSettings = options.settings || ServerConnection.makeSettings();
  }

  /**
   * The server settings.
   */
  readonly serverSettings: ServerConnection.ISettings;

  /**
   * Fetch a workspace by id.
   *
   * @param id - The workspace id
   * @returns A promise that resolves with the workspace.
   */
  async fetch(id: string): Promise<Workspace.IWorkspace> {
    // First try to get from local storage
    const localWorkspace = await super.fetch(id);
    if (localWorkspace) {
      return localWorkspace;
    }

    // Fall back to server
    try {
      const serverWorkspaces = await this._getServerWorkspaces();
      if (serverWorkspaces[id]) {
        return serverWorkspaces[id];
      }
    } catch (error) {
      console.warn('Failed to fetch workspace from server:', error);
    }

    // If neither local nor server has the workspace, return an empty workspace
    return {
      data: {},
      metadata: { id },
    };
  }

  /**
   * List all workspaces.
   *
   * @returns A promise that resolves with all workspace ids
   */
  async list(): Promise<{ ids: string[]; values: Workspace.IWorkspace[] }> {
    let serverWorkspaces: IWorkspaces.IWorkspacesBundle = {};

    // Try to get server workspaces
    try {
      serverWorkspaces = await this._getServerWorkspaces();
    } catch (error) {
      console.warn('Failed to fetch workspaces from server:', error);
    }

    // Get local workspaces
    const localResult = await super.list();

    // Merge server and local workspaces, with local taking precedence for same IDs
    const allWorkspaces: IWorkspaces.IWorkspacesBundle = { ...serverWorkspaces };

    for (const localWorkspace of localResult.values) {
      if (localWorkspace.metadata?.id) {
        allWorkspaces[localWorkspace.metadata.id] = localWorkspace;
      }
    }

    const ids = Object.keys(allWorkspaces);
    const values = Object.values(allWorkspaces);

    return { ids, values };
  }

  /**
   * Clear all workspace data
   *
   * @returns A promise which resolves when the workspace data is cleared
   */
  async clear(): Promise<void> {
    await (await this.storage).clear();
  }

  /**
   * Fetch all workspaces from the server
   *
   * @returns A promise that resolves with server workspaces
   */
  private async _getServerWorkspaces(): Promise<IWorkspaces.IWorkspacesBundle> {
    const workspacesUrl = URLExt.join(this._workspacesApiUrl, 'all.json');

    const response = await fetch(workspacesUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch workspaces: ${response.status} ${response.statusText}`,
      );
    }

    return await response.json();
  }

  private _workspacesApiUrl =
    PageConfig.getOption('workspacesApiUrl') ||
    URLExt.join(PageConfig.getBaseUrl(), 'api/workspaces');
}

/**
 * A namespace for LiteWorkspaceManager.
 */
export namespace LiteWorkspaceManager {
  /**
   * The options for creating LiteWorkspaceManager.
   */
  export interface IOptions extends IndexedDBDataConnector.IOptions {
    /**
     * The server settings.
     */
    settings?: ServerConnection.ISettings;
  }
}
