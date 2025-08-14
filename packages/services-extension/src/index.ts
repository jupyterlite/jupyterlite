// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { PageConfig } from '@jupyterlab/coreutils';

import {
  ConfigSection,
  Contents,
  Event,
  IConfigSectionManager,
  IDefaultDrive,
  IEventManager,
  IKernelManager,
  IKernelSpecManager,
  INbConvertManager,
  IServerSettings,
  ISessionManager,
  ISettingManager,
  IUserManager,
  IWorkspaceManager,
  Kernel,
  KernelManager,
  KernelSpec,
  KernelSpecManager,
  NbConvert,
  NbConvertManager,
  ServerConnection,
  ServiceManagerPlugin,
  Session,
  SessionManager,
  Setting,
  User,
  UserManager,
  Workspace,
} from '@jupyterlab/services';

import { LiteWorkspaceManager } from '@jupyterlite/apputils';

import { BrowserStorageDrive } from '@jupyterlite/contents';

import {
  IKernelClient,
  IKernelSpecClient,
  IKernelSpecs,
  KernelSpecs,
  LiteKernelClient,
  LiteKernelSpecClient,
  initializeKernelBridge,
  initializeConsoleAPI,
} from '@jupyterlite/kernel';

import { ILocalForage, ensureMemoryStorage } from '@jupyterlite/localforage';

import { LiteSessionClient } from '@jupyterlite/session';

import { Settings as JupyterLiteSettings } from '@jupyterlite/settings';

import localforage from 'localforage';

import { WebSocket } from 'mock-socket';

import { LiteConfigSectionManager } from './configsection';

import { LocalEventManager } from './event';

/**
 * Config section manager plugin.
 */
const configSectionManager: ServiceManagerPlugin<ConfigSection.IManager> = {
  id: '@jupyterlite/services-extension:config-section-manager',
  autoStart: true,
  provides: IConfigSectionManager,
  optional: [IServerSettings],
  description: 'Provides the config section manager.',
  activate: (_: null, serverSettings?: ServerConnection.ISettings) => {
    const manager = new LiteConfigSectionManager({ serverSettings });
    // Set the config section manager for the global ConfigSection.
    ConfigSection._setConfigSectionManager(manager);
    return manager;
  },
};

/**
 * The default drive plugin.
 */
