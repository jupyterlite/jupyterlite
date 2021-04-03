// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  JupyterLiteServer,
  JupyterLiteServerPlugin,
  JupyterServer,
  LiteServiceManager
} from '@jupyterlite/server';

import {
  IKernels,
  Kernels,
  IKernelSpecs,
  KernelSpecs
} from '@jupyterlite/kernel';

import { ISessions, Sessions } from '@jupyterlite/session';

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
  requires: [IKernels, IKernelSpecs, ISessions],
  activate: (
    app: JupyterLiteServer,
    kernels: IKernels,
    kernelspecs: IKernelSpecs,
    sessions: ISessions
  ) => {
    console.log(server.id, 'activated');
    const jupyterServer = new JupyterServer({ kernels, kernelspecs, sessions });
    const serviceManager = new LiteServiceManager({ server: jupyterServer });
    app.registerServiceManager(serviceManager);
    console.log(jupyterServer);
  }
};

const plugins: JupyterLiteServerPlugin<any>[] = [
  kernels,
  kernelSpec,
  server,
  sessions
];

export default plugins;
