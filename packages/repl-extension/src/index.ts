// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import type { JupyterFrontEndPlugin } from '@jupyterlab/application';
import { ILabStatus, IRouter, JupyterFrontEnd, Router } from '@jupyterlab/application';

import { IThemeManager, IToolbarWidgetRegistry } from '@jupyterlab/apputils';

import type { CodeConsole, ConsolePanel } from '@jupyterlab/console';
import { IConsoleTracker } from '@jupyterlab/console';

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
    const { commands, started } = app;

    const search = window.location.search;
    const urlParams = new URLSearchParams(search);
    const code = urlParams.getAll('code');
    const execute = urlParams.get('execute');
    const kernel = urlParams.get('kernel') || undefined;
    const theme = urlParams.get('theme')?.trim();
    const toolbar = urlParams.get('toolbar');

    // normalize config options
    const clearCellsOnExecute =
      urlParams.get('clearCellsOnExecute') === '1' || undefined;
    const clearCodeContentOnExecute =
      urlParams.get('clearCodeContentOnExecute') === '0' ? false : undefined;
    const hideCodeInput = urlParams.get('hideCodeInput') === '1' || undefined;
    const showBanner = urlParams.get('showBanner') === '0' ? false : undefined;

    const position = urlParams.get('promptCellPosition') ?? '';
    const validPositions = ['top', 'bottom', 'left', 'right'];
    const promptCellPosition = validPositions.includes(position)
      ? (position as CodeConsole.PromptCellPosition)
      : undefined;

    started.then(async () => {
      // create a new console at application startup
      void commands.execute('console:create', {
        kernelPreference: { name: kernel },
      });
    });

    tracker.widgetAdded.connect(async (_, panel) => {
      if (!toolbar) {
        // hide the toolbar by default if not specified
        panel.toolbar.dispose();
      }

      const { console: widget } = panel;
      const { sessionContext } = widget;

      await sessionContext.ready;

      widget.setConfig({
        clearCellsOnExecute,
        clearCodeContentOnExecute,
        hideCodeInput,
        promptCellPosition,
        showBanner,
      });

      // TODO: find a better way to make sure the banner is removed if showBanner is false
      widget['_onKernelChanged']();

      if (code.length > 0) {
        if (execute === '0') {
          const codeContent = code.join('\n');
          widget.replaceSelection(codeContent);
        } else {
          code.forEach((line) => widget.inject(line));
        }
      }
    });

    if (theme && themeManager) {
      const themeName = decodeURIComponent(theme);
      themeManager.setTheme(themeName);
    }
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
