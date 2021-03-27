import { Router } from './router';

/**
 * A class to handle requests to /api/themes
 */
export class Themes {
  /**
   * Construct a new Themes.
   */
  constructor() {
    // TODO?
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
 * A namespace for Themes statics.
 */
export namespace Themes {
  /**
   * The url for the themes service.
   */
  export const THEMES_SERVICE_URL = '/api/themes';
}
