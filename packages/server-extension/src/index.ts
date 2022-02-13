// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { PageConfig } from '@jupyterlab/coreutils';

import { Contents, IContents } from '@jupyterlite/contents';

import { IKernels, Kernels, IKernelSpecs, KernelSpecs } from '@jupyterlite/kernel';

import {
  JupyterLiteServer,
  JupyterLiteServerPlugin,
  JupyterServer,
  LiteServiceManager,
} from '@jupyterlite/server';

import { ISessions, Sessions } from '@jupyterlite/session';

import { ISettings, Settings } from '@jupyterlite/settings';

import { ITranslation, Translation } from '@jupyterlite/translation';

/**
 * The contents service plugin.
 */
const contents: JupyterLiteServerPlugin<IContents> = {
  id: '@jupyterlite/server-extension:contents',
  autoStart: true,
  provides: IContents,
  activate: (app: JupyterLiteServer) => {
    const contentsStorageName = PageConfig.getOption('contentsStorageName');
    return new Contents({ contentsStorageName });
  },
};

/**
 * The kernels service plugin.
 */
const kernels: JupyterLiteServerPlugin<IKernels> = {
  id: '@jupyterlite/server-extension:kernels',
  autoStart: true,
  provides: IKernels,
  requires: [IKernelSpecs],
  activate: (app: JupyterLiteServer, kernelspecs: IKernelSpecs) => {
    return new Kernels({ kernelspecs });
  },
};

/**
 * The kernel spec service plugin.
 */
const kernelSpec: JupyterLiteServerPlugin<IKernelSpecs> = {
  id: '@jupyterlite/server-extension:kernelspec',
  autoStart: true,
  provides: IKernelSpecs,
  activate: (app: JupyterLiteServer) => {
    return new KernelSpecs({});
  },
};

/**
 * The sessions service plugin.
 */
const sessions: JupyterLiteServerPlugin<ISessions> = {
  id: '@jupyterlite/server-extension:sessions',
  autoStart: true,
  provides: ISessions,
  requires: [IKernels],
  activate: (app: JupyterLiteServer, kernels: IKernels) => {
    return new Sessions({ kernels });
  },
};

/**
 * The server plugin.
 */
const server: JupyterLiteServerPlugin<void> = {
  id: '@jupyterlite/server-extension:server',
  autoStart: true,
  requires: [IContents, IKernels, IKernelSpecs, ISessions, ISettings, ITranslation],
  activate: (
    app: JupyterLiteServer,
    contents: IContents,
    kernels: IKernels,
    kernelspecs: IKernelSpecs,
    sessions: ISessions,
    settings: ISettings,
    translation: ITranslation
  ) => {
    const jupyterServer = new JupyterServer({
      contents,
      kernels,
      kernelspecs,
      sessions,
      settings,
      translation,
    });
    const serviceManager = new LiteServiceManager({ server: jupyterServer });
    app.registerServiceManager(serviceManager);
  },
};

/**
 * The settings service plugin.
 */
const settings: JupyterLiteServerPlugin<ISettings> = {
  id: '@jupyterlite/server-extension:settings',
  autoStart: true,
  provides: ISettings,
  activate: (app: JupyterLiteServer) => {
    const settingsStorageName = PageConfig.getOption('settingsStorageName');
    return new Settings({ settingsStorageName });
  },
};

/**
 * The translation service plugin.
 */
const translation: JupyterLiteServerPlugin<ITranslation> = {
  id: '@jupyterlite/server-extension:translation',
  autoStart: true,
  provides: ITranslation,
  activate: (app: JupyterLiteServer) => {
    return new Translation();
  },
};

const plugins: JupyterLiteServerPlugin<any>[] = [
  contents,
  kernels,
  kernelSpec,
  server,
  sessions,
  settings,
  translation,
];

export default plugins;
