// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { ReadonlyJSONObject } from '@lumino/coreutils';

import { Widget } from '@lumino/widgets';

import {
  ILabStatus,
  IRouter,
  JupyterFrontEndPlugin,
  JupyterFrontEnd,
  Router,
} from '@jupyterlab/application';

import { CommandToolbarButton, IThemeManager, Toolbar } from '@jupyterlab/apputils';

import { IConsoleTracker } from '@jupyterlab/console';

import { ITranslator } from '@jupyterlab/translation';

import { clearIcon, refreshIcon, runIcon } from '@jupyterlab/ui-components';

import { SingleWidgetApp } from '@jupyterlite/application';

import { liteIcon } from '@jupyterlite/ui-components';

import { IReplApi } from './tokens';
import { ReplApi } from './urls';

/**
 * A plugin to add buttons to the console toolbar.
 */
const buttons: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlite/console-application:buttons',
  autoStart: true,
  requires: [ITranslator],
  optional: [IConsoleTracker],
  activate: (
    app: JupyterFrontEnd,
    translator: ITranslator,
    tracker: IConsoleTracker | null
  ) => {
    if (!tracker) {
      return;
    }

    const { commands } = app;
    const trans = translator.load('jupyterlab');

    // wrapper commands to be able to override the icon
    const runCommand = 'repl:run';
    commands.addCommand(runCommand, {
      caption: trans.__('Run'),
      icon: runIcon,
      execute: () => {
        return commands.execute('console:run-forced');
      },
    });

    const runButton = new CommandToolbarButton({
      commands,
      id: runCommand,
    });

    const restartCommand = 'repl:restart';
    commands.addCommand(restartCommand, {
      caption: trans.__('Restart'),
      icon: refreshIcon,
      execute: () => {
        return commands.execute('console:restart-kernel');
      },
    });

    const restartButton = new CommandToolbarButton({
      commands,
      id: restartCommand,
    });

    const clearCommand = 'repl:clear';
    commands.addCommand(clearCommand, {
      caption: trans.__('Clear'),
      icon: clearIcon,
      execute: () => {
        return commands.execute('console:clear');
      },
    });

    const clearButton = new CommandToolbarButton({
      commands,
      id: clearCommand,
    });

    tracker.widgetAdded.connect((_, console) => {
      const { toolbar } = console;

      toolbar.addItem('run', runButton);
      toolbar.addItem('restart', restartButton);
      toolbar.addItem('clear', clearButton);

      toolbar.addItem('spacer', Toolbar.createSpacerItem());

      const node = document.createElement('a');
      node.title = trans.__('Powered by JupyterLite');
      node.href = 'https://github.com/jupyterlite/jupyterlite';
      node.target = '_blank';
      node.rel = 'noopener noreferrer';
      const poweredBy = new Widget({ node });
      liteIcon.element({
        container: node,
        elementPosition: 'center',
        margin: '2px 2px 2px 8px',
        height: 'auto',
        width: '16px',
      });

      poweredBy.addClass('jp-PoweredBy');
      toolbar.insertAfter('spacer', 'powered-by', poweredBy);
    });
  },
};

/**
 * A plugin to normalize the REPL GET param API
 */
const paramApiPlugin: JupyterFrontEndPlugin<IReplApi> = {
  id: '@jupyterlite/repl-extension:url-params',
  autoStart: true,
  provides: IReplApi,
  requires: [ITranslator],
  activate: (app: JupyterFrontEnd, translator: ITranslator) => {
    const trans = translator.load('jupyterlab');
    const api = new ReplApi({
      trans,
      defaultParams: new URLSearchParams(window.location.search),
    });
    return api;
  },
};

/**
 * A plugin that exposes the `kernel` URL param
 */
const kernelParamPlugin: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlite/repl-extension:kernel-url-param',
  autoStart: true,
  requires: [IReplApi],
  activate: (app: JupyterFrontEnd, replApi: IReplApi) => {
    const param = 'kernel';
    replApi.addUrlParam(param, {
      schema: async () => {
        return {
          title: 'Kernel',
          description: 'The name of the kernel to use',
          type: 'string',
          // TODO: add enum
        };
      },
      beforeConsoleCreated: async (args, params) => {
        const name = params && params.get('kernel');
        if (!name) {
          return args;
        }
        let kernelPreference = args.kernelPreference || {};
        kernelPreference = { ...kernelPreference, name };
        return { ...args, kernelPreference };
      },
    });
  },
};

