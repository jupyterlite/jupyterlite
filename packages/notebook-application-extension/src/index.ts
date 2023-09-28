// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { JupyterFrontEndPlugin, JupyterFrontEnd } from '@jupyterlab/application';

import { PageConfig } from '@jupyterlab/coreutils';

import { liteWordmark } from '@jupyterlite/ui-components';

import { Widget } from '@lumino/widgets';

import { INotebookPathOpener, INotebookShell } from '@jupyter-notebook/application';

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

/**
 * A plugin to open paths in new browser tabs, using `?path=` to specify the path to open.
 */
const pathOpener: JupyterFrontEndPlugin<INotebookPathOpener> = {
  id: '@jupyterlite/notebook-application-extension:path-opener',
  autoStart: true,
  provides: INotebookPathOpener,
  activate: (app: JupyterFrontEnd): INotebookPathOpener => {
    return {
      open(options: INotebookPathOpener.IOpenOptions): Window | null {
        const { prefix, path, searchParams, target, features } = options;
        const url = new URL(prefix, window.location.origin);
        // initialize the new search params
        const search = new URLSearchParams(searchParams?.toString() ?? '');
        // open paths by setting the `?path=` search parameter
        if (path) {
          search.set('path', path);
        }
        const searchString = search.toString();
        if (searchString) {
          url.search = searchString;
        }
        return window.open(url, target, features);
      },
    };
  },
};

const plugins: JupyterFrontEndPlugin<any>[] = [logo, notifyCommands, pathOpener];

export default plugins;
