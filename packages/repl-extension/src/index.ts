// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import type { JupyterFrontEndPlugin } from '@jupyterlab/application';
import { ILabStatus, IRouter, JupyterFrontEnd, Router } from '@jupyterlab/application';

import {
  Clipboard,
  ICommandPalette,
  IThemeManager,
  IToolbarWidgetRegistry,
  Notification,
} from '@jupyterlab/apputils';

import type { CodeConsole, ConsolePanel } from '@jupyterlab/console';
import { IConsoleTracker } from '@jupyterlab/console';

import { ITranslator } from '@jupyterlab/translation';

import { shareIcon } from '@jupyterlab/ui-components';

import { SingleWidgetApp } from '@jupyterlite/application';

import { liteIcon } from '@jupyterlite/ui-components';

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

/**
 * Auto-close delay (in ms) for the link-copied notification. Notifications
 * without a positive `autoClose` delay are silent and do not show as a toast.
 */
const COPY_NOTIFICATION_AUTO_CLOSE = 5000;

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
  description: 'Adds a command to copy a shareable link to the current REPL state.',
  autoStart: true,
  requires: [IConsoleTracker, ITranslator],
  optional: [ICommandPalette, IThemeManager],
  activate: (
    app: JupyterFrontEnd,
    tracker: IConsoleTracker,
    translator: ITranslator,
    palette: ICommandPalette | null,
    themeManager: IThemeManager | null,
  ) => {
    const trans = translator.load(I18N_BUNDLE);
    const { commands } = app;
    let copyNotificationId = '';

    commands.addCommand(CommandIDs.copyShareableLink, {
      execute: () => {
        const panel = tracker.currentWidget;
        if (!panel) {
          return;
        }

        const url = new URL(window.location.href);
        // We share the state via the URL fragment rather than the query
        // string. Fragments are not subject to the same length limits and
        // are not stripped by some hosting platforms, such as Read The Docs.
        // xref https://github.com/jupyterlite/jupyterlite/issues/1983.
        const params = Private.parseHashParams(url.hash);
        SHAREABLE_PARAMETERS.forEach((parameter) => {
          // clear params from query string
          url.searchParams.delete(parameter);
          // clear params from fragment
          params.delete(parameter);
        });

        const config = Private.getConsoleConfig(panel);
        const promptCode =
          panel.console.promptCell?.model.sharedModel.getSource() ?? '';
        const kernelName = panel.sessionContext.session?.kernel?.name ?? '';
        const theme = themeManager?.theme?.trim() ?? '';

        if (!panel.toolbar.isDisposed) {
          params.set('toolbar', '1');
        }

        if (kernelName) {
          params.set('kernel', kernelName);
        }

        if (theme) {
          params.set('theme', theme);
        }

        if (config.promptCellPosition !== DEFAULT_REPL_CONFIG.promptCellPosition) {
          params.set('promptCellPosition', config.promptCellPosition);
        }

        if (config.clearCellsOnExecute) {
          params.set('clearCellsOnExecute', '1');
        }

        if (!config.clearCodeContentOnExecute) {
          params.set('clearCodeContentOnExecute', '0');
        }

        if (config.hideCodeInput) {
          params.set('hideCodeInput', '1');
        }

        if (!config.showBanner) {
          params.set('showBanner', '0');
        }

        if (promptCode !== '') {
          params.set('execute', '0');
          promptCode.split('\n').forEach((line) => {
            params.append('code', line);
          });
        }

        url.hash = params.toString();

        window.history.replaceState(
          window.history.state,
          document.title,
          `${url.pathname}${url.search}${url.hash}`,
        );

        Clipboard.copyToSystem(url.toString());

        // update the existing notification if any to avoid stacking them up
        const message = trans.__('Link copied to clipboard');
        const updated = Notification.update({
          id: copyNotificationId,
          message,
          autoClose: COPY_NOTIFICATION_AUTO_CLOSE,
        });
        if (!updated) {
          copyNotificationId = Notification.info(message, {
            autoClose: COPY_NOTIFICATION_AUTO_CLOSE,
          });
        }

        return url.toString();
      },
      icon: (args) => (args['isPalette'] ? undefined : shareIcon),
      isEnabled: () => !!tracker.currentWidget,
      caption: trans.__(
        'Copy a shareable link for this REPL with the current prompt and options',
      ),
      label: trans.__('Copy Shareable Link'),
      describedBy: {
        args: {
          type: 'object',
          properties: {
            isPalette: {
              type: 'boolean',
              description: trans.__('Whether the command is executed from the palette'),
            },
          },
        },
      },
    });

    if (palette) {
      palette.addItem({
        command: CommandIDs.copyShareableLink,
        category: trans.__('REPL'),
        args: { isPalette: true },
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

    const urlParams = Private.getShareableParams();
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
  /**
   * Parse a URL hash fragment as query-like parameters (`#key=value&...`)
   * @param hash The URL hash fragment to parse.
   * @returns A URLSearchParams object representing the parsed parameters.
   */
  export function parseHashParams(hash: string): URLSearchParams {
    let fragment = hash.startsWith('#') ? hash.slice(1) : hash;
    if (fragment.startsWith('?')) {
      fragment = fragment.slice(1);
    }
    return new URLSearchParams(fragment);
  }

  /**
   * Collect the shareable parameters from the current location.
   *
   * Sharing stores the REPL state in the URL fragment. Embedding configures the
   * REPL through the documented query parameters. Read the fragment when it
   * carries any shareable parameter, and the query string otherwise.
   *
   * @returns A URLSearchParams object containing the shareable parameters from the URL.
   */
  export function getShareableParams(): URLSearchParams {
    const hashParams = parseHashParams(window.location.hash);
    if (SHAREABLE_PARAMETERS.some((parameter) => hashParams.has(parameter))) {
      return hashParams;
    }
    return new URLSearchParams(window.location.search);
  }

  export function getConsoleConfig(panel: ConsolePanel): Required<CodeConsole.IConfig> {
    // JupyterLab exposes config updates but not a public getter.
    const config = ((panel.console as any)._config ?? {}) as CodeConsole.IConfig;

    return {
      clearCellsOnExecute:
        config.clearCellsOnExecute ?? DEFAULT_REPL_CONFIG.clearCellsOnExecute,
      clearCodeContentOnExecute:
        config.clearCodeContentOnExecute ??
        DEFAULT_REPL_CONFIG.clearCodeContentOnExecute,
      hideCodeInput: config.hideCodeInput ?? DEFAULT_REPL_CONFIG.hideCodeInput,
      promptCellPosition:
        config.promptCellPosition ?? DEFAULT_REPL_CONFIG.promptCellPosition,
      showBanner: config.showBanner ?? DEFAULT_REPL_CONFIG.showBanner,
    };
  }
}
