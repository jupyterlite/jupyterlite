import { KernelSpec } from '@jupyterlab/services';

/**
 * A class to handle requests to /api/kernelspecs
 */
export class KernelSpecs {
  /**
   * Get the kernel specs.
   */
  get specs(): KernelSpec.ISpecModels | null {
    return Private.DEFAULT_SPECS;
  }
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