/**
 * A plugin that exposes the `code` URL param
 */
const codeParamPlugin: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlite/repl-extension:code-url-param',
  autoStart: true,
  requires: [IReplApi],
  activate: (app: JupyterFrontEnd, replApi: IReplApi) => {
    const param = 'code';
    replApi.addUrlParam(param, {
      schema: async () => {
        return {
          title: 'Code',
          description: `
            Blocks of code to run as soon as possible.
            Errors will _not_ prevent following blocks from running.
          `,
          type: 'array',
          items: {
            type: 'string',
          },
        };
      },
      afterConsoleCreated: async (widget, params) => {
        const code = params && params.getAll(param);
        if (code && code.length) {
          widget.sessionContext.ready.then(() => {
            for (const line of code) {
              widget.console.inject(line);
            }
          });
        }
      },
    });
  },
};

/**
 * A plugin that exposes the `toolbar` URL param
 */
const toolbarParamPlugin: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlite/repl-extension:toolbar-url-param',
  autoStart: true,
  requires: [IReplApi],
  activate: (app: JupyterFrontEnd, replApi: IReplApi) => {
    const param = 'toolbar';
    replApi.addUrlParam(param, {
      schema: async () => {
        return {
          title: 'Toolbar',
          description: 'Whether to show the toolbar',
          type: 'boolean',
        };
      },
      afterConsoleCreated: async (widget, params) => {
        const showToolbar =
          params && JSON.parse((params.get(param) || '0').trim().toLowerCase());
        if (!showToolbar) {
          widget.toolbar.hide();
        } else {
          widget.toolbar.show();
        }
        widget.toolbar.update();
        widget.update();
      },
    });
  },
};

/**
 * A plugin that exposes the `theme` URL param
 */
const themeParamPlugin: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlite/repl-extension:theme-url-param',
  autoStart: true,
  requires: [IThemeManager, IReplApi],
  activate: (app: JupyterFrontEnd, themeManager: IThemeManager, replApi: IReplApi) => {
    const param = 'theme';
    const options = {
      schema: async () => {
        return {
          title: 'Theme',
          description: 'The JupyterLab theme to use',
          type: 'string',
        };
      },
      afterAppStarted: async (_app: JupyterFrontEnd, params: URLSearchParams) => {
        const theme = params && decodeURIComponent(params.get(param) || '');
        if (theme && themeManager.theme !== theme) {
          themeManager.setTheme(theme);
        }
      },
    };

    replApi.addUrlParam(param, options);

    // TODO: investigate theme behavior vs. toolbar/collapser
    options.afterAppStarted(app, replApi.defaultParams);
  },
};

/**
 * A plugin to open a code console and
 * parse custom parameters from the query string arguments.
 */
const consolePlugin: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlite/repl-extension:console',
  autoStart: true,
  optional: [IConsoleTracker, IReplApi],
  activate: (
    app: JupyterFrontEnd,
    tracker: IConsoleTracker | null,
    urlApi: IReplApi | null
  ) => {
    if (!tracker) {
      return;
    }
    const { commands } = app;

    app.started.then(async () => {
      urlApi && (await urlApi.afterAppStarted(app));
      const args = urlApi
        ? ((await urlApi.beforeConsoleCreated({})) as ReadonlyJSONObject)
        : {};
      await commands.execute('console:create', args);
    });

    tracker.widgetAdded.connect(async (_, widget) => {
      await widget.revealed;
      urlApi && (await urlApi.afterConsoleCreated(widget));
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
  activate: (app: JupyterFrontEnd) => {
    if (!(app instanceof SingleWidgetApp)) {
      throw new Error(`${status.id} must be activated in SingleWidgetApp.`);
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
  paramApiPlugin,
  kernelParamPlugin,
  codeParamPlugin,
  toolbarParamPlugin,
  themeParamPlugin,
  consolePlugin,
  paths,
  router,
  status,
];

export default plugins;
