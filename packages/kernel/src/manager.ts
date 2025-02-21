// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { BaseManager, Kernel, KernelManager } from '@jupyterlab/services';

import { LiteKernelConnection } from './connection';

import { IKernelSpecs, IKernelStore } from './tokens';

/**
 * A custom kernel manager for JupyterLite, to be able to override the default
 * `KernelConnection` and use of the Jupyter Server Kernel API.
 */
export class LiteKernelManager extends KernelManager implements Kernel.IManager {
  /**
   * Construct a new Kernels
   *
   * @param options The instantiation options
   */
  constructor(options: LiteKernelManager.IOptions) {
    super(options);
    const { kernelSpecs, kernelStore } = options;
    this._kernelspecs = kernelSpecs;
    this._kernelStore = kernelStore;
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
      kernelSpecs: this._kernelspecs,
      kernelStore: this._kernelStore,
    });
    this['_onStarted'](kernelConnection);
    void this.refreshRunning().catch(() => {
      /* no-op */
    });
    return kernelConnection;
  }

  /**
   * Start a new kernel.
   *
   * @param createOptions - The kernel creation options
   *
   * @param connectOptions - The kernel connection options
   *
   * @returns A promise that resolves with the kernel connection.
   *
   * #### Notes
   * The manager `serverSettings` will be always be used.
   */
  async startNew(
    createOptions: Kernel.IKernelOptions = {},
    connectOptions: Omit<
      Kernel.IKernelConnection.IOptions,
      'model' | 'serverSettings'
    > = {},
  ): Promise<Kernel.IKernelConnection> {
    const model = await this._kernelStore.startNew(createOptions);
    return this.connectTo({
      ...connectOptions,
      model,
    });
  }

  /**
   * Shut down a kernel by id.
   */
  async shutdown(id: string): Promise<void> {
    await this._kernelStore.shutdown(id);
    await this.refreshRunning();
  }

  /**
   * Shut down all kernels.
   */
  async shutdownAll(): Promise<void> {
    await this._kernelStore.shutdownAll();
    await this.refreshRunning();
  }

  /**
   * Execute a request to the server to poll running kernels and update state.
   *
   * TODO: how to avoid duplicating upstream logic?
   */
  protected async requestRunning(): Promise<void> {
    if (this.isDisposed) {
      return;
    }

    const models = await this._kernelStore.list();

    const _models = this['_models'];

    if (
      _models.size === models.length &&
      models.every((model) => {
        const existing = _models.get(model.id);
        if (!existing) {
          return false;
        }
        return (
          existing.connections === model.connections &&
          existing.execution_state === model.execution_state &&
          existing.last_activity === model.last_activity &&
          existing.name === model.name &&
          existing.reason === model.reason &&
          existing.traceback === model.traceback
        );
      })
    ) {
      // Identical models list (presuming models does not contain duplicate
      // ids), so just return
      return;
    }

    this['_models'] = new Map(models.map((x) => [x.id, x]));

    // For any kernel connection to a kernel that doesn't exist, notify it of
    // the shutdown.
    this['_kernelConnections'].forEach((kc: LiteKernelConnection) => {
      if (!this['_models'].has(kc.id)) {
        kc.handleShutdown();
      }
    });

    this['_runningChanged'].emit(models);
  }

  private _kernelspecs: IKernelSpecs;
  private _kernelStore: IKernelStore;
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
     * The kernel store
     */
    kernelStore: IKernelStore;
  }
}
