// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { JupyterFrontEndPlugin, JupyterFrontEnd } from '@jupyterlab/application';

import { ITranslator } from '@jupyterlab/translation';

/**
 * Add a code console to the main area on startup
 */
const consolePlugin: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlite/console-extension:console',
  autoStart: true,
  requires: [ITranslator],
  activate: (app: JupyterFrontEnd, translator: ITranslator): void => {
    const { commands } = app;
    commands.execute('console:create', { kernelPreference: { name: 'javascript' } });
  }
};

const plugins: JupyterFrontEndPlugin<any>[] = [consolePlugin];

export default plugins;
