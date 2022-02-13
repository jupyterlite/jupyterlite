// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { JupyterFrontEndPlugin, JupyterFrontEnd } from '@jupyterlab/application';

import { ITranslator } from '@jupyterlab/translation';

import { SingleWidgetApp } from '@jupyterlite/application';

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

/**
 * The default paths for a RetroLab app.
 */
const paths: JupyterFrontEndPlugin<JupyterFrontEnd.IPaths> = {
  id: '@jupyterlite/console-extension:paths',
  autoStart: true,
  provides: JupyterFrontEnd.IPaths,
  activate: (app: JupyterFrontEnd): JupyterFrontEnd.IPaths => {
    if (!(app instanceof SingleWidgetApp)) {
      throw new Error(`${paths.id} must be activated in SingleWidgetApp.`);
    }
    return app.paths;
  }
};

const plugins: JupyterFrontEndPlugin<any>[] = [consolePlugin, paths];

export default plugins;
