import { Contents } from './contents';

import { KernelSpecs } from './kernelspecs';

import { Kernels } from './kernels';

import { Sessions } from './sessions';

import { Settings } from './settings';

import { Themes } from './themes';
import { NbConvert } from './nbconvert';

/**
 * A (very, very) simplified Jupyter Server running in the browser.
 */
export class JupyterServer {
  /**
   * Handle an incoming request from the client.
   *
   * @param req The incoming request
   * @param init The optional init request
   */
  async fetch(
    req: RequestInfo,
    init?: RequestInit | null | undefined
  ): Promise<Response> {
    if (!(req instanceof Request)) {
      throw Error('Request info is not a Request');
    }

    // dispatch requests
    // TODO: reuse an existing routing library?
    if (req.url.match(Contents.CONTENTS_SERVICE_URL)) {
      return this._contents.dispatch(req);
    } else if (req.url.match(KernelSpecs.KERNELSPEC_SERVICE_URL)) {
      return this._kernelspecs.dispatch(req);
    } else if (req.url.match(Sessions.SESSION_SERVICE_URL)) {
      return this._sessions.dispatch(req);
    } else if (req.url.match(Kernels.KERNEL_SERVICE_URL)) {
      return this._kernels.dispatch(req);
    } else if (req.url.match(Settings.SETTINGS_SERVICE_URL)) {
      return this._settings.dispatch(req);
    } else if (req.url.match(Themes.THEMES_SERVICE_URL)) {
      return this._themes.dispatch(req);
    } else if (req.url.match(NbConvert.NBCONVERT_SERVICE_URL)) {
      return this._nbconvert.dispatch(req);
    }
    return new Response(null);
  }

  private _kernelspecs = new KernelSpecs();
  private _contents = new Contents();
  private _kernels = new Kernels();
  private _settings = new Settings();
  private _themes = new Themes();
  private _nbconvert = new NbConvert();
  private _sessions = new Sessions({ kernels: this._kernels });
}

/**
 * A namespace for JupyterServer statics.
 */
export namespace JupyterServer {}
