import { Kernel, Session, SessionManager } from '@jupyterlab/services';

import { LiteSessionConnection } from './connection';

import { ISessionStore } from './tokens';

/**
 * A custom session manager for JupyterLite, to be able to override the default
 * `SessionConnection` and use of the Jupyter Server Session API.
 */
export class LiteSessionManager extends SessionManager implements Session.IManager {
  /**
   * Construct a new LiteSessionManager.
   *
   * @param options The instantiation options
   */
  constructor(options: LiteSessionManager.IOptions) {
    super(options);
    const { kernelManager, sessionStore } = options;
    this._connectToLiteKernel = kernelManager.connectTo.bind(kernelManager);
    this._sessionStore = sessionStore;
  }

  /*
   * Connect to a running session.
   */
  connectTo(
    options: Omit<
      Session.ISessionConnection.IOptions,
      'connectToKernel' | 'serverSettings'
    >,
  ): Session.ISessionConnection {
    const sessionConnection = new LiteSessionConnection({
      ...options,
      connectToKernel: this._connectToLiteKernel,
      serverSettings: this.serverSettings,
      sessionStore: this._sessionStore,
    });
    this['_onStarted'](sessionConnection);
    void this.refreshRunning().catch(() => {
      /* no-op */
    });

    return sessionConnection;
  }

  /**
   * Start a new session.
   */
  async startNew(
    createOptions: Session.ISessionOptions,
    connectOptions: Omit<
      Session.ISessionConnection.IOptions,
      'model' | 'connectToKernel' | 'serverSettings'
    > = {},
  ): Promise<Session.ISessionConnection> {
    const model = await this._sessionStore.startNew(createOptions);
    await this.refreshRunning();
    return this.connectTo({ ...connectOptions, model });
  }

  /**
   * Shut down a session by id.
   */
  async shutdown(id: string): Promise<void> {
    await this._sessionStore.shutdown(id);
    await this.refreshRunning();
  }

  /**
   * Shut down all sessions.
   */
  async shutdownAll(): Promise<void> {
    await this._sessionStore.shutdownAll();
    await this.refreshRunning();
  }

  /**
   * Find a session associated with a path and stop it if it is the only session
   * using that kernel.
   *
   * @returns A promise that resolves when the relevant sessions are stopped.
   */
  async stopIfNeeded(path: string): Promise<void> {
    try {
      const sessions = await this._sessionStore.list();
      const matches = sessions.filter((value) => value.path === path);
      if (matches.length === 1) {
        const id = matches[0].id;
        await this.shutdown(id);
      }
    } catch (error) {
      /* Always succeed. */
    }
  }

  /**
   * Execute a request to the server to poll running kernels and update state.
   */
  protected async requestRunning(): Promise<void> {
    if (this.isDisposed) {
      return;
    }

    const models = await this._sessionStore.list();

    const _models = this['_models'];
    if (
      _models.size === models.length &&
      models.every((model) => {
        const existing = _models.get(model.id);
        if (!existing) {
          return false;
        }
        return (
          existing.kernel?.id === model.kernel?.id &&
          existing.kernel?.name === model.kernel?.name &&
          existing.name === model.name &&
          existing.path === model.path &&
          existing.type === model.type
        );
      })
    ) {
      // Identical models list (presuming models does not contain duplicate
      // ids), so just return
      return;
    }

    this['_models'] = new Map(models.map((x) => [x.id, x]));

    this['_sessionConnections'].forEach((sc: LiteSessionConnection) => {
      if (this['_models'].has(sc.id)) {
        sc.update(this['_models'].get(sc.id)!);
      } else {
        sc.dispose();
      }
    });

    this['_runningChanged'].emit(models);
  }

  private _sessionStore: ISessionStore;
  private readonly _connectToLiteKernel: (
    options: Omit<Kernel.IKernelConnection.IOptions, 'serverSettings'>,
  ) => Kernel.IKernelConnection;
}

/**
 * A namespace for sessions statics.
 */
export namespace LiteSessionManager {
  /**
   * The instantiation options for the sessions.
   */
  export interface IOptions extends SessionManager.IOptions {
    /**
     * The session store.
     */
    sessionStore: ISessionStore;
  }
}
