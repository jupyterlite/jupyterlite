// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { PageConfig, URLExt } from '@jupyterlab/coreutils';

import { JupyterLiteServer, JupyterLiteServerPlugin } from '@jupyterlite/server';

import { IKernel, IKernelSpecs } from '@jupyterlite/kernel';

import { PyoliteKernel } from '@jupyterlite/pyolite-kernel';

/**
 * The default CDN fallback for Pyodide
 */
const PYODIDE_CDN_URL = 'https://cdn.jsdelivr.net/pyodide/v0.18.0/full/pyodide.js';

/**
 * A plugin to register the Pyodide kernel.
 */
const kernel: JupyterLiteServerPlugin<void> = {
  id: '@jupyterlite/pyolite-kernel-extension:kernel',
  autoStart: true,
  requires: [IKernelSpecs],
  activate: (app: JupyterLiteServer, kernelspecs: IKernelSpecs) => {
    const url = PageConfig.getOption('pyodideUrl') || PYODIDE_CDN_URL;
    const pyodideUrl = URLExt.isLocal(url)
      ? URLExt.join(window.location.origin, url)
      : url;

    kernelspecs.register({
      spec: {
        name: 'python',
        display_name: 'Pyolite',
        language: 'python',
        argv: [],
        spec: {
          argv: [],
          env: {},
          display_name: 'Pyolite',
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
        return new PyoliteKernel({
          ...options,
          pyodideUrl
        });
      }
    });
  }
};

const plugins: JupyterLiteServerPlugin<any>[] = [kernel];

export default plugins;
