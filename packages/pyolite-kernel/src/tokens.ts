// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import type { Remote } from 'comlink';

import { IWorkerKernel } from '@jupyterlite/kernel';

export interface IPyoliteWorkerKernel extends IWorkerKernel {
  /**
   * Handle any lazy initialization activities.
   */
  initialize(options: IPyoliteWorkerKernel.IOptions): Promise<void>;
}

export interface IRemotePyoliteWorkerKernel extends Remote<IPyoliteWorkerKernel> {}

export namespace IPyoliteWorkerKernel {
  export interface IOptions extends IWorkerKernel.IOptions {
    pyodideUrl: string;
    indexUrl: string;
    pipliteWheelUrl: string;
    pipliteUrls: string[];
    disablePyPIFallback: boolean;
  }
}
