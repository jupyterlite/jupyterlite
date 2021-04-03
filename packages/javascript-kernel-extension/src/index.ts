// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  JupyterLiteServer,
  JupyterLiteServerPlugin
} from '@jupyterlite/server';

import { IKernel, IKernelSpecs } from '@jupyterlite/kernel';

import { JavaScriptKernel } from '@jupyterlite/javascript-kernel';

/**
 * A plugin to register the JavaScrit kernel.
 */
const kernel: JupyterLiteServerPlugin<void> = {
  id: '@jupyterlite/javascript-kernel-extension:kernel',
  autoStart: true,
  requires: [IKernelSpecs],
  activate: (app: JupyterLiteServer, kernelspecs: IKernelSpecs) => {
    kernelspecs.register({
      spec: {
        name: 'javascript',
        display_name: 'JavaScript',
        language: 'javascript',
        argv: [],
        spec: {
          argv: [],
          env: {},
          display_name: 'JavaScript',
          language: 'javascript',
          interrupt_mode: 'message',
          metadata: {}
        },
        resources: {
          'logo-32x32': 'TODO',
          'logo-64x64': '/kernelspecs/javascript.svg'
        }
      },
      create: async (options: IKernel.IOptions): Promise<IKernel> => {
        return new JavaScriptKernel(options);
      }
    });
  }
};

const plugins: JupyterLiteServerPlugin<any>[] = [kernel];

export default plugins;
