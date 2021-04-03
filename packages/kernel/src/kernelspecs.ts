import { KernelSpec } from '@jupyterlab/services';

import { IKernel, IKernelSpecs } from './tokens';

/**
 * A class to handle requests to /api/kernelspecs
 */
export class KernelSpecs implements IKernelSpecs {
  /**
   * Construct a new KernelSpecs.
   *
   * @param options The instantiation options.
   */
  constructor(options: KernelSpecs.IOptions) {
    console.log(options);
  }

  /**
   * Get the kernel specs.
   */
  get specs(): KernelSpec.ISpecModels | null {
    if (this._specs.size === 0) {
      return null;
    }
    return {
      default: 'javascript',
      kernelspecs: Object.fromEntries(this._specs)
    };
  }

  /**
   * Get the kernel factories for the current kernels.
   */
  get factories(): KernelSpecs.KernelFactories {
    return this._factories;
  }

  /**
   * Register a new kernel.
   */
  register(options: KernelSpecs.IKernelOptions): void {
    const { spec, create } = options;
    this._specs.set(spec.name, spec);
    this._factories.set(spec.name, create);
  }

  private _specs = new Map<string, KernelSpec.ISpecModel>();
  private _factories = new Map<string, KernelSpecs.KernelFactory>();
}

/**
 * A namespace for KernelSpecs statics.
 */
export namespace KernelSpecs {
  /**
   * The instantiation options for a KernelSpecs
   */
  export interface IOptions {}

  /**
   * Registration options for a new kernel.
   */
  export interface IKernelOptions {
    spec: KernelSpec.ISpecModel;
    create: KernelFactory;
  }

  export type KernelFactory = (options: IKernel.IOptions) => Promise<IKernel>;

  export type KernelFactories = Map<string, KernelFactory>;
}
