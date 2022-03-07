// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { JupyterFrontEndPlugin, JupyterFrontEnd } from '@jupyterlab/application';

import { IConsoleTracker } from '@jupyterlab/console';

import { PageConfig, PathExt } from '@jupyterlab/coreutils';

import { IDocumentManager } from '@jupyterlab/docmanager';

import { DocumentRegistry, IDocumentWidget } from '@jupyterlab/docregistry';

import { Kernel } from '@jupyterlab/services';

import { liteWordmark } from '@jupyterlite/ui-components';

import { Widget } from '@lumino/widgets';

import { IRetroShell } from '@retrolab/application';

/**
 * Open consoles in a new tab.
 */
const consoles: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlite/retro-application-extension:consoles',
  requires: [IConsoleTracker],
  autoStart: true,
  activate: (app: JupyterFrontEnd, tracker: IConsoleTracker) => {
    const baseUrl = PageConfig.getBaseUrl();
    tracker.widgetAdded.connect(async (send, console) => {
      const { sessionContext } = console;
      const page = PageConfig.getOption('retroPage');
      if (page === 'consoles') {
        return;
      }
      const path = sessionContext.path;
      window.open(`${baseUrl}retro/consoles?path=${path}`, '_blank');

      // the widget is not needed anymore
      console.dispose();
    });
  },
};

/**
 * A plugin to open document in a new browser tab.
 *
 * TODO: remove and use a custom doc manager?
 */
const docmanager: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlite/retro-application-extension:docmanager',
  requires: [IDocumentManager],
  autoStart: true,
  activate: (app: JupyterFrontEnd, docManager: IDocumentManager) => {
    const baseUrl = PageConfig.getBaseUrl();

    // patch the `docManager.open` option to prevent the default behavior
    const docOpen = docManager.open;
    docManager.open = (
      path: string,
      widgetName = 'default',
      kernel?: Partial<Kernel.IModel>,
      options?: DocumentRegistry.IOpenOptions
    ): IDocumentWidget | undefined => {
      const ref = options?.ref;
      if (ref === '_noref') {
        docOpen.call(docManager, path, widgetName, kernel, options);
        return;
      }
      const ext = PathExt.extname(path);
      const route = ext === '.ipynb' ? 'notebooks' : 'edit';
      window.open(`${baseUrl}retro/${route}?path=${path}`);
      return undefined;
    };
  },
};

/**
 * The logo plugin.
 */
const logo: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlite/retro-application-extension:logo',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    const baseUrl = PageConfig.getBaseUrl();
    const node = document.createElement('a');
    node.href = `${baseUrl}retro/tree`;
    node.target = '_blank';
    node.rel = 'noopener noreferrer';
    const logo = new Widget({ node });

    liteWordmark.element({
      container: node,
      elementPosition: 'center',
      padding: '2px 2px 2px 8px',
      height: '28px',
      width: 'auto',
    });
    logo.id = 'jp-RetroLogo';
    app.shell.add(logo, 'top', { rank: 0 });
  },
};

/**
 * A plugin to trigger a refresh of the commands when the shell layout changes.
 */
const notifyCommands: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlite/retro-application-extension:notify-commands',
  autoStart: true,
  optional: [IRetroShell],
  activate: (app: JupyterFrontEnd, retroShell: IRetroShell | null) => {
    if (retroShell) {
      retroShell.currentChanged.connect(() => {
        requestAnimationFrame(() => {
          app.commands.notifyCommandChanged();
        });
      });
    }
  },
};

const plugins: JupyterFrontEndPlugin<any>[] = [
  consoles,
  docmanager,
  logo,
  notifyCommands,
];

export default plugins;
