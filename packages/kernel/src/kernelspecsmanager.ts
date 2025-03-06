// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { BaseManager, KernelSpec, ServerConnection } from '@jupyterlab/services';
import { ISignal, Signal } from '@lumino/signaling';
import { IKernelSpecs } from './tokens';

/**
 * A class to manage in-browser kernel specs.
 */
export class LiteKernelSpecs extends BaseManager implements KernelSpec.IManager {
  /**
   * Construct a new kernel specs manager.
   */
  constructor(options: LiteKernelSpecs.IOptions) {
    super(options);
    this._kernelSpecs = options.kernelSpecs;
  }

  /**
   * A signal emitted when there is a connection failure.
   */
  get connectionFailure(): ISignal<this, Error> {
    return this._connectionFailure;
  }

  /**
   * Test whether the manager is ready.
   */
  get isReady(): boolean {
    return this._isReady;
  }

  /**
   * A promise that fulfills when the manager is ready.
   */
  get ready(): Promise<void> {
    return this._ready;
  }

  /**
   * Get the kernel specs.
   */
  get specs(): KernelSpec.ISpecModels | null {
    return this._kernelSpecs.specs;
  }

  /**
   * A signal emitted when the specs change.
   */
  get specsChanged(): ISignal<this, KernelSpec.ISpecModels> {
    return this._specsChanged;
  }

  /**
   * Force a refresh of the specs from the server.
   */
  refreshSpecs(): Promise<void> {
    // no-op
    return Promise.resolve(void 0);
  }

  private _kernelSpecs: IKernelSpecs;
  private _isReady = false;
  private _connectionFailure = new Signal<this, Error>(this);
  private _ready: Promise<void> = Promise.resolve(void 0);
  private _specsChanged = new Signal<this, KernelSpec.ISpecModels>(this);
}

/**
 * The namespace for `LiteKernelSpecs` class statics.
 */
export namespace LiteKernelSpecs {
  /**
   * The instantiation options for a kernel specs manager.
   */
  export interface IOptions {
    /**
     * The in-browser kernel specs.
     */
    kernelSpecs: IKernelSpecs;

    /**
     * The server settings.
     */
    serverSettings?: ServerConnection.ISettings;
  }
}
