// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { PageConfig, URLExt } from '@jupyterlab/coreutils';

import { JupyterLiteServer, JupyterLiteServerPlugin } from '@jupyterlite/server';

import { IKernel, IKernelSpecs } from '@jupyterlite/kernel';

/**
 * The default CDN fallback for Pyodide
 */
const PYODIDE_CDN_URL = 'https://cdn.jsdelivr.net/pyodide/v0.20.0/full/pyodide.js';

/**
 * The id for the extension, and key in the litePlugins.
 */
const PLUGIN_ID = '@jupyterlite/pyolite-kernel-extension:kernel';

/**
 * A plugin to register the Pyodide kernel.
 */
const kernel: JupyterLiteServerPlugin<void> = {
  id: PLUGIN_ID,
  autoStart: true,
  requires: [IKernelSpecs],
  activate: (app: JupyterLiteServer, kernelspecs: IKernelSpecs) => {
    const baseUrl = PageConfig.getBaseUrl();
    const config =
      JSON.parse(PageConfig.getOption('litePluginSettings') || '{}')[PLUGIN_ID] || {};
    const url = config.pyodideUrl || PYODIDE_CDN_URL;
    const pyodideUrl = URLExt.parse(url).href;
    const rawPipUrls = config.pipliteUrls || [];
    const pipliteUrls = rawPipUrls.map((pipUrl: string) => URLExt.parse(pipUrl).href);
    const disablePyPIFallback = !!config.disablePyPIFallback;

    // TODO Register the service worker from somewhere else?
    navigator.serviceWorker.register('/services.js').then(
      registration => {
        // Registration was successful
        console.log(
          'ServiceWorker registration successful with scope: ',
          registration.scope
        );
      },
      err => {
        // registration failed :(
        console.log('ServiceWorker registration failed: ', err);
      }
    );

    kernelspecs.register({
      spec: {
        name: 'python',
        display_name: 'Pyolite',
        language: 'python',
        argv: [],
        resources: {
          'logo-32x32': 'TODO',
          'logo-64x64': URLExt.join(baseUrl, '/kernelspecs/python.png'),
        },
      },
      create: async (options: IKernel.IOptions): Promise<IKernel> => {
        const { PyoliteKernel } = await import('@jupyterlite/pyolite-kernel');

        return new PyoliteKernel({
          ...options,
          pyodideUrl,
          pipliteUrls,
          disablePyPIFallback,
        });
      },
    });
  },
};

const plugins: JupyterLiteServerPlugin<any>[] = [kernel];

export default plugins;
