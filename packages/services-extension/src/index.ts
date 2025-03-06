// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { PageConfig } from '@jupyterlab/coreutils';

import {
  Contents,
  Event,
  IDefaultDrive,
  IEventManager,
  IKernelManager,
  IKernelSpecManager,
  INbConvertManager,
  IServerSettings,
  ISessionManager,
  ISettingManager,
  IUserManager,
  Kernel,
  KernelSpec,
  NbConvert,
  NbConvertManager,
  ServerConnection,
  ServiceManagerPlugin,
  Session,
  Setting,
  User,
  UserManager,
} from '@jupyterlab/services';

import { BrowserStorageDrive } from '@jupyterlite/contents';

import {
  IKernelSpecs,
  IKernelStore,
  KernelSpecs,
  KernelStore,
  LiteKernelManager,
  LiteKernelSpecs,
} from '@jupyterlite/kernel';

import { ILocalForage, ensureMemoryStorage } from '@jupyterlite/localforage';

import { Settings as JupyterLiteSettings } from '@jupyterlite/settings';

import localforage from 'localforage';

import { WebSocket } from 'mock-socket';

import { LocalEventManager } from './event';

import { ISessionStore, LiteSessionManager, SessionStore } from '@jupyterlite/session';

/**
 * The default drive plugin.
 */
const defaultDrivePlugin: ServiceManagerPlugin<Contents.IDrive> = {
  id: '@jupyterlite/services-extension:default-drive',
  description: 'The default drive for the contents manager.',
  autoStart: true,
  provides: IDefaultDrive,
  requires: [ILocalForage],
  activate: (_: null, forage: ILocalForage): Contents.IDrive => {
    const storageName = PageConfig.getOption('contentsStorageName');
    const storageDrivers = JSON.parse(
      PageConfig.getOption('contentsStorageDrivers') || 'null',
    );
    const { localforage } = forage;
    const drive = new BrowserStorageDrive({
      storageName,
      storageDrivers,
      localforage,
    });
    return drive;
  },
};

/**
 * The event manager plugin.
 */
const eventManagerPlugin: ServiceManagerPlugin<Event.IManager> = {
  id: '@jupyterlite/services-extension:event-manager',
  description: 'The event manager plugin.',
  autoStart: true,
  provides: IEventManager,
  optional: [IServerSettings],
  activate: (
    _: null,
    serverSettings: ServerConnection.ISettings | undefined,
  ): Event.IManager => {
    return new LocalEventManager({ serverSettings });
  },
};

/**
 * The kernel manager plugin.
 */
const kernelManagerPlugin: ServiceManagerPlugin<Kernel.IManager> = {
  id: '@jupyterlite/services-extension:kernel-manager',
  description: 'The kernel manager plugin.',
  autoStart: true,
  provides: IKernelManager,
  requires: [IKernelSpecs, IKernelStore],
  optional: [IServerSettings],
  activate: (
    _: null,
    kernelSpecs: IKernelSpecs,
    kernelStore: IKernelStore,
    serverSettings: ServerConnection.ISettings | undefined,
  ): Kernel.IManager => {
    return new LiteKernelManager({ kernelSpecs, kernelStore, serverSettings });
  },
};

/**
 * The kernel spec manager plugin.
 */
const kernelSpecManagerPlugin: ServiceManagerPlugin<KernelSpec.IManager> = {
  id: '@jupyterlite/services-extension:kernel-spec-manager',
  description: 'The kernel spec manager plugin.',
  autoStart: true,
  provides: IKernelSpecManager,
  requires: [IKernelSpecs],
  optional: [IServerSettings],
  activate: (
    _: null,
    kernelSpecs: IKernelSpecs,
    serverSettings: ServerConnection.ISettings | undefined,
  ): KernelSpec.IManager => {
    return new LiteKernelSpecs({ kernelSpecs, serverSettings });
  },
};

/**
 * The store for managing in-browser kernels
 */
const kernelStorePlugin: ServiceManagerPlugin<IKernelStore> = {
  id: '@jupyterlite/services-extension:kernel-store',
  description: 'The store for managing in-browser kernels',
  autoStart: true,
  requires: [IKernelSpecs],
  provides: IKernelStore,
  activate: (_: null, kernelSpecs: IKernelSpecs): IKernelStore => {
    return new KernelStore({ kernelSpecs });
  },
};

/**
 * The in-browser kernel spec manager plugin.
 */
const liteKernelSpecManagerPlugin: ServiceManagerPlugin<IKernelSpecs> = {
  id: '@jupyterlite/services-extension:kernel-specs',
  description: 'The in-browser kernel spec manager plugin.',
  autoStart: true,
  provides: IKernelSpecs,
  activate: (_: null): IKernelSpecs => {
    return new KernelSpecs();
  },
};

/**
 * The localforage plugin
 */
const localforagePlugin: ServiceManagerPlugin<ILocalForage> = {
  id: '@jupyterlite/services-extension:localforage',
  autoStart: true,
  provides: ILocalForage,
  activate: (_: null) => {
    return { localforage };
  },
};

