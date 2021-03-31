import { KernelSpec } from '@jupyterlab/services';

import { IKernel } from './kernel';

export interface IKernelRegistry {
  /**
   * Register a new kernel.
   */
  register: (options: KernelRegistry.IKernelOptions) => void;
}

/**
 * A registry to register new kernels.
 */
export class KernelRegistry implements IKernelRegistry {
  /**
   * Register a new kernel.
   */
  register(options: KernelRegistry.IKernelOptions): void {
    const { spec, create } = options;
    this._kernels.set(spec.name, create);
  }

  /**
   * Get the list of kernels currently registered
   */
  get kernels(): KernelRegistry.KernelFactories {
    return this._kernels;
  }

  private _kernels = new Map<string, KernelRegistry.KernelFactory>();
}

/**
 * A namespace for KernelRegistry statics.
 */
export namespace KernelRegistry {
  /**
   * Instantiation options for a new KernelRegistry.
   */
  export interface IKernelOptions {
    spec: KernelSpec.ISpecModel;
    create: KernelFactory;
  }

  export type KernelFactory = (options: IKernel.IOptions) => void;

  export type KernelFactories = Map<string, KernelRegistry.KernelFactory>;
}
