// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { PageConfig } from '@jupyterlab/coreutils';

import {
  ConfigSection,
  Contents,
  Event,
  IConfigSectionManager,
  IContentsManager,
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
    return new LiteKernelClient({
      kernelSpecs,
      serverSettings,
    });
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
 * Custom NbConvert manager for JupyterLite with client-side export.
 */
class LiteNbConvertManager extends NbConvertManager {
  /**
   * Construct a new LiteNbConvertManager.
   */
  constructor(
    options: NbConvertManager.IOptions & { contentsManager: Contents.IManager },
  ) {
    super(options);
    this._contentsManager = options.contentsManager;
  }

  /**
   * Get the list of export formats available.
   */
  async getExportFormats(): Promise<NbConvert.IExportFormats> {
    return {
      // use a different name than just 'notebook' since 'notebook' is filtered by the upstream
      // JupyterLab plugin: https://github.com/jupyterlab/jupyterlab/blob/c832df73b105c9f3fc215b8aec1180c8805e9c12/packages/notebook-extension/src/index.ts#L700
      ['Notebook (ipynb)']: {
        output_mimetype: 'application/x-ipynb+json',
      },
      ['Executable Script']: {
        output_mimetype: 'text/x-script',
      },
    };
  }

  /**
   * Export a notebook to a given format.
   */
  async exportAs(options: NbConvert.IExportOptions): Promise<void> {
    const { format, path } = options;

    const model = await this._contentsManager.get(path, { content: true });
    const element = document.createElement('a');

    if (format === 'Notebook (ipynb)') {
      const mime = model.mimetype ?? 'application/json';
      const content = JSON.stringify(model.content, null, 2);
      element.href = `data:${mime};charset=utf-8,${encodeURIComponent(content)}`;
      element.download = path;
    } else if (format === 'Executable Script') {
      const { content, extension } = this._convertToScript(model.content);
      element.href = `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`;
      element.download = path.replace(/\.ipynb$/, extension);
    } else {
      return;
    }

    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  /**
   * Convert a notebook to a script file.
   */
  private _convertToScript(content: any): {
    content: string;
    extension: string;
  } {
    // Get the language from the notebook metadata
    const languageInfo = content.metadata?.language_info;
    const language = languageInfo?.name || 'python';
    const fileExtension = languageInfo?.file_extension || '.py';

    // Extract code cells and convert to script
    const cells = content.cells || [];
    const scriptLines: string[] = [];

    for (const cell of cells) {
      if (cell.cell_type === 'code') {
        // Add code cell content
        const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
        scriptLines.push(source);
        // Add blank line between cells
        scriptLines.push('');
      } else if (cell.cell_type === 'markdown' || cell.cell_type === 'raw') {
        // Add markdown and raw cells as comments
        const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
        const commentedSource = this._commentLines(source, language);
        scriptLines.push(commentedSource);
        // Add blank line between cells
        scriptLines.push('');
      }
    }

    return {
      content: scriptLines.join('\n') + '\n',
      extension: fileExtension,
    };
  }

  /**
   * Comment out lines based on the language.
   */
  private _commentLines(text: string, language: string): string {
    const lines = text.split('\n');
    const commentChar = this._getCommentChar(language);

    return lines.map((line) => `${commentChar} ${line}`).join('\n');
  }

  /**
   * Get the comment character for a given language.
   */
  private _getCommentChar(language: string): string {
    // Map of languages to their comment characters
    const commentMap: { [key: string]: string } = {
      python: '#',
      r: '#',
      julia: '#',
      ruby: '#',
      bash: '#',
      shell: '#',
      perl: '#',
      javascript: '//',
      typescript: '//',
      java: '//',
      c: '//',
      cpp: '//',
      'c++': '//',
      scala: '//',
      go: '//',
      rust: '//',
      swift: '//',
      kotlin: '//',
      matlab: '%',
      octave: '%',
      lua: '--',
      sql: '--',
      haskell: '--',
    };

    return commentMap[language.toLowerCase()] || '#';
  }

  private _contentsManager: Contents.IManager;
}

/**
 * The nbconvert manager plugin.
 */
const nbConvertManagerPlugin: ServiceManagerPlugin<NbConvert.IManager> = {
  id: '@jupyterlite/services-extension:nbconvert-manager',
  description: 'The nbconvert manager plugin.',
  autoStart: true,
  provides: INbConvertManager,
  requires: [IContentsManager],
  optional: [IServerSettings],
  activate: (
    _: null,
    contentsManager: Contents.IManager,
    serverSettings: ServerConnection.ISettings | undefined,
  ): NbConvert.IManager => {
    return new LiteNbConvertManager({ contentsManager, serverSettings });
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
