import { PageConfig, URLExt } from '@jupyterlab/coreutils';

import { showDialog } from '@jupyterlab/apputils';

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
    let registration: ServiceWorkerRegistration | undefined = undefined;

    if (!navigator.serviceWorker) {
      console.warn('ServiceWorkers not supported in this browser');
      this._ready.reject(void 0);
      return;
    }

    if (
      await this._serviceWorkerIsOutdated(navigator.serviceWorker.controller?.scriptURL)
    ) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }

    // Check if service worker is active, if not register and wait for active state
    registration = await navigator.serviceWorker.getRegistration();

    try {
      if (!registration || !registration.active) {
        await navigator.serviceWorker.register(workerUrl);
        await navigator.serviceWorker.ready;
        if (!navigator.serviceWorker.controller) {
          // This happens upon hard refresh, the service worker doesn't take over the page, we need to reload the page
          console.log('Force a page reload');
          window.location.reload();
        }
        this._currentController = navigator.serviceWorker.controller;

        localStorage.setItem(
          `${navigator.serviceWorker.controller?.scriptURL}-version`,
          VERSION,
        );
      } else {
        this._currentController = navigator.serviceWorker.controller;
      }
    } catch (e) {
      this._ready.reject(void 0);
      return;
    }

    registration = await navigator.serviceWorker.getRegistration();

    await this._initPort();

    // Reconnect upon service-worker change
    navigator.serviceWorker.addEventListener('controllerchange', async () => {
      if (navigator.serviceWorker.controller) {
        this._currentController = navigator.serviceWorker.controller;
        await this._initPort();
      }
    });

    // Disconnect port upon tab closing
    window.addEventListener('beforeunload', () => {
      this._currentController?.postMessage({
        type: 'DISCONNECT_PORT',
        windowId: this._windowId,
      });
    });

    this._setRegistration(registration || null);

    if (!registration) {
      this._ready.reject(void 0);
    } else {
      this._ready.resolve(void 0);
      setTimeout(this._pingServiceWorker, 20000);
    }
  }

  private async _initPort() {
    if (this._currentController) {
      if (this._currentController.state === 'activated') {
        // In Chrome, this works well when the _currentController changed, it activates right away
        void this._currentController.postMessage(
          {
            type: 'INIT_PORT',
            windowId: this._windowId,
          },
          [this._messageChannel.port2],
        );
      } else {
        // In Firefox, this doesn't work well when the _currentController changed, it never activates, we need to refresh
        const refresh = await showDialog({
          title: 'The page needs to be refreshed',
          body: 'The current page is outdated. It needs to be refreshed in order for kernels to work. Refresh now?',
        });
        if (!refresh.button.accept) {
          return;
        }
        window.location.reload();
      }
    }
  }

  /**
   * Check if current service-worker is outdated.
   */
  private _serviceWorkerIsOutdated = async (scriptURL?: string) => {
    const versionKey = `${scriptURL}-version`;
    // Check if we have an installed version. If we do, compare it to the current version
    // and unregister all service workers if they are different.
    const installedVersion = localStorage.getItem(versionKey);

    return (
      !navigator.serviceWorker.controller ||
      (installedVersion && installedVersion !== VERSION) ||
      !installedVersion
    );
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

  private _currentController: ServiceWorker | null = null;
  private _windowId: string;
  private _messageChannel: MessageChannel;
  private _registration: ServiceWorkerRegistration | null = null;
  private _registrationChanged = new Signal<this, ServiceWorkerRegistration | null>(
    this,
  );
  private _ready = new PromiseDelegate<void>();
  private _driveContentsProcessor: IDriveContentsProcessor;
}
