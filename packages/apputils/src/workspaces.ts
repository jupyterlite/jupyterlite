import { ServerConnection, Workspace } from '@jupyterlab/services';

import { IndexedDBDataConnector } from './statedb';

export class LiteWorkspaceManager extends IndexedDBDataConnector<Workspace.IWorkspace> {
  constructor(options: LiteWorkspaceManager.IOptions) {
    super({ ...options, storageName: 'JupyterLite Workspaces' });

    this.serverSettings = options.settings;
  }

  /**
   * TODO Remove this from upstream implementation of WorkspaceManager?
   */
  readonly serverSettings: ServerConnection.ISettings;
}

/**
 * A namespace for LiteWorkspaceManager.
 */
export namespace LiteWorkspaceManager {
  /**
   * The options for creating LiteWorkspaceManager.
   */
  export interface IOptions extends IndexedDBDataConnector.IOptions {
    settings: ServerConnection.ISettings;
  }
}
