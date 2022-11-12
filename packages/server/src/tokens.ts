import { Token } from '@lumino/coreutils';

import { ISignal } from '@lumino/signaling';

import SW_URL from '!!file-loader?name=[name]-[contenthash:7].[ext]&context=.!./sw';

/**
 * The token for the ServiceWorker.
 */
export const IServiceWorkerRegistrationWrapper =
  new Token<IServiceWorkerRegistrationWrapper>(
    '@jupyterlite/server-extension:IServiceWorkerRegistrationWrapper'
  );

/**
 * The interface for the ServiceWorkerRegistration.
 */
export interface IServiceWorkerRegistrationWrapper {
  /**
   * Signal fired when the registration changed.
   */
  readonly registrationChanged: ISignal<
    IServiceWorkerRegistrationWrapper,
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
