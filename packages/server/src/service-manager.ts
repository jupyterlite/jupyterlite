import { PromiseDelegate } from '@lumino/coreutils';
import { ISignal, Signal } from '@lumino/signaling';

import { PageConfig, URLExt } from '@jupyterlab/coreutils';

import { IServiceWorkerManager, WORKER_NAME } from './tokens';

export class ServiceWorkerManager implements IServiceWorkerManager {
  constructor(options?: IServiceWorkerManager.IOptions) {
    const workerUrl =
      options?.workerUrl ?? URLExt.join(PageConfig.getBaseUrl(), WORKER_NAME);
    void this.initialize(workerUrl).catch(console.warn);
  }

  /**
   * A signal emitted when the registration changes.
   */
  get registrationChanged(): ISignal<
    IServiceWorkerManager,
    ServiceWorkerRegistration | null
  > {
    return this._registrationChanged;
  }

  /**
   * Whether the ServiceWorker is enabled or not.
   */
  get enabled(): boolean {
    return this._registration !== null;
  }

  get ready(): Promise<void> {
    return this._ready.promise;
  }

  private async initialize(workerUrl: string): Promise<void> {
    const { serviceWorker } = navigator;

    let registration: ServiceWorkerRegistration | null = null;

    if (!serviceWorker) {
      console.warn('ServiceWorkers not supported in this browser');
      this._ready.reject('Not supported'); // Reject the promise if service workers are not supported.
      return;
    }

    // Unregister any existing service workers before registering the new one.
    const registrations = await serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
      // eslint-disable-next-line no-console
      console.info('Existing JupyterLite ServiceWorker unregistered');
    }

    // After unregistration, proceed to register the new service worker.
    try {
      // eslint-disable-next-line no-console
      console.info('Registering new JupyterLite ServiceWorker', workerUrl);
      registration = await serviceWorker.register(workerUrl);
      // eslint-disable-next-line no-console
      console.info('JupyterLite ServiceWorker was successfully registered');
    } catch (err) {
      console.warn(err);
      console.warn(
        `JupyterLite ServiceWorker registration unexpectedly failed: ${err}`
      );
    }

    this.setRegistration(registration);

    if (!registration) {
      this._ready.reject('Registration failed');
    } else {
      this._ready.resolve();
    }
  }

  private setRegistration(registration: ServiceWorkerRegistration | null) {
    this._registration = registration;
    this._registrationChanged.emit(this._registration);
  }

  private _registration: ServiceWorkerRegistration | null = null;
  private _registrationChanged = new Signal<this, ServiceWorkerRegistration | null>(
    this
  );
  private _ready = new PromiseDelegate<void>();
}
