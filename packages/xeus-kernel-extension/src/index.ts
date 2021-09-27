// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { JupyterLiteServer, JupyterLiteServerPlugin } from '@jupyterlite/server';

import { IKernel, IKernelSpecs } from '@jupyterlite/kernel';

import { XeusServerKernel } from '@jupyterlite/xeus-kernel';

const server_kernel: JupyterLiteServerPlugin<void> = {
  id: '@jupyterlite/xeus-kernel-extension:kernel',
  autoStart: true,
  requires: [IKernelSpecs],
  activate: (app: JupyterLiteServer, kernelspecs: IKernelSpecs) => {
    kernelspecs.register({
      spec: {
        name: 'Lua',
        display_name: 'Lua',
        language: 'lua',
        argv: [],
        spec: {
          argv: [],
          env: {},
          display_name: 'Lua',
          language: 'lua',
          interrupt_mode: 'message',
          metadata: {}
        },
        resources: {
          'logo-32x32': '/kernelspecs/lua-logo-32x32.png',
          'logo-64x64': '/kernelspecs/lua-logo-64x64.png'
        }
      },
      create: async (options: IKernel.IOptions): Promise<IKernel> => {
        return new XeusServerKernel({
          ...options
        });
      }
    });
  }
};

const plugins: JupyterLiteServerPlugin<any>[] = [server_kernel];

export default plugins;
