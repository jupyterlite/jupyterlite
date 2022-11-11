// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

/**
 * Definitions for the pyolite kernel.
 */

import type { Remote } from 'comlink';

import { IWorkerKernel } from '@jupyterlite/kernel';

/**
 * An interface for pyolite workers.
 */
export interface IPyoliteWorkerKernel extends IWorkerKernel {
  /**
   * Handle any lazy initialization activities.
   */
  initialize(options: IPyoliteWorkerKernel.IOptions): Promise<void>;
}

/**
 * An convenience interface for pyolite workers wrapped by a comlink Remote.
 */
export interface IRemotePyoliteWorkerKernel extends Remote<IPyoliteWorkerKernel> {}

/**
 * An namespace for pyolite workers.
 */
export namespace IPyoliteWorkerKernel {
  /**
   * Initialization options for a worker.
   */
  export interface IOptions extends IWorkerKernel.IOptions {
    /**
     * The URL of the main `pyodide.js` file in the standard pyodide layout.
     */
    pyodideUrl: string;

    /**
     * The URL of a pyodide index file in the standard pyodide layout.
     */
    indexUrl: string;

    /**
     * The URL of the `piplite` wheel for bootstrapping.
     */
    pipliteWheelUrl: string;

    /**
     * The URLs of additional warehouse-like wheel listings.
     */
    pipliteUrls: string[];

    /**
     * Whether `piplite` should fall back to the hard-coded `pypi.org` for resolving packages.
     */
    disablePyPIFallback: boolean;

    /**
     * The current working directory in which to start the kernel.
     */
    location: string;

    /**
     * Whether or not to mount the Emscripten drive
     */
    mountDrive: boolean;
  }
}
