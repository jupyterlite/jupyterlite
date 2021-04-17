// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { Contents, IContents } from '@jupyterlite/contents';

import { IKernels, Kernels, IKernelSpecs, KernelSpecs } from '@jupyterlite/kernel';

import {
  JupyterLiteServer,
  JupyterLiteServerPlugin,
  JupyterServer,
  LiteServiceManager
} from '@jupyterlite/server';

import { ISessions, Sessions } from '@jupyterlite/session';

import { ISettings, Settings } from '@jupyterlite/settings';

/**
 * The contents service plugin.
 */
const contents: JupyterLiteServerPlugin<IContents> = {
  id: '@jupyterlite/server-extension:contents',
  autoStart: true,
  provides: IContents,
  activate: (app: JupyterLiteServer) => {
    return new Contents();
  }
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
  }
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
  }
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
  }
};

/**
 * The server plugin.
 */
const server: JupyterLiteServerPlugin<void> = {
  id: '@jupyterlite/server-extension:server',
  autoStart: true,
  requires: [IContents, IKernels, IKernelSpecs, ISessions, ISettings],
  activate: (
    app: JupyterLiteServer,
    contents: IContents,
    kernels: IKernels,
    kernelspecs: IKernelSpecs,
    sessions: ISessions,
    settings: ISettings
  ) => {
    const jupyterServer = new JupyterServer({
      contents,
      kernels,
      kernelspecs,
      sessions,
      settings
    });
    const serviceManager = new LiteServiceManager({ server: jupyterServer });
    app.registerServiceManager(serviceManager);
  }
};

/**
 * The settings service plugin.
 */
const settings: JupyterLiteServerPlugin<ISettings> = {
  id: '@jupyterlite/server-extension:settings',
  autoStart: true,
  provides: ISettings,
  activate: (app: JupyterLiteServer) => {
    return new Settings();
  }
};

const plugins: JupyterLiteServerPlugin<any>[] = [
  contents,
  kernels,
  kernelSpec,
  server,
  sessions,
  settings
];

export default plugins;
