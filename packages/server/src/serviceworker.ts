import { ISignal, Signal } from '@lumino/signaling';

import { PageConfig, URLExt } from '@jupyterlab/coreutils';

import { IServiceWorkerRegistrationWrapper } from './tokens';

export class ServiceWorkerRegistrationWrapper
  implements IServiceWorkerRegistrationWrapper
{
  constructor(config: ServiceWorker.IConfig) {
    this._config = config;
    this.initialize();
  }

  /**
   * A signal emitted when the registration changes.
   */
  get registrationChanged(): ISignal<
    IServiceWorkerRegistrationWrapper,
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

  private async initialize() {
    if (this._config['disabled']) {
      // don't install service worker
      return;
    }
    const workerUrl =
      this._config['workerUrl'] || URLExt.join(PageConfig.getBaseUrl(), 'services.js');
    if (!('serviceWorker' in navigator)) {
      console.error(
        'ServiceWorker registration failed: Service Workers not supported in this browser'
      );
      this.setRegistration(null);
    }

    if (!('serviceWorker' in navigator)) {
      console.error(
        'ServiceWorker registration failed: Service Workers not supported in this browser'
      );
      this.setRegistration(null);
    }

    if (navigator.serviceWorker.controller) {
      const registration = await navigator.serviceWorker.getRegistration(
        navigator.serviceWorker.controller.scriptURL
      );

      if (registration) {
        this.setRegistration(registration);
      }
    }

    return await navigator.serviceWorker.register(workerUrl).then(
      (registration) => {
        this.setRegistration(registration);
      },
      (err) => {
        console.error(`ServiceWorker registration failed: ${err}`);
        this.setRegistration(null);
      }
    );
  }

  private setRegistration(registration: ServiceWorkerRegistration | null) {
    this._registration = registration;
    this._registrationChanged.emit(this._registration);
  }

  private _config: ServiceWorker.IConfig;

  private _registration: ServiceWorkerRegistration | null = null;
  private _registrationChanged = new Signal<this, ServiceWorkerRegistration | null>(
    this
  );
}

export namespace ServiceWorker {
  export interface IConfig {
    /**
     * The URL to fetch the service worker from
     */
    workerUrl: string;

    /**
     * Set this to true to disable loading the service worker
     */
    disabled: boolean;
  }
}
