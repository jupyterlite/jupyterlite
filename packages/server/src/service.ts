import { ServiceManager, ServerConnection } from '@jupyterlab/services';

import { WebSocket } from 'mock-socket';

import { JupyterServer } from './server';

/**
 * A custom ServiceManager to run in the browser
 */
export class BrowserServiceManager extends ServiceManager {
  /**
   * Construct a new service provider.
   *
   * @param options The instantiation options for the service manager.
   */
  constructor(options: ServiceManager.IOptions = {}) {
    const server = new JupyterServer();
    super({
      ...options,
      serverSettings: {
        ...ServerConnection.makeSettings(),
        WebSocket,
        fetch: server.fetch.bind(server)
      }
    });
    this._server = server;
  }

  /**
   * Get the underlying Jupyter Server
   */
  get server(): JupyterServer {
    return this._server;
  }

  private _server: JupyterServer;
}
