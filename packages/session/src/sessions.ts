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
   * Path an existing session.
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
          (session) => session.kernel?.id === kernel?.id
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
    const kernel = await this._kernels.startNew({
      id,
      name: kernelName,
      location: PathExt.dirname(options.path),
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
