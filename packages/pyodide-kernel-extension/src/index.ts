// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  JupyterLiteServer,
  JupyterLiteServerPlugin
} from '@jupyterlite/server';

import { IKernel, IKernelSpecs } from '@jupyterlite/kernel';

import { PyodideKernel } from '@jupyterlite/pyodide-kernel';

/**
 * A plugin to register the Pyodide kernel.
 */
const kernel: JupyterLiteServerPlugin<void> = {
  id: '@jupyterlite/pyodide-kernel-extension:kernel',
  autoStart: true,
  requires: [IKernelSpecs],
  activate: (app: JupyterLiteServer, kernelspecs: IKernelSpecs) => {
    kernelspecs.register({
      spec: {
        name: 'python',
        display_name: 'Pyodide',
        language: 'python',
        argv: [],
        spec: {
          argv: [],
          env: {},
          display_name: 'Pyodide',
          language: 'python',
          interrupt_mode: 'message',
          metadata: {}
        },
        resources: {
          'logo-32x32': 'TODO',
          'logo-64x64': '/kernelspecs/python.png'
        }
      },
      create: async (options: IKernel.IOptions): Promise<IKernel> => {
        return new PyodideKernel(options);
      }
    });
  }
};

const plugins: JupyterLiteServerPlugin<any>[] = [kernel];

export default plugins;
