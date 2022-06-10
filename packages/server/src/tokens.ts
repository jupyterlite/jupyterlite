import { Token } from '@lumino/coreutils';

/**
 * The token for the ServiceWorker.
 */
export const IServiceWorker = new Token<IServiceWorker>(
  '@jupyterlite/server-extension:IServiceWorker'
);

/**
 * The interface for the ServiceWorker.
 */
export interface IServiceWorker {
  /**
   * The ServiceWorker registration, or null if it failed to register.
   */
  registration: ServiceWorkerRegistration | null;
}
