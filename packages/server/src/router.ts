/**
 * A simple router.
 */
export class Router {
  /**
   * Add a new route.
   *
   * @param method The method
   * @param pattern The pattern
   * @param callback The callback
   */
  add(
    method: Router.Method,
    pattern: string | RegExp,
    callback: Router.Callback
  ): void {
    this._routes.push({
      method,
      pattern,
      callback
    });
  }

  /**
   * Route a request.
   *
   * @param req The request to route.
   */
  async route(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const { method } = req;
    const { pathname } = url;

    for (const r of this._routes) {
      if (r.method === method && pathname.match(r.pattern)) {
        return r.callback.call(null, req);
      }
    }

    throw new Error('Cannot route ' + req.method + ' ' + req.url);
  }

  private _routes: Router.IRoute[] = [];
}

/**
 * A namespace for Router statics.
 */
export namespace Router {
  /**
   * The Callback type.
   */
  export type Callback = (req: Request) => Promise<Response>;

  /**
   * The Method type.
   */
  export type Method = 'GET' | 'PUT' | 'POST' | 'PATCH' | 'DELETE';

  /**
   * An interface for a route.
   */
  export interface IRoute {
    method: Method;
    pattern: string | RegExp;
    callback: Callback;
  }
}
