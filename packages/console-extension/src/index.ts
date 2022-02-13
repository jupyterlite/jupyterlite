// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  ILabStatus,
  IRouter,
  JupyterFrontEndPlugin,
  JupyterFrontEnd,
  Router
} from '@jupyterlab/application';

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
 * The default JupyterLab application status provider.
 */
const status: JupyterFrontEndPlugin<ILabStatus> = {
  id: '@retrolab/application-extension:status',
  autoStart: true,
  provides: ILabStatus,
  activate: (app: JupyterFrontEnd) => {
    if (!(app instanceof SingleWidgetApp)) {
      throw new Error(`${status.id} must be activated in SingleWidgetApp.`);
    }
    return app.status;
  }
};

/**
 * The default paths for a single widget app.
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

/**
 * The default URL router provider.
 */
const router: JupyterFrontEndPlugin<IRouter> = {
  id: '@jupyterlite/console-extension:router',
  autoStart: true,
  provides: IRouter,
  requires: [JupyterFrontEnd.IPaths],
  activate: (app: JupyterFrontEnd, paths: JupyterFrontEnd.IPaths) => {
    const { commands } = app;
    const base = paths.urls.base;
    const router = new Router({ base, commands });
    void app.started.then(() => {
      // Route the very first request on load.
      void router.route();

      // Route all pop state events.
      window.addEventListener('popstate', () => {
        void router.route();
      });
    });
    return router;
  }
};

const plugins: JupyterFrontEndPlugin<any>[] = [consolePlugin, paths, router, status];

export default plugins;
