// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  ILabStatus,
  IRouter,
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  Router,
} from '@jupyterlab/application';

import { IThemeManager, IToolbarWidgetRegistry } from '@jupyterlab/apputils';

import { ConsolePanel, IConsoleTracker } from '@jupyterlab/console';

import { ITranslator } from '@jupyterlab/translation';

import { SingleWidgetApp } from '@jupyterlite/application';

import { liteIcon } from '@jupyterlite/ui-components';

import { Widget } from '@lumino/widgets';

/**
 * The name of the translation bundle for internationalized strings.
 */
const I18N_BUNDLE = 'jupyterlite';

/**
 * A plugin to add buttons to the console toolbar.
 */
const buttons: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlite/repl-extension:buttons',
  autoStart: true,
  requires: [ITranslator],
  optional: [IToolbarWidgetRegistry],
  activate: (
    app: JupyterFrontEnd,
    translator: ITranslator,
    toolbarRegistry: IToolbarWidgetRegistry | null,
  ) => {
    const trans = translator.load(I18N_BUNDLE);

    if (toolbarRegistry) {
      const factory = 'ConsolePanel';
      toolbarRegistry.addFactory<ConsolePanel>(factory, 'liteIcon', (panel) => {
        const node = document.createElement('a');
        node.title = trans.__('Powered by JupyterLite');
        node.href = 'https://github.com/jupyterlite/jupyterlite';
        node.target = '_blank';
        node.rel = 'noopener noreferrer';
        const poweredBy = new Widget({ node });
        liteIcon.element({
          container: node,
          elementPosition: 'center',
          margin: '2px',
          height: 'auto',
          width: '16px',
        });

        poweredBy.addClass('jp-PoweredBy');
        return poweredBy;
      });
    }
  },
};

/**
 * A plugin to open a code console and
 * parse custom parameters from the query string arguments.
 */
const consolePlugin: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlite/repl-extension:console',
  autoStart: true,
  optional: [IConsoleTracker, IThemeManager],
  activate: (
    app: JupyterFrontEnd,
    tracker: IConsoleTracker | null,
    themeManager: IThemeManager | null,
  ) => {
    if (!tracker) {
      return;
    }
    const { commands, serviceManager, started } = app;

    const search = window.location.search;
    const urlParams = new URLSearchParams(search);
    const code = urlParams.getAll('code');
    const execute = urlParams.get('execute');
    const kernel = urlParams.get('kernel') || undefined;
    const theme = urlParams.get('theme')?.trim();
    const toolbar = urlParams.get('toolbar');

    Promise.all([started, serviceManager.ready]).then(async () => {
      commands.execute('console:create', { kernelPreference: { name: kernel } });
    });

    if (theme && themeManager) {
      const themeName = decodeURIComponent(theme);
      themeManager.setTheme(themeName);
    }

    tracker.widgetAdded.connect(async (_, widget) => {
      const { console } = widget;

      if (!toolbar) {
        // hide the toolbar by default if not specified
        widget.toolbar.dispose();
      }

      if (code) {
        await console.sessionContext.ready;
        if (execute === '0') {
          const codeContent = code.join('\n');
          console.replaceSelection(codeContent);
        } else {
          code.forEach((line) => console.inject(line));
        }
      }
    });
  },
};

/**
 * The default JupyterLab application status provider.
 */
const status: JupyterFrontEndPlugin<ILabStatus> = {
  id: '@jupyterlite/repl-extension:status',
  autoStart: true,
  provides: ILabStatus,
  requires: [ITranslator],
  activate: (app: JupyterFrontEnd, translator: ITranslator) => {
    if (!(app instanceof SingleWidgetApp)) {
      const trans = translator.load(I18N_BUNDLE);
      throw new Error(trans.__('%1 must be activated in SingleWidgetApp.', status.id));
    }
    return app.status;
  },
};

/**
 * The default paths for a single widget app.
 */
const paths: JupyterFrontEndPlugin<JupyterFrontEnd.IPaths> = {
  id: '@jupyterlite/repl-extension:paths',
  autoStart: true,
  provides: JupyterFrontEnd.IPaths,
  activate: (app: JupyterFrontEnd): JupyterFrontEnd.IPaths => {
    if (!(app instanceof SingleWidgetApp)) {
      throw new Error(`${paths.id} must be activated in SingleWidgetApp.`);
    }
    return app.paths;
  },
};

/**
 * The default URL router provider.
 */
const router: JupyterFrontEndPlugin<IRouter> = {
  id: '@jupyterlite/repl-extension:router',
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
  },
};

const plugins: JupyterFrontEndPlugin<any>[] = [
  buttons,
  consolePlugin,
  paths,
  router,
  status,
];

export default plugins;
