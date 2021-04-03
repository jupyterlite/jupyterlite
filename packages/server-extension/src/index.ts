// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  JupyterLiteServer,
  JupyterLiteServerPlugin,
  JupyterServer,
  LiteServiceManager
} from '@jupyterlite/server';

import {
  IKernelRegistry,
  IKernels,
  KernelRegistry,
  Kernels
} from '@jupyterlite/kernel';

import { ISessions, Sessions } from '@jupyterlite/session';

/**
 * The kernel registry plugin.
 */
const kernelRegistry: JupyterLiteServerPlugin<IKernelRegistry> = {
  id: '@jupyterlite/server-extension:kernel-registry',
  autoStart: true,
  provides: IKernelRegistry,
  activate: (app: JupyterLiteServer) => {
    const registry = new KernelRegistry();
    return registry;
  }
};

/**
 * The kernels service plugin.
 */
const kernels: JupyterLiteServerPlugin<IKernels> = {
  id: '@jupyterlite/server-extension:kernels',
  autoStart: true,
  provides: IKernels,
  requires: [IKernelRegistry],
  activate: (app: JupyterLiteServer, registry: IKernelRegistry) => {
    return new Kernels({ registry });
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
  requires: [IKernels, ISessions],
  activate: (
    app: JupyterLiteServer,
    kernels: IKernels,
    sessions: ISessions
  ) => {
    console.log(server.id, 'activated');
    const jupyterServer = new JupyterServer({ kernels, sessions });
    const serviceManager = new LiteServiceManager({ server: jupyterServer });
    app.registerServiceManager(serviceManager);
    console.log(jupyterServer);
  }
};

const plugins: JupyterLiteServerPlugin<any>[] = [
  kernelRegistry,
  kernels,
  server,
  sessions
];

export default plugins;
