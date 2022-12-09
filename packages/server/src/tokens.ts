import { Token } from '@lumino/coreutils';

import { ISignal } from '@lumino/signaling';

import SW_URL from '!!file-loader?name=[name]-[contenthash:7].[ext]&context=.!./service-worker';

/**
 * The token for the ServiceWorker.
 */
export const IServiceManager = new Token<IServiceManager>(
  '@jupyterlite/server-extension:IServiceManager'
);

/**
 * The interface for the ServiceWorkerRegistration.
 */
export interface IServiceManager {
  /**
   * Signal fired when the registration changed.
   */
  readonly registrationChanged: ISignal<
    IServiceManager,
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

export const WORKER_NAME = `${SW_URL}`.split('/').slice(-1)[0];
