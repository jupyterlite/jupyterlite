import { Kernel } from '@jupyterlab/services';

import { Token } from '@lumino/coreutils';

import { Kernels } from './kernels';

import { KernelRegistry } from './registry';

/**
 * The token for the kernels service.
 */
export const IKernels = new Token<IKernels>('@jupyterlite/kernel:IKernels');

/**
 * The token for the kernel registry.
 */
export const IKernelRegistry = new Token<IKernelRegistry>(
  '@jupyterlite/kernel:IKernelRegistry'
);

/**
 * An interface for the Kernels service.
 */
export interface IKernels {
  /**
   * Start a new kernel.
   *
   * @param options The kernel startup options.
   */
  startNew: (options: Kernels.IKernelOptions) => Kernel.IModel;
}

/**
 * An interface for the KernelRegistry service.
 */
export interface IKernelRegistry {
  /**
   * Register a new kernel.
   */
  register: (options: KernelRegistry.IKernelOptions) => void;
}
