// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import type { KernelSpec } from '@jupyterlab/services';
import { ServerConnection } from '@jupyterlab/services';

import type { IKernelSpecs } from './tokens';

/**
 * Placeholder for the kernel specs.
 */
const EMPTY_KERNELSPECS: KernelSpec.ISpecModels = {
  default: '',
  kernelspecs: {},
};

/**
 * An in-browser client for the kernel spec API.
 */
export class LiteKernelSpecClient implements KernelSpec.IKernelSpecAPIClient {
  /**
   * Construct a new kernel spec client.
   */
  constructor(options: LiteKernelSpecClient.IOptions) {
    this._kernelspecs = options.kernelSpecs;
    this._serverSettings = options.serverSettings ?? ServerConnection.makeSettings();
  }

  /**
   * The server settings used by the client.
   */
  get serverSettings(): ServerConnection.ISettings {
    return this._serverSettings;
  }

  /**
   * Get the kernel specs.
   */
  async get(): Promise<KernelSpec.ISpecModels> {
    return Promise.resolve(this._kernelspecs.specs ?? EMPTY_KERNELSPECS);
  }

  private _kernelspecs: IKernelSpecs;
  private _serverSettings: ServerConnection.ISettings;
}

/**
 * A namespace for LiteKernelSpecClient statics.
 */
export namespace LiteKernelSpecClient {
  /**
   * The options used to create a kernel spec client.
   */
  export interface IOptions {
    /**
     * The in-browser kernel specs.
     */
    kernelSpecs: IKernelSpecs;

    /**
     * The server settings used by the client.
     */
    serverSettings?: ServerConnection.ISettings;
  }
}
