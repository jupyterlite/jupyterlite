import { Session } from '@jupyterlab/services';

import { PathExt } from '@jupyterlab/coreutils';

import { IKernels } from '@jupyterlite/kernel';

import { ArrayExt } from '@lumino/algorithm';

import { UUID } from '@lumino/coreutils';

import { ISessions } from './tokens';

/**
 * A class to handle requests to /api/sessions
 */
export class Sessions implements ISessions {
  /**
   * Construct a new Sessions.
   *
   * @param options The instantiation options for a Sessions.
   */
  constructor(options: Sessions.IOptions) {
    this._kernels = options.kernels;
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
  async patch(options: Session.IModel): Promise<Session.IModel> {
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
        const newKernel = await this._kernels.startNew({
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
  async startNew(options: Session.IModel): Promise<Session.IModel> {
    const { path, name } = options;
    const running = this._sessions.find((s) => s.name === name);
    if (running) {
      return running;
    }
    const kernelName = options.kernel?.name ?? '';
    const id = options.id ?? UUID.uuid4();
    const nameOrPath = options.name ?? options.path;
    const dirname = PathExt.dirname(options.name) || PathExt.dirname(options.path);
    const hasDrive = nameOrPath.includes(':');
    const driveName = hasDrive ? nameOrPath.split(':')[0] : '';
    // add drive name if missing (top level directory)
    const location = dirname.includes(driveName) ? dirname : `${driveName}:${dirname}`;
    const kernel = await this._kernels.startNew({
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
      await this._kernels.shutdown(kernelId);
    }
    ArrayExt.removeFirstOf(this._sessions, session);
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
    const runningKernel = await this._kernels.get(kernelId);
    if (runningKernel) {
      runningKernel.disposed.connect(() => {
        // eslint-disable-next-line no-console
        console.log('Session', sessionId, 'shut down');
        // this.shutdown(sessionId);
      });
    }
  }

  private _kernels: IKernels;
  // TODO: offload to a database
  private _sessions: Session.IModel[] = [];
}

/**
 * A namespace for sessions statics.
 */
export namespace Sessions {
  /**
   * The instantiation options for the sessions.
   */
  export interface IOptions {
    /**
     * A reference to the kernels service.
     */
    kernels: IKernels;
  }
}
