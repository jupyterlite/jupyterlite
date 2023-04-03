// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { PageConfig, URLExt } from '@jupyterlab/coreutils';

import { JupyterLiteServer, JupyterLiteServerPlugin } from '@jupyterlite/server';

import { IKernel, IKernelSpecs } from '@jupyterlite/kernel';

import { JavaScriptKernel } from '@jupyterlite/javascript-kernel';

/**
 * A plugin to register the JavaScript kernel.
 */
const kernel: JupyterLiteServerPlugin<void> = {
  id: '@jupyterlite/javascript-kernel-extension:kernel',
  autoStart: true,
  requires: [IKernelSpecs],
  activate: (app: JupyterLiteServer, kernelspecs: IKernelSpecs) => {
    const baseUrl = PageConfig.getBaseUrl();
    kernelspecs.register({
      spec: {
        name: 'javascript',
        display_name: 'JavaScript (Web Worker)',
        language: 'javascript',
        argv: [],
        resources: {
          'logo-32x32': '',
          'logo-64x64': URLExt.join(baseUrl, '/kernelspecs/javascript.svg'),
        },
      },
      create: async (options: IKernel.IOptions): Promise<IKernel> => {
        return new JavaScriptKernel(options);
      },
    });
  },
};

const plugins: JupyterLiteServerPlugin<any>[] = [kernel];

export default plugins;
