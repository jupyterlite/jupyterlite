import { Session } from '@jupyterlab/services';

import { IKernels } from '@jupyterlite/kernel';

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
    console.log(`get session ${id}`);
    return {
      id,
      kernel: { id: '', name: '' },
      name: '',
      path: '',
      type: ''
    };
  }

  /**
   * List the running sessions
   */
  async list(): Promise<Session.IModel[]> {
    return [];
  }

  /**
   * Path an existing session.
   * This can be used to rename a session.
   * TODO: read path and name
   *
   * @param options The options to patch the session.
   */
  async patch(options: Session.IModel): Promise<Session.IModel> {
    const { id, path, name } = options;
    const session: Session.IModel = {
      id,
      path: path ?? name,
      name: name ?? path,
      type: 'notebook',
      kernel: {
        id: id,
        name: 'javascript'
      }
    };
    return session;
  }

  /**
   * Start a new session
   * TODO: read path and name
   *
   * @param options The options to start a new session.
   */
  async startNew(options: Session.IModel): Promise<Session.IModel> {
    const { path, name } = options;
    const kernelName = options.kernel?.name ?? '';
    const id = options.id ?? UUID.uuid4();
    const kernel = this._kernels.startNew({ id, name: kernelName });
    const session: Session.IModel = {
      id,
      path,
      name: name ?? path,
      type: 'notebook',
      kernel: {
        id: kernel.id,
        name: kernel.name
      }
    };
    return session;
  }

  /**
   * Shut down a session.
   *
   * @param id The id of the session to shut down.
   */
  async shutdown(id: string): Promise<void> {
    console.log(`shut down session ${id}`);
  }

  private _kernels: IKernels;
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
