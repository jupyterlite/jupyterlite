import { ReadonlyJSONObject } from '@lumino/coreutils';

/**
 * A simple router.
 */
export class Router {
  /**
   * Add a new GET route
   *
   * @param pattern The pattern to match
   * @param callback The function to call on pattern match
   *
   */
  get(pattern: string | RegExp, callback: Router.Callback): void {
    this._add('GET', pattern, callback);
  }

  /**
   * Add a new PUT route
   *
   * @param pattern The pattern to match
   * @param callback The function to call on pattern match
   *
   */
  put(pattern: string | RegExp, callback: Router.Callback): void {
    this._add('PUT', pattern, callback);
  }

  /**
   * Add a new POST route
   *
   * @param pattern The pattern to match
   * @param callback The function to call on pattern match
   *
   */
  post(pattern: string | RegExp, callback: Router.Callback): void {
    this._add('POST', pattern, callback);
  }

  /**
   * Add a new PATCH route
   *
   * @param pattern The pattern to match
   * @param callback The function to call on pattern match
   *
   */
  patch(pattern: string | RegExp, callback: Router.Callback): void {
    this._add('PATCH', pattern, callback);
  }

  /**
   * Add a new DELETE route
   *
   * @param pattern The pattern to match
   * @param callback The function to call on pattern match
   *
   */
  delete(pattern: string | RegExp, callback: Router.Callback): void {
    this._add('DELETE', pattern, callback);
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
      if (r.method !== method) {
        continue;
      }
      const match = pathname.match(r.pattern);
      if (!match) {
        continue;
      }
      const matches = match.slice(1);
      let body;
      if (r.method === 'PATCH' || r.method === 'PUT' || r.method === 'POST') {
        try {
          body = JSON.parse(await req.text());
        } catch {
          body = undefined;
        }
      }
      return r.callback.call(
        null,
        {
          pathname,
          body,
          query: Object.fromEntries(url.searchParams),
        },
        ...matches
      );
    }

    throw new Error('Cannot route ' + req.method + ' ' + req.url);
  }

  /**
   * Add a new route.
   *
   * @param method The method
   * @param pattern The pattern
   * @param callback The callback
   */
  private _add(
    method: Router.Method,
    pattern: string | RegExp,
    callback: Router.Callback
  ): void {
    if (typeof pattern === 'string') {
      pattern = new RegExp(pattern);
    }
    this._routes.push({
      method,
      pattern,
      callback,
    });
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
  export type Callback = (req: IRequest, ...args: string[]) => Promise<Response>;

  /**
   * The Method type.
   */
  export type Method = 'GET' | 'PUT' | 'POST' | 'PATCH' | 'DELETE';

  /**
   * The interface for a parsed request
   */
  export interface IRequest {
    /**
     * The path for the url.
     */
    pathname: string;

    /**
     * The optional query parameters.
     */
    query?: ReadonlyJSONObject;

    /**
     * The optional body parameters.
     */
    body?: ReadonlyJSONObject;
  }

  /**
   * An interface for a route.
   */
  export interface IRoute {
    method: Method;
    pattern: string | RegExp;
    callback: Callback;
  }
}
