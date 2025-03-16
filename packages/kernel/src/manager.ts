// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { BaseManager, Kernel, KernelManager } from '@jupyterlab/services';

import { LiteKernelConnection } from './connection';

import { IKernelSpecs, IKernelClient } from './tokens';

/**
 * A custom kernel manager for JupyterLite, to be able to override the default
 * `KernelConnection` and use of the Jupyter Server Kernel API.
 *
 * TODO: remove the entire the file after https://github.com/jupyterlab/jupyterlab/pull/17395.
 */
export class LiteKernelManager extends KernelManager implements Kernel.IManager {
  /**
   * Construct a new Kernels
   *
   * @param options The instantiation options
   */
  constructor(options: LiteKernelManager.IOptions) {
    super({
      ...options,
      kernelAPIClient: options.kernelClient,
    });
    const { kernelSpecs, kernelClient } = options;
    this._kernelSpecs = kernelSpecs;
    this._kernelClient = kernelClient;
  }

  /**
   * Connect to an existing kernel.
   */
  connectTo(
    options: Omit<Kernel.IKernelConnection.IOptions, 'serverSettings'>,
  ): Kernel.IKernelConnection {
    const { id } = options.model;

    let handleComms = options.handleComms ?? true;
    // By default, handle comms only if no other kernel connection is.
    if (options.handleComms === undefined) {
      for (const kc of this['_kernelConnections']) {
        if (kc.id === id && kc.handleComms) {
          handleComms = false;
          break;
        }
      }
    }
    const kernelConnection = new LiteKernelConnection({
      handleComms,
      ...options,
      serverSettings: this.serverSettings,
      kernelSpecs: this._kernelSpecs,
      kernelAPIClient: this._kernelClient,
    });
    this['_onStarted'](kernelConnection);
    void this.refreshRunning().catch(() => {
      /* no-op */
    });
    return kernelConnection;
  }

  private _kernelSpecs: IKernelSpecs;
  private _kernelClient: IKernelClient;
}

/**
 * A namespace for Kernels statics.
 */
export namespace LiteKernelManager {
  /**
   * The options used to initialize a LiteKernelManager.
   */
  export interface IOptions extends BaseManager.IOptions {
    /**
     * The in-browser kernel specs service.
     */
    kernelSpecs: IKernelSpecs;

    /**
     * The kernel client.
     */
    kernelClient: IKernelClient;
  }
}
