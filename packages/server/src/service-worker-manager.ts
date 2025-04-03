import { PageConfig, URLExt } from '@jupyterlab/coreutils';

import { PromiseDelegate, UUID } from '@lumino/coreutils';

import { ISignal, Signal } from '@lumino/signaling';

import {
  DriveContentsProcessor,
  IDriveContentsProcessor,
  TDriveMethod,
  TDriveRequest,
} from '@jupyterlite/contents';

import { IServiceWorkerManager, WORKER_NAME } from './tokens';

/**
 * The version of the app.
 */
const VERSION = PageConfig.getOption('appVersion');

/**
 * Used to keep the Service Worker alive.
 */
const SW_PING_ENDPOINT = '/api/service-worker-heartbeat';

/**
 * A class that manages the Service Worker.
 */
export class ServiceWorkerManager implements IServiceWorkerManager {
  /**
   * Construct a new ServiceWorkerManager.
   */
  constructor(options: IServiceWorkerManager.IOptions) {
    this._windowId = UUID.uuid4();
    this._messageChannel = new MessageChannel();

    // listen to messages from the Service Worker
    this._messageChannel.port1.onmessage = this._onMessage;

    const contents = options.contents;
    this._driveContentsProcessor = new DriveContentsProcessor({
      contentsManager: contents,
    });

    const workerUrl =
      options?.workerUrl ?? URLExt.join(PageConfig.getBaseUrl(), WORKER_NAME);
    const fullWorkerUrl = new URL(workerUrl, window.location.href);
    const enableCache = PageConfig.getOption('enableServiceWorkerCache') || 'false';
    fullWorkerUrl.searchParams.set('enableCache', enableCache);
    void this._initialize(fullWorkerUrl.href).catch(console.warn);
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
   * The current tab id
   */
  get windowId(): string {
    return this._windowId;
  }

  /**
   * Whether the ServiceWorker is enabled or not.
   */
  get enabled(): boolean {
    return this._registration !== null;
  }

  /**
   * Whether the ServiceWorker is ready or not.
   */
  get ready(): Promise<void> {
    return this._ready.promise;
  }

  /**
   * Handle a message received on the MessageChannel
   */
  protected _onMessage = async <T extends TDriveMethod>(
    event: MessageEvent<TDriveRequest<T>>,
  ): Promise<void> => {
    const request = event.data;
    const response = await this._driveContentsProcessor.processDriveRequest(request);

    this._messageChannel.port1.postMessage(response);
  };

  /**
   * Initialize the Service Worker
   */
  private async _initialize(workerUrl: string): Promise<void> {
    const { serviceWorker } = navigator;

    let registration: ServiceWorkerRegistration | null = null;

    if (!serviceWorker) {
      console.warn('ServiceWorkers not supported in this browser');
      this._ready.reject(void 0);
      return;
    } else if (serviceWorker.controller) {
      const scriptURL = serviceWorker.controller.scriptURL;
      await this._unregisterOldServiceWorkers(scriptURL);

      registration = (await serviceWorker.getRegistration(scriptURL)) || null;
      // eslint-disable-next-line no-console
      console.info('JupyterLite ServiceWorker was already registered');
    } else {
      await this._unregisterOldServiceWorkers();
    }

    if (!registration || (!registration.active && serviceWorker)) {
      try {
        // eslint-disable-next-line no-console
        console.info('Registering new JupyterLite ServiceWorker', workerUrl);
        await serviceWorker.register(workerUrl);

        await navigator.serviceWorker.ready;

        registration = (await serviceWorker.getRegistration()) || null;

        // eslint-disable-next-line no-console
        console.info('JupyterLite ServiceWorker was sucessfully registered');
      } catch (err: any) {
        console.warn(err);
        console.warn(
          `JupyterLite ServiceWorker registration unexpectedly failed: ${err}`,
        );
      }
    }

    if (!serviceWorker.controller) {
      await new Promise<void>((resolve) => {
        serviceWorker.addEventListener('controllerchange', () => {
          // If the service worker changed (another tab unregister the SW), we need to send the port again
          if (serviceWorker.controller) {
            void serviceWorker.controller.postMessage(
              {
                type: 'INIT_PORT',
                windowId: this._windowId,
              },
              [this._messageChannel.port2],
            );
            resolve();
          }
        });
      });
    }
    const controller = serviceWorker.controller;

    console.log('--- DEBUG CONTROLLER', controller);
    // transfer the port for communication with the Service Worker
    if (controller) {
      void controller.postMessage(
        {
          type: 'INIT_PORT',
          windowId: this._windowId,
        },
        [this._messageChannel.port2],
      );

      window.addEventListener('beforeunload', () => {
        controller.postMessage({
          type: 'DISCONNECT_PORT',
          windowId: this._windowId,
        });
      });
    }

    this._setRegistration(registration);

    if (!registration) {
      this._ready.reject(void 0);
    } else {
      this._ready.resolve(void 0);
      setTimeout(this._pingServiceWorker, 20000);
    }
  }

  /**
   * Unregister previous service workers if the version has changed.
   */
  private _unregisterOldServiceWorkers = async (scriptURL?: string) => {
    const versionKey = `${scriptURL}-version`;
    // Check if we have an installed version. If we do, compare it to the current version
    // and unregister all service workers if they are different.
    const installedVersion = localStorage.getItem(versionKey);

    if (
      !navigator.serviceWorker.controller ||
      (installedVersion && installedVersion !== VERSION) ||
      !installedVersion
    ) {
      // eslint-disable-next-line no-console
      console.info('Unregistering outdated service-workers.');
      const registrations = await navigator.serviceWorker.getRegistrations();

      await Promise.all(registrations.map((registration) => registration.unregister()));

      // eslint-disable-next-line no-console
      console.info('All existing service workers have been unregistered.');
    }

    localStorage.setItem(versionKey, VERSION);
  };

  /**
   * Ping the Service Worker to keep it alive.
   */
  private _pingServiceWorker = async (): Promise<void> => {
    const response = await fetch(SW_PING_ENDPOINT);
    const text = await response.text();
    if (text === 'ok') {
      setTimeout(this._pingServiceWorker, 20000);
    }
  };

  /**
   * Set the Service Worker registration.
   */
  private _setRegistration(registration: ServiceWorkerRegistration | null) {
    this._registration = registration;
    this._registrationChanged.emit(this._registration);
  }

  private _windowId: string;
  private _messageChannel: MessageChannel;
  private _registration: ServiceWorkerRegistration | null = null;
  private _registrationChanged = new Signal<this, ServiceWorkerRegistration | null>(
    this,
  );
  private _ready = new PromiseDelegate<void>();
  private _driveContentsProcessor: IDriveContentsProcessor;
}
