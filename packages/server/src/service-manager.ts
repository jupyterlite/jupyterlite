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
    } else if (serviceWorker.controller) {
      registration =
        (await serviceWorker.getRegistration(serviceWorker.controller.scriptURL)) ||
        null;
      // eslint-disable-next-line no-console
      console.info('JupyterLite ServiceWorker was already registered');
    }

    if (!registration && serviceWorker) {
      try {
        // Unregister any existing service workers before registering the new one.
        const registrations = await serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.unregister()));
        // eslint-disable-next-line no-console
        console.info('Existing JupyterLite ServiceWorkers unregistered');

        // eslint-disable-next-line no-console
        console.info('Registering new JupyterLite ServiceWorker', workerUrl);
        registration = await serviceWorker.register(workerUrl);
        // eslint-disable-next-line no-console
        console.info('JupyterLite ServiceWorker was sucessfully registered');
      } catch (err: any) {
        console.warn(err);
        console.warn(
          `JupyterLite ServiceWorker registration unexpectedly failed: ${err}`,
        );
      }
    }

    this.setRegistration(registration);

    if (!registration) {
      this._ready.reject(void 0);
    } else {
      this._ready.resolve(void 0);
    }
  }

  private setRegistration(registration: ServiceWorkerRegistration | null) {
    this._registration = registration;
    this._registrationChanged.emit(this._registration);
  }

  private _registration: ServiceWorkerRegistration | null = null;
  private _registrationChanged = new Signal<this, ServiceWorkerRegistration | null>(
    this,
  );
  private _ready = new PromiseDelegate<void>();
}
