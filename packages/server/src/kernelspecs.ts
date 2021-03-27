import { KernelSpec } from '@jupyterlab/services';

import { Router } from './router';

import { IJupyterServer } from './tokens';

/**
 * A class to handle requests to /api/kernelspecs
 */
export class KernelSpecs implements IJupyterServer.IRoutable {
  /**
   * Construct a new KernelSpecs.
   */
  constructor() {
    this._router.add('GET', '/api/kernelspecs', async (req: Request) => {
      const specs = this.get();
      return new Response(JSON.stringify(specs));
    });
  }

  /**
   * Get the kernel specs.
   */
  get(): KernelSpec.ISpecModels {
    return Private.DEFAULT_SPECS;
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
 * A namespace for KernelSpecs statics.
 */
export namespace KernelSpecs {
  /**
   * The url for the kernelspec service.
   */
  export const KERNELSPEC_SERVICE_URL = '/api/kernelspecs';
}

/**
 * A namespace for private data.
 */
namespace Private {
  export const DEFAULT_SPECS: KernelSpec.ISpecModels = {
    default: 'JavaScript',
    kernelspecs: {
      javascript: {
        name: 'javascript',
        display_name: 'JavaScript',
        language: 'javascript',
        argv: [],
        spec: {
          argv: [],
          env: {},
          display_name: 'JavaScript',
          language: 'javascript',
          interrupt_mode: 'message',
          metadata: {}
        },
        resources: {
          'logo-32x32': 'TODO',
          'logo-64x64': '/kernelspecs/javascript.svg'
        }
      }
    }
  };
}
