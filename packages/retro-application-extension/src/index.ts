// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  IRouter,
  JupyterFrontEndPlugin,
  JupyterFrontEnd
} from '@jupyterlab/application';

import { PageConfig, PathExt } from '@jupyterlab/coreutils';

import { IDocumentManager } from '@jupyterlab/docmanager';

import { DocumentRegistry, IDocumentWidget } from '@jupyterlab/docregistry';

import { Kernel } from '@jupyterlab/services';

import { liteWordmark } from '@jupyterlite/ui-components';

import { Widget } from '@lumino/widgets';

/**
 * The default notebook factory.
 */
const NOTEBOOK_FACTORY = 'Notebook';

/**
 * The editor factory.
 */
const EDITOR_FACTORY = 'Editor';

/**
 * A regular expression to match path to notebooks and documents
 */
const TREE_PATTERN = new RegExp('/(notebooks|edit)\\/?');

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
  }
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
      width: 'auto'
    });
    logo.id = 'jp-RetroLogo';
    app.shell.add(logo, 'top', { rank: 0 });
  }
};

/**
 * A custom openeer plugin to pass the path to documents as
 * query string parameters.
 */
const opener: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlite/retro-application-extension:opener',
  autoStart: true,
  requires: [IRouter, IDocumentManager],
  activate: (
    app: JupyterFrontEnd,
    router: IRouter,
    docManager: IDocumentManager
  ): void => {
    const { commands } = app;

    const command = 'router:tree';
    commands.addCommand(command, {
      execute: (args: any) => {
        const parsed = args as IRouter.ILocation;
        // use request to do the matching
        const matches = parsed.request.match(TREE_PATTERN) ?? [];
        if (!matches) {
          return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const path = urlParams.get('path');
        if (!path) {
          return;
        }
        const file = decodeURIComponent(path);
        const ext = PathExt.extname(file);
        app.restored.then(() => {
          // TODO: get factory from file type instead?
          if (ext === '.ipynb') {
            docManager.open(file, NOTEBOOK_FACTORY, undefined, {
              ref: '_noref'
            });
          } else {
            docManager.open(file, EDITOR_FACTORY, undefined, {
              ref: '_noref'
            });
          }
        });
      }
    });

    router.register({ command, pattern: TREE_PATTERN });
  }
};

const plugins: JupyterFrontEndPlugin<any>[] = [docmanager, logo, opener];

export default plugins;