const defaultDrivePlugin: ServiceManagerPlugin<Contents.IDrive> = {
  id: '@jupyterlite/services-extension:default-drive',
  description: 'The default drive for the contents manager.',
  autoStart: true,
  provides: IDefaultDrive,
  requires: [ILocalForage],
  activate: async (_: null, forage: ILocalForage): Promise<Contents.IDrive> => {
    const baseUrl = PageConfig.getOption('baseUrl');
    const defaultStorageName = `JupyterLite Storage - ${baseUrl}`;
    const storageName =
      PageConfig.getOption('contentsStorageName') || defaultStorageName;
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
  requires: [IKernelClient, IKernelSpecClient],
  optional: [IServerSettings],
  activate: (
    _: null,
    kernelAPIClient: IKernelClient,
    kernelSpecAPIClient: IKernelSpecClient,
    serverSettings: ServerConnection.ISettings | undefined,
  ): Kernel.IManager => {
    return new KernelManager({
      kernelAPIClient,
      kernelSpecAPIClient,
      serverSettings: {
        ...ServerConnection.makeSettings(),
        ...serverSettings,
        WebSocket,
      },
    });
  },
};

/**
 * The client for managing in-browser kernel specs
 */
const kernelSpecClientPlugin: ServiceManagerPlugin<KernelSpec.IKernelSpecAPIClient> = {
  id: '@jupyterlite/services-extension:kernel-spec-client',
  description: 'The client for managing in-browser kernel specs',
  autoStart: true,
  requires: [IKernelSpecs],
  optional: [IServerSettings],
  provides: IKernelSpecClient,
  activate: (
    _: null,
    kernelSpecs: IKernelSpecs,
    serverSettings?: ServerConnection.ISettings,
  ): IKernelSpecClient => {
    return new LiteKernelSpecClient({ kernelSpecs, serverSettings });
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
  requires: [IKernelSpecClient],
  optional: [IKernelSpecs, IServerSettings],
  activate: (
    _: null,
    kernelSpecAPIClient: IKernelSpecClient,
    kernelSpecs: IKernelSpecs | null,
    serverSettings: ServerConnection.ISettings | undefined,
  ): KernelSpec.IManager => {
    const kernelSpecManager = new KernelSpecManager({
      kernelSpecAPIClient,
      serverSettings,
    });
    if (kernelSpecs) {
      // refresh the kernel spec manager when new lite specs are added
      kernelSpecs.changed.connect(() => {
        void kernelSpecManager.refreshSpecs();
      });
    }
    return kernelSpecManager;
  },
};

/**
 * The client for managing in-browser kernels
 */
const kernelClientPlugin: ServiceManagerPlugin<Kernel.IKernelAPIClient> = {
  id: '@jupyterlite/services-extension:kernel-client',
  description: 'The client for managing in-browser kernels',
  autoStart: true,
  requires: [IKernelSpecs],
  optional: [IServerSettings],
  provides: IKernelClient,
  activate: (
    _: null,
    kernelSpecs: IKernelSpecs,
    serverSettings?: ServerConnection.ISettings,
  ): IKernelClient => {
    const kernelClient = new LiteKernelClient({
      kernelSpecs,
      serverSettings,
    });

    // Initialize kernel bridge and console API after a short delay
    // to ensure JupyterLab app is fully initialized
    setTimeout(() => {
      console.log('Initializing JupyterLite Kernel Bridge...');
      initializeKernelBridge(kernelClient);
      initializeConsoleAPI();
      console.log('✓ Kernel Bridge and Console API ready');
      console.log('Try: jupyter.exec("print(\'Hello from browser console!\')")');
    }, 1000);

    return kernelClient;
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
  activate: async (_: null) => {
    if (JSON.parse(PageConfig.getOption('enableMemoryStorage') || 'false')) {
      console.warn(
        'Memory storage fallback enabled: contents and settings may not be saved',
      );
      await ensureMemoryStorage(localforage);
    }
    return { localforage };
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
 * The session manager plugin.
 */
const sessionManagerPlugin: ServiceManagerPlugin<Session.IManager> = {
  id: '@jupyterlite/services-extension:session-manager',
  description: 'The session manager plugin.',
  autoStart: true,
  provides: ISessionManager,
  requires: [IKernelManager, IKernelClient],
  optional: [IServerSettings],
  activate: (
    _: null,
    kernelManager: Kernel.IManager,
    kernelClient: LiteKernelClient,
    serverSettings: ServerConnection.ISettings | undefined,
  ): Session.IManager => {
    const sessionAPIClient = new LiteSessionClient({
      kernelClient,
      serverSettings,
    });
    return new SessionManager({
      kernelManager,
      serverSettings,
      sessionAPIClient,
    });
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
    const baseUrl = PageConfig.getOption('baseUrl');
    const defaultStorageName = `JupyterLite Storage - ${baseUrl}`;
    const storageName =
      PageConfig.getOption('settingsStorageName') || defaultStorageName;
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

/**
 * The workspace manager plugin.
 */
const workspaceManagerPlugin: ServiceManagerPlugin<Workspace.IManager> = {
  id: '@jupyterlite/services-extension:workspace-manager',
  description: 'The workspace manager plugin.',
  autoStart: true,
  provides: IWorkspaceManager,
  requires: [ILocalForage],
  activate: (_: null, forage: ILocalForage): Workspace.IManager => {
    const baseUrl = PageConfig.getOption('baseUrl');
    const defaultStorageName = `JupyterLite Storage - ${baseUrl}`;
    const storageName =
      PageConfig.getOption('workspacesStorageName') || defaultStorageName;
    const storageDrivers = JSON.parse(
      PageConfig.getOption('workspacesStorageDrivers') || 'null',
    );
    const { localforage } = forage;

    return new LiteWorkspaceManager({
      storageName,
      storageDrivers,
      localforage,
    });
  },
};

export default [
  configSectionManager,
  defaultDrivePlugin,
  eventManagerPlugin,
  kernelManagerPlugin,
  kernelClientPlugin,
  kernelSpecClientPlugin,
  kernelSpecManagerPlugin,
  liteKernelSpecManagerPlugin,
  localforagePlugin,
  nbConvertManagerPlugin,
  sessionManagerPlugin,
  settingsPlugin,
  userManagerPlugin,
  workspaceManagerPlugin,
];
