import { Token } from '@lumino/coreutils';

import type { ISignal } from '@lumino/signaling';

import type { Contents } from '@jupyterlab/services';

import SW_URL from './service-worker?text';

/**
 * The token for the ServiceWorker.
 */
export const IServiceWorkerManager = new Token<IServiceWorkerManager>(
  '@jupyterlite/apputils:IServiceWorkerManager',
  'The service worker manager',
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
   * A unique id to identify the browsing context where the ServiceWorkerManager was instantiated.
   */
  readonly browsingContextId: string;

  /**
   * A Promise that resolves when the ServiceWorker is registered, or rejects if it cannot
   */
  ready: Promise<void>;

  /**
   * Register a handler for stdin requests received via ServiceWorker.
   * @param pathnameSuffix URL pathname suffix to match such as "kernel" or "terminal".
   * @param stdinHandler
   */
  registerStdinHandler(
    pathnameSuffix: string,
    stdinHandler: IServiceWorkerManager.IStdinHandler,
  ): void;
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
     * The contents manager to use for handling drive contents requests
     */
    contents: Contents.IManager;

    /**
     * URL to load the worker file. Default to "{baseURL}/service-worker.js"
     */
    workerUrl?: string;
  }

  /**
   * Interface for handler of stdin requests received via Service Worker.
   *
   * Types are `any` because they are defined by whatever calls `registerStdinHandler`
   * and the ServiceWorkerManager does not need to understand them, it just passes them
   * through without altering them.
   */
  export interface IStdinHandler {
    (message: any): Promise<any>;
  }
}

export const WORKER_NAME = `${SW_URL}`.split('/').slice(-1)[0];
