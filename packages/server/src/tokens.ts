import { Token } from '@lumino/coreutils';

import { ISignal } from '@lumino/signaling';

import SW_URL from './service-worker?text';

/**
 * The token for the ServiceWorker.
 */
export const IServiceWorkerManager = new Token<IServiceWorkerManager>(
  '@jupyterlite/server-extension:IServiceWorkerManager',
);

/**
 * The interface for the ServiceWorkerRegistration.
 */
export interface IServiceWorkerManager {
  /**
   * Signal fired when the registration changed.
   */
  readonly registrationChanged: ISignal<
    IServiceWorkerManager,
    ServiceWorkerRegistration | null
  >;

  /**
   * Whether the ServiceWorker is enabled or not.
   */
  readonly enabled: boolean;

  /**
   * A Promise that resolves when the ServiceWorker is registered, or rejects if it cannot
   */
  ready: Promise<void>;
}

/**
 * A namespace for `ServiceWorkerManager` class.
 */
export namespace IServiceWorkerManager {
  /**
   * An options object for initializing a worker manager.
   */
  export interface IOptions {
    /**
     * URL to load the worker file. Default to "{baseURL}/service-worker.js"
     */
    workerUrl?: string;
  }
}

export const WORKER_NAME = `${SW_URL}`.split('/').slice(-1)[0];
