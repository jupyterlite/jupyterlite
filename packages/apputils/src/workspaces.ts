import { ServerConnection, Workspace } from '@jupyterlab/services';

import { IndexedDBDataConnector } from './statedb';

export class WorkspaceManager extends IndexedDBDataConnector<Workspace.IWorkspace> {
  constructor(options: IndexedDBDataConnector.IOptions) {
    super({ ...options, storageName: 'JupyterLite Workspaces' });

    this.serverSettings = ServerConnection.makeSettings();
  }

  /**
   * TODO Remove this from upstream implementation of WorkspaceManager?
   */
  readonly serverSettings: ServerConnection.ISettings;
}
