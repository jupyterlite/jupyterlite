import { ServerConnection, Workspace } from '@jupyterlab/services';

import { IndexedDBDataConnector } from './statedb';

export class LiteWorkspaceManager extends IndexedDBDataConnector<Workspace.IWorkspace> {
  constructor(options: LiteWorkspaceManager.IOptions) {
    super({ ...options, storageName: 'JupyterLite Workspaces' });

    this.serverSettings = options.settings || ServerConnection.makeSettings();
  }

  readonly serverSettings: ServerConnection.ISettings;

  /**
   * Clear all workspace data
   *
   * @returns A promise which resolves when the workspace data is cleared
   */
  async clear(): Promise<void> {
    await (await this.storage).clear();
  }
}

/**
 * A namespace for LiteWorkspaceManager.
 */
export namespace LiteWorkspaceManager {
  /**
   * The options for creating LiteWorkspaceManager.
   */
  export interface IOptions extends IndexedDBDataConnector.IOptions {
    settings?: ServerConnection.ISettings;
  }
}
