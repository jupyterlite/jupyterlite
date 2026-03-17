// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import type { JupyterFrontEndPlugin } from '@jupyterlab/application';
import { ILabStatus, IRouter, JupyterFrontEnd, Router } from '@jupyterlab/application';

import {
  Clipboard,
  CommandToolbarButton,
  ICommandPalette,
  SemanticCommand,
  IThemeManager,
  IToolbarWidgetRegistry,
} from '@jupyterlab/apputils';

import type { CodeConsole, ConsolePanel } from '@jupyterlab/console';
import { IConsoleTracker } from '@jupyterlab/console';

import { ITranslator } from '@jupyterlab/translation';

import { shareIcon } from '@jupyterlab/ui-components';

import { SingleWidgetApp } from '@jupyterlite/application';

import { liteIcon } from '@jupyterlite/ui-components';

import type { ReadonlyPartialJSONObject } from '@lumino/coreutils';
import { Widget } from '@lumino/widgets';

/**
 * The name of the translation bundle for internationalized strings.
 */
const I18N_BUNDLE = 'jupyterlite';

/**
 * The command ids used by the REPL extension.
 */
namespace CommandIDs {
  export const copyShareableLink = 'repl:copy-shareable-link';
}

const DEFAULT_REPL_CONFIG: Required<CodeConsole.IConfig> = {
  clearCellsOnExecute: false,
  clearCodeContentOnExecute: true,
  hideCodeInput: false,
  promptCellPosition: 'bottom',
  showBanner: true,
};

const SHAREABLE_PARAMETERS = [
  'clearCellsOnExecute',
  'clearCodeContentOnExecute',
  'code',
  'execute',
  'hideCodeInput',
  'kernel',
  'promptCellPosition',
  'showBanner',
  'theme',
  'toolbar',
];

/**
 * A plugin to add buttons to the console toolbar.
 */
const buttons: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlite/repl-extension:buttons',
  description: 'Adds toolbar buttons to the console panel.',
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
 * A plugin to expose a shareable REPL link command and toolbar button.
 */
const share: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlite/repl-extension:share',
  autoStart: true,
  requires: [IConsoleTracker, ITranslator],
  optional: [ICommandPalette, IThemeManager, IToolbarWidgetRegistry],
  activate: (
    app: JupyterFrontEnd,
    tracker: IConsoleTracker,
    translator: ITranslator,
    palette: ICommandPalette | null,
    themeManager: IThemeManager | null,
    toolbarRegistry: IToolbarWidgetRegistry | null,
  ) => {
    const trans = translator.load(I18N_BUNDLE);
    const { commands } = app;
    const getCurrent = (args: ReadonlyPartialJSONObject = {}): ConsolePanel | null => {
      const widget = args[SemanticCommand.WIDGET];

      return typeof widget === 'string'
        ? tracker.find((panel) => panel.id === widget) ?? null
        : tracker.currentWidget;
    };

    commands.addCommand(CommandIDs.copyShareableLink, {
      execute: (args: ReadonlyPartialJSONObject) => {
        const panel = getCurrent(args);
        if (!panel) {
          return;
        }

        const url = new URL(window.location.href);
        SHAREABLE_PARAMETERS.forEach((parameter) => {
          url.searchParams.delete(parameter);
        });

        const config = Private.getConsoleConfig(panel);
        const promptCode =
          panel.console.promptCell?.model.sharedModel.getSource() ?? '';
        const kernelName = panel.sessionContext.session?.kernel?.name ?? '';
        const theme = themeManager?.theme?.trim() ?? '';

        if (!panel.toolbar.isDisposed) {
          url.searchParams.set('toolbar', '1');
        }

        if (kernelName) {
          url.searchParams.set('kernel', kernelName);
        }

        if (theme) {
          url.searchParams.set('theme', theme);
        }

        url.searchParams.set('promptCellPosition', config.promptCellPosition);

        if (config.clearCellsOnExecute) {
          url.searchParams.set('clearCellsOnExecute', '1');
        }

        if (!config.clearCodeContentOnExecute) {
          url.searchParams.set('clearCodeContentOnExecute', '0');
        }

        if (config.hideCodeInput) {
          url.searchParams.set('hideCodeInput', '1');
        }

        if (!config.showBanner) {
          url.searchParams.set('showBanner', '0');
        }

        if (promptCode !== '') {
          url.searchParams.set('execute', '0');
          promptCode.split('\n').forEach((line) => {
            url.searchParams.append('code', line);
          });
        }

        window.history.replaceState(
          window.history.state,
          document.title,
          `${url.pathname}${url.search}${url.hash}`,
        );

        Clipboard.copyToSystem(url.toString());
        return url.toString();
      },
      icon: (args) => (args['isPalette'] ? undefined : shareIcon),
      isEnabled: (args) => !!getCurrent(args),
      caption: trans.__(
        'Copy a shareable link for this REPL with the current prompt and options',
      ),
      label: trans.__('Copy Shareable Link'),
    });

    if (palette) {
      palette.addItem({
        command: CommandIDs.copyShareableLink,
        category: trans.__('REPL'),
        args: { isPalette: true },
      });
    }

    if (toolbarRegistry) {
      toolbarRegistry.addFactory<ConsolePanel>(
        'ConsolePanel',
        'copyShareableLink',
        (panel) =>
          new CommandToolbarButton({
            commands,
            id: CommandIDs.copyShareableLink,
            args: { [SemanticCommand.WIDGET]: panel.id },
            icon: shareIcon,
            label: '',
            caption: trans.__('Copy Shareable Link'),
            noFocusOnClick: panel.toolbar.noFocusOnClick,
          }),
      );
    }
  },
};

/**
 * A plugin to open a code console and
 * parse custom parameters from the query string arguments.
 */
const consolePlugin: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlite/repl-extension:console',
  description: 'Opens a code console and parses URL query parameters.',
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
  description: 'Provides the application status for the REPL app.',
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
  description: 'Provides the default paths for the REPL app.',
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
  description: 'Provides the URL router for the REPL app.',
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
  share,
  status,
];

export default plugins;

namespace Private {
  export function getConsoleConfig(panel: ConsolePanel): Required<CodeConsole.IConfig> {
    // JupyterLab exposes config updates but not a public getter.
    const config = (panel.console as any)._config as CodeConsole.IConfig | undefined;

    return {
      ...DEFAULT_REPL_CONFIG,
      ...config,
    };
  }
}
