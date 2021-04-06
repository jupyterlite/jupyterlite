import { ServiceManager, ServerConnection } from '@jupyterlab/services';

import { WebSocket } from 'mock-socket';

import { JupyterServer } from './server';

/**
 * A custom ServiceManager to run in the browser
 */
export class LiteServiceManager extends ServiceManager {
  /**
   * Construct a new service provider.
   *
   * @param options The instantiation options for the service manager.
   */
  constructor(options: LiteServiceManager.IOptions) {
    const server = options.server;
    super({
      ...options,
      serverSettings: {
        ...ServerConnection.makeSettings(),
        WebSocket,
        fetch: server.fetch.bind(server) ?? undefined
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

/**
 * A namespace for LiteServiceManager statics.
 */
export namespace LiteServiceManager {
  /**
   * The instantiation options for a LiteServiceManager.
   */
  export interface IOptions extends ServiceManager.IOptions {
    /**
     * The JupyterServer
     */
    server: JupyterServer;
  }
}
