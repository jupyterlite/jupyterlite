import { Router } from './router';

/**
 * A class to handle requests to /api/nbconvert
 */
export class NbConvert {
  /**
   * Construct a new NbConvert.
   */
  constructor() {
    this._router.add(
      'GET',
      NbConvert.NBCONVERT_SERVICE_URL,
      async (req: Request) => {
        return new Response(JSON.stringify({}));
      }
    );
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
}

/**
 * A namespace for NbConvert statics.
 */
export namespace NbConvert {
  /**
   * The url for the themes service.
   */
  export const NBCONVERT_SERVICE_URL = '/api/nbconvert';
}
