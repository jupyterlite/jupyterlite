import { Session } from '@jupyterlab/services';

import { UUID } from '@lumino/coreutils';

import { Kernels } from './kernels';

import { Router } from './router';

import { IJupyterServer } from './tokens';

const DEFAULT_NAME = 'example.ipynb';

/**
 * A class to handle requests to /api/sessions
 */
export class Sessions implements IJupyterServer.IRoutable {
  /**
   * Construct a new Sessions.
   *
   * @param options The instantiation options for a Sessions.
   */
  constructor(options: Sessions.IOptions) {
    this._kernels = options.kernels;

    this._router.add('GET', '/api/sessions.*', async (req: Request) => {
      return new Response(JSON.stringify([]), { status: 200 });
    });

    this._router.add('PATCH', '/api/sessions.*', async (req: Request) => {
      const payload = await req.text();
      const options = JSON.parse(payload);
      const session = this._patch(options);
      return new Response(JSON.stringify(session), { status: 200 });
    });

    this._router.add('DELETE', '/api/sessions.*', async (req: Request) => {
      return new Response(null, { status: 204 });
    });

    this._router.add('POST', '/api/sessions.*', async (req: Request) => {
      const payload = await req.text();
      const options = JSON.parse(payload);
      const session = this.startNew(options);
      return new Response(JSON.stringify(session), { status: 201 });
    });
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

  /**
   * Patch a session
   * TODO: read path and name
   *
   * @param options The options to start a new session.
   */
  private _patch(options: Session.IModel): Session.IModel {
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
   * Dispatch a request to the local router.
   *
   * @param req The request to dispatch.
   */
  dispatch(req: Request): Promise<Response> {
    return this._router.route(req);
  }

  private _router = new Router();
  private _kernels: Kernels;
}

/**
 * A namespace for sessions statics.
 */
export namespace Sessions {
  /**
   * The url for the sessions service.
   */
  export const SESSION_SERVICE_URL = '/api/sessions';

  /**
   * The instantiation options for the sessions.
   */
  export interface IOptions {
    /**
     * A reference to the kernels service.
     */
    kernels: Kernels;
  }
}