/**
 * The volatile localforage memory plugin
 */
const localforageMemoryPlugin: ServiceManagerPlugin<void> = {
  id: '@jupyterlite/services-extension:localforage-memory-storage',
  autoStart: true,
  requires: [ILocalForage],
  activate: async (_: null, forage: ILocalForage) => {
    if (JSON.parse(PageConfig.getOption('enableMemoryStorage') || 'false')) {
      console.warn(
        'Memory storage fallback enabled: contents and settings may not be saved',
      );
      await ensureMemoryStorage(forage.localforage);
    }
  },
};

/**
 * The nbconvert manager plugin.
 */
const nbConvertManagerPlugin: ServiceManagerPlugin<NbConvert.IManager> = {
  id: '@jupyterlite/services-extension:nbconvert-manager',
  description: 'The nbconvert manager plugin.',
  autoStart: true,
  provides: INbConvertManager,
  optional: [IServerSettings],
  activate: (
    _: null,
    serverSettings: ServerConnection.ISettings | undefined,
  ): NbConvert.IManager => {
    const nbConvertManager = new (class extends NbConvertManager {
      async getExportFormats(
        force?: boolean,
      ): Promise<NbConvertManager.IExportFormats> {
        return {};
      }
    })({ serverSettings });

    return nbConvertManager;
  },
};

/**
 * The default server settings plugin.
 */
const serverSettingsPlugin: ServiceManagerPlugin<ServerConnection.ISettings> = {
  id: '@jupyterlite/services-extension:server-settings',
  description: 'The default server settings plugin.',
  autoStart: true,
  provides: IServerSettings,
  activate: (_: null): ServerConnection.ISettings => {
    return {
      ...ServerConnection.makeSettings(),
      WebSocket,
      fetch: async (
        req: RequestInfo,
        init?: RequestInit | null | undefined,
      ): Promise<Response> => {
        const request = new Request(req, init ?? undefined);
        const url = new URL(request.url);
        console.error(`Unhandled fetch request path: ${url.pathname}`);
        return new Response(JSON.stringify({}));
      },
    };
  },
};

/**
 * The session manager plugin.
 */
const sessionManagerPlugin: ServiceManagerPlugin<Session.IManager> = {
  id: '@jupyterlite/services-extension:session-manager',
  description: 'The session manager plugin.',
  autoStart: true,
  provides: ISessionManager,
  requires: [IKernelManager, ISessionStore],
  optional: [IServerSettings],
  activate: (
    _: null,
    kernelManager: Kernel.IManager,
    sessionStore: ISessionStore,
    serverSettings: ServerConnection.ISettings | undefined,
  ): Session.IManager => {
    return new LiteSessionManager({
      kernelManager,
      serverSettings,
      sessionStore,
    });
  },
};

/**
 * The session store plugin.
 */
const sessionStorePlugin: ServiceManagerPlugin<ISessionStore> = {
  id: '@jupyterlite/services-extension:session-store',
  description: 'The session store plugin.',
  autoStart: true,
  provides: ISessionStore,
  requires: [IKernelStore],
  activate: (_: null, kernelStore: IKernelStore): ISessionStore => {
    return new SessionStore({ kernelStore });
  },
};

/**
 * The settings service plugin.
 */
const settingsPlugin: ServiceManagerPlugin<Setting.IManager> = {
  id: '@jupyterlite/services-extension:settings',
  autoStart: true,
  requires: [ILocalForage],
  optional: [IServerSettings],
  provides: ISettingManager,
  activate: (
    _: null,
    forage: ILocalForage,
    serverSettings: ServerConnection.ISettings | null,
  ) => {
    const storageName = PageConfig.getOption('settingsStorageName');
    const storageDrivers = JSON.parse(
      PageConfig.getOption('settingsStorageDrivers') || 'null',
    );
    const { localforage } = forage;
    const settings = new JupyterLiteSettings({
      storageName,
      storageDrivers,
      localforage,
      serverSettings: serverSettings ?? undefined,
    });
    return settings;
  },
};

/**
 * The user manager plugin.
 */
const userManagerPlugin: ServiceManagerPlugin<User.IManager> = {
  id: '@jupyterlite/services-extension:user-manager',
  description: 'The user manager plugin.',
  autoStart: true,
  provides: IUserManager,
  optional: [IServerSettings],
  activate: (
    _: null,
    serverSettings: ServerConnection.ISettings | undefined,
  ): User.IManager => {
    return new (class extends UserManager {
      async requestUser(): Promise<void> {
        // no-op
      }
    })({ serverSettings });
  },
};

export default [
  defaultDrivePlugin,
  eventManagerPlugin,
  kernelManagerPlugin,
  kernelSpecManagerPlugin,
  kernelStorePlugin,
  liteKernelSpecManagerPlugin,
  localforagePlugin,
  localforageMemoryPlugin,
  nbConvertManagerPlugin,
  serverSettingsPlugin,
  sessionManagerPlugin,
  sessionStorePlugin,
  settingsPlugin,
  userManagerPlugin,
];
