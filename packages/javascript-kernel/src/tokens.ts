// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

/**
 * Definitions for the JavaScript kernel.
 */

import type { Remote } from 'comlink';

import { IWorkerKernel } from '@jupyterlite/kernel';

/**
 * An interface for JavaScript workers.
 */
export interface IJavaScriptWorkerKernel extends IWorkerKernel {
  /**
   * Handle any lazy initialization activities.
   */
  initialize(options: IJavaScriptWorkerKernel.IOptions): Promise<void>;
}

/**
 * An convenience interface for JavaScript workers wrapped by a comlink Remote.
 */
export interface IRemoteJavaScriptWorkerKernel
  extends Remote<IJavaScriptWorkerKernel> {}

/**
 * An namespace for JavaScript workers.
 */
export namespace IJavaScriptWorkerKernel {
  /**
   * Initialization options for a worker.
   */
  export interface IOptions extends IWorkerKernel.IOptions {}
}
