import { Session } from '@jupyterlab/services';

import { PathExt } from '@jupyterlab/coreutils';

import { IKernelStore } from '@jupyterlite/kernel';

import { ArrayExt } from '@lumino/algorithm';

import { UUID } from '@lumino/coreutils';

import { ISessionStore } from './tokens';

/**
 * A class to handle requests to /api/sessions
 */
export class SessionStore implements ISessionStore {
  /**
   * Construct a new SessionStore.
   *
   * @param options The instantiation options for a Sessions.
   */
  constructor(options: SessionStore.IOptions) {
    this._kernelStore = options.kernelStore;
    // Listen for kernel removals
    this._kernelStore.changed.connect((_, args) => {
      switch (args.type) {
        case 'remove': {
          const kernelId = args.oldValue?.id;
          if (!kernelId) {
            return;
          }
          // find the session associated with the kernel
          const session = this._sessions.find((s) => s.kernel?.id === kernelId);
          if (!session) {
            return;
          }
          // Track the kernel ID for restart detection
          this._pendingRestarts.add(kernelId);
          setTimeout(async () => {
            // If after a short delay the kernel hasn't been re-added, it was terminated
            if (this._pendingRestarts.has(kernelId)) {
              this._pendingRestarts.delete(kernelId);
              await this.shutdown(session.id);
            }
          }, 100);
          break;
        }
        case 'add': {
          // If this was a restart, remove it from pending
          const kernelId = args.newValue?.id;
          if (!kernelId) {
            return;
          }
          this._pendingRestarts.delete(kernelId);
          break;
        }
      }
    });
  }

  /**
   * Get a session by id.
   *
   * @param id The id of the session.
   */
  async get(id: string): Promise<Session.IModel> {
    const session = this._sessions.find((s) => s.id === id);
    if (!session) {
      throw Error(`Session ${id} not found`);
    }
    return session;
  }

  /**
   * List the running sessions
   */
  async list(): Promise<Session.IModel[]> {
    return this._sessions;
  }

  /**
   * Patch an existing session.
   * This can be used to rename a session.
   *
   * - path updates session to track renamed paths
   * - kernel.name starts a new kernel with a given kernelspec
   *
   * @param options The options to patch the session.
   */
  async patch(options: Partial<Session.IModel>): Promise<Session.IModel> {
    const { id, path, name, kernel } = options;
    const index = this._sessions.findIndex((s) => s.id === id);
    const session = this._sessions[index];
    if (!session) {
      throw Error(`Session ${id} not found`);
    }
    const patched = {
      ...session,
      path: path ?? session.path,
      name: name ?? session.name,
    };

    if (kernel) {
      // Kernel id takes precedence over name.
      if (kernel.id) {
        const session = this._sessions.find(
          (session) => session.kernel?.id === kernel?.id,
        );
        if (session) {
          patched.kernel = session.kernel;
        }
      } else if (kernel.name) {
        const newKernel = await this._kernelStore.startNew({
          id: UUID.uuid4(),
          name: kernel.name,
          location: PathExt.dirname(patched.path),
        });

        if (newKernel) {
          patched.kernel = newKernel;
        }

        // clean up the session on kernel shutdown
        void this._handleKernelShutdown({
          kernelId: newKernel.id,
          sessionId: session.id,
        });
      }
    }

    this._sessions[index] = patched;
    return patched;
  }

  /**
   * Start a new session
   * TODO: read path and name
   *
   * @param options The options to start a new session.
   */
  async startNew(options: Session.ISessionOptions): Promise<Session.IModel> {
    const { path, name } = options;
    const running = this._sessions.find((s) => s.name === name);
    if (running) {
      return running;
    }
    const kernelName = options.kernel?.name ?? '';
    const id = UUID.uuid4();
    const nameOrPath = options.name ?? options.path;
    const dirname = PathExt.dirname(options.name) || PathExt.dirname(options.path);
    const hasDrive = nameOrPath.includes(':');
    const driveName = hasDrive ? nameOrPath.split(':')[0] : '';
    // add drive name if missing (top level directory)
    const location = dirname.includes(driveName) ? dirname : `${driveName}:${dirname}`;
    const kernel = await this._kernelStore.startNew({
      id,
      name: kernelName,
      location,
    });
    const session: Session.IModel = {
      id,
      path,
      name: name ?? path,
      type: 'notebook',
      kernel: {
        id: kernel.id,
        name: kernel.name,
      },
    };
    this._sessions.push(session);

    // clean up the session on kernel shutdown
    void this._handleKernelShutdown({ kernelId: id, sessionId: session.id });

    return session;
  }

  /**
   * Shut down a session.
   *
   * @param id The id of the session to shut down.
   */
  async shutdown(id: string): Promise<void> {
    const session = this._sessions.find((s) => s.id === id);
    if (!session) {
      throw Error(`Session ${id} not found`);
    }
    const kernelId = session.kernel?.id;
    if (kernelId) {
      await this._kernelStore.shutdown(kernelId);
    }
    ArrayExt.removeFirstOf(this._sessions, session);
  }

  /**
   * Shut down all sessions.
   */
  async shutdownAll(): Promise<void> {
    await Promise.all(this._sessions.map((s) => this.shutdown(s.id)));
  }

  /**
   * Handle kernel shutdown
   */
  private async _handleKernelShutdown({
    kernelId,
    sessionId,
  }: {
    kernelId: string;
    sessionId: string;
  }): Promise<void> {
    // No need to handle kernel shutdown here anymore since we're using the changed signal
  }

  private _kernelStore: IKernelStore;
  private _sessions: Session.IModel[] = [];
  private _pendingRestarts = new Set<string>();
}

/**
 * A namespace for SessionStore statics.
 */
export namespace SessionStore {
  /**
   * The instantiation options for the session store.
   */
  export interface IOptions {
    /**
     * A reference to the kernels service.
     */
    kernelStore: IKernelStore;
  }
}
