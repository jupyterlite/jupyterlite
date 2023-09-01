// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { JupyterFrontEndPlugin, JupyterFrontEnd } from '@jupyterlab/application';

import { IConsoleTracker } from '@jupyterlab/console';

import { PageConfig, PathExt } from '@jupyterlab/coreutils';

import { IDocumentWidgetOpener } from '@jupyterlab/docmanager';

import { DocumentRegistry, IDocumentWidget } from '@jupyterlab/docregistry';

import { liteWordmark } from '@jupyterlite/ui-components';

import { Signal } from '@lumino/signaling';

import { Widget } from '@lumino/widgets';

import { INotebookShell } from '@jupyter-notebook/application';

/**
 * Open consoles in a new tab.
 */
const consoles: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlite/notebook-application-extension:consoles',
  requires: [IConsoleTracker],
  autoStart: true,
  activate: (app: JupyterFrontEnd, tracker: IConsoleTracker) => {
    const baseUrl = PageConfig.getBaseUrl();
    tracker.widgetAdded.connect(async (send, console) => {
      const { sessionContext } = console;
      const page = PageConfig.getOption('notebookPage');
      if (page === 'consoles') {
        return;
      }
      const path = sessionContext.path;
      window.open(`${baseUrl}consoles?path=${path}`, '_blank');

      // the widget is not needed anymore
      console.dispose();
    });
  },
};

/**
 * A plugin to open documents in a new browser tab.
 * This plugin is different than the Notebook plugin because JupyterLite creates
 * links with `?path=...` to open documents.
 * TODO: investigate how to use the same plugin but make the query parameter configurable
 *
 */
const opener: JupyterFrontEndPlugin<IDocumentWidgetOpener> = {
  id: '@jupyterlite/notebook-application-extension:opener',
  autoStart: true,
  optional: [INotebookShell],
  provides: IDocumentWidgetOpener,
  activate: (app: JupyterFrontEnd, notebookShell: INotebookShell | null) => {
    const baseUrl = PageConfig.getBaseUrl();
    const docRegistry = app.docRegistry;
    let id = 0;
    return new (class {
      open(widget: IDocumentWidget, options?: DocumentRegistry.IOpenOptions) {
        const widgetName = options?.type ?? '';
        const ref = options?.ref;
        // check if there is an setting override and if it would add the widget in the main area
        const userLayoutArea = notebookShell?.userLayout?.[widgetName]?.area;

        if (ref !== '_noref' && userLayoutArea === undefined) {
          const path = widget.context.path;
          const ext = PathExt.extname(path);
          let route = 'edit';
          if (
            (widgetName === 'default' && ext === '.ipynb') ||
            widgetName.includes('Notebook')
          ) {
            route = 'notebooks';
          }
          let url = `${baseUrl}${route}?path=${path}`;
          // append ?factory only if it's not the default
          const defaultFactory = docRegistry.defaultWidgetFactory(path);
          if (widgetName !== defaultFactory.name) {
            url = `${url}?factory=${widgetName}`;
          }
          window.open(url);
          // dispose the widget since it is not used on this page
          widget.dispose();
          return;
        }

        // otherwise open the document on the current page

        if (!widget.id) {
          widget.id = `document-manager-${++id}`;
        }
        widget.title.dataset = {
          type: 'document-title',
          ...widget.title.dataset,
        };
        if (!widget.isAttached) {
          app.shell.add(widget, 'main', options || {});
        }
        app.shell.activateById(widget.id);
        this._opened.emit(widget);
      }

      get opened() {
        return this._opened;
      }

      private _opened = new Signal<this, IDocumentWidget>(this);
    })();
  },
};

/**
 * The logo plugin.
 */
const logo: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlite/notebook-application-extension:logo',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    const baseUrl = PageConfig.getBaseUrl();
    const node = document.createElement('a');
    node.href = `${baseUrl}tree`;
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
    logo.id = 'jp-NotebookLogo';
    app.shell.add(logo, 'top', { rank: 0 });
  },
};

/**
 * A plugin to trigger a refresh of the commands when the shell layout changes.
 */
const notifyCommands: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlite/notebook-application-extension:notify-commands',
  autoStart: true,
  optional: [INotebookShell],
  activate: (app: JupyterFrontEnd, notebookShell: INotebookShell | null) => {
    if (notebookShell) {
      notebookShell.currentChanged.connect(() => {
        requestAnimationFrame(() => {
          app.commands.notifyCommandChanged();
        });
      });
    }
  },
};

const plugins: JupyterFrontEndPlugin<any>[] = [consoles, logo, opener, notifyCommands];

export default plugins;
