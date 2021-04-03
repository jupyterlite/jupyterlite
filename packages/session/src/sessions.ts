import { Session } from '@jupyterlab/services';

import { IKernels } from '@jupyterlite/kernel';

import { UUID } from '@lumino/coreutils';

import { ISessions } from './tokens';

const DEFAULT_NAME = 'example.ipynb';

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
   * Path an existing session.
   * This can be used to rename a session.
   * TODO: read path and name
   *
   * @param options The options to patch the session.
   */
  patch(options: Session.IModel): Session.IModel {
    const { id, path, name } = options;
    const session: Session.IModel = {
      id,
      path: path ?? DEFAULT_NAME,
      name: name ?? DEFAULT_NAME,
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
  startNew(options: Session.IModel): Session.IModel {
    const { path, name } = options;
    const kernelName = options.kernel?.name;
    const id = options.id ?? UUID.uuid4();
    const kernel = this._kernels.startNew({ id, name: kernelName });
    const session: Session.IModel = {
      id,
      path: path ?? name,
      name: name ?? DEFAULT_NAME,
      type: 'notebook',
      kernel: {
        id: kernel.id,
        name: kernel.name
      }
    };
    return session;
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
