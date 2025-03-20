// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { KernelSpec, ServerConnection } from '@jupyterlab/services';

import { IKernelSpecs } from './tokens';

/**
 * Placeholder for the kernel specs.
 */
const EMPTY_KERNELSPECS: KernelSpec.ISpecModels = {
  default: '',
  kernelspecs: {},
};

export class LiteKernelSpecClient implements KernelSpec.IKernelSpecAPIClient {
  constructor(options: LiteKernelSpecClient.IOptions) {
    this._kernelspecs = options.kernelSpecs;
    this._serverSettings = options.serverSettings ?? ServerConnection.makeSettings();
  }

  get serverSettings(): ServerConnection.ISettings {
    return this._serverSettings;
  }

  async get(): Promise<KernelSpec.ISpecModels> {
    return Promise.resolve(this._kernelspecs.specs ?? EMPTY_KERNELSPECS);
  }

  private _kernelspecs: IKernelSpecs;
  private _serverSettings: ServerConnection.ISettings;
}

export namespace LiteKernelSpecClient {
  export interface IOptions {
    kernelSpecs: IKernelSpecs;
    serverSettings?: ServerConnection.ISettings;
  }
}
