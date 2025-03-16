// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { Kernel, KernelConnection, KernelSpec } from '@jupyterlab/services';
import { IKernelSpecs } from './tokens';

/**
 * Custom KernelConnection class for use in JupyterLite.
 *
 * TODO: remove the entire file after https://github.com/jupyterlab/jupyterlab/pull/17395
 */
export class LiteKernelConnection
  extends KernelConnection
  implements Kernel.IKernelConnection
{
  constructor(options: LiteKernelConnection.IOptions) {
    super(options);
    this._kernelSpecs = options.kernelSpecs;
  }

  /**
   * The kernel spec.
   *
   * @returns A promise that resolves to the kernel spec.
   */
  get spec(): Promise<KernelSpec.ISpecModel | undefined> {
    const spec = this._kernelSpecs.specs?.kernelspecs[this.model.name];
    return Promise.resolve(spec);
  }

  /**
   * Clone the current kernel with a new clientId.
   */
  clone(
    options: Pick<
      Kernel.IKernelConnection.IOptions,
      'clientId' | 'username' | 'handleComms'
    > = {},
  ): Kernel.IKernelConnection {
    return new LiteKernelConnection({
      model: this.model,
      username: this.username,
      serverSettings: this.serverSettings,
      // handleComms defaults to false since that is safer
      handleComms: false,
      kernelSpecs: this._kernelSpecs,
      kernelAPIClient: this['_kernelAPIClient'],
      ...options,
    });
  }

  private _kernelSpecs: IKernelSpecs;
}

/**
 * A namespace for LiteKernelConnection statics.
 */
export namespace LiteKernelConnection {
  /**
   * The options used to create a LiteKernelConnection.
   */
  export interface IOptions extends Kernel.IKernelConnection.IOptions {
    /**
     * The kernel specs.
     */
    kernelSpecs: IKernelSpecs;
  }
}
