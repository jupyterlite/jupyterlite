import { PageConfig } from '@jupyterlab/coreutils';

import { KernelSpec } from '@jupyterlab/services';

import { IKernel, IKernelSpecs, FALLBACK_KERNEL } from './tokens';

/**
 * A class to handle requests to /api/kernelspecs
 */
export class KernelSpecs implements IKernelSpecs {
  /**
   * Get the kernel specs.
   */
  get specs(): KernelSpec.ISpecModels | null {
    if (this._specs.size === 0) {
      return null;
    }

    return {
      default: this.defaultKernelName,
      kernelspecs: Object.fromEntries(this._specs),
    };
  }

  /**
   * Get the default kernel name.
   */
  get defaultKernelName(): string {
    let defaultKernelName = PageConfig.getOption('defaultKernelName');

    if (!defaultKernelName && this._specs.size) {
      const keys = Array.from(this._specs.keys());
      keys.sort();
      defaultKernelName = keys[0];
    }

    return defaultKernelName || FALLBACK_KERNEL;
  }

  /**
   * Get the kernel factories for the current kernels.
   */
  get factories(): KernelSpecs.KernelFactories {
    return this._factories;
  }

  /**
   * Register a new kernel.
   *
   * @param options The options to register a new kernel.
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
   * Registration options for a new kernel.
   */
  export interface IKernelOptions {
    /**
     * The kernel spec.
     */
    spec: KernelSpec.ISpecModel;

    /**
     * The factory function to instantiate a new kernel.
     */
    create: KernelFactory;
  }

  /**
   * The type for a kernel factory function used to instantiate new kernels.
   */
  export type KernelFactory = (options: IKernel.IOptions) => Promise<IKernel>;

  /**
   * The type for the record of kernel factory functions.
   */
  export type KernelFactories = Map<string, KernelFactory>;
}
