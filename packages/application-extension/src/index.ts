// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { JupyterFrontEndPlugin, JupyterFrontEnd } from '@jupyterlab/application';

import { ICommandPalette, Dialog, showDialog } from '@jupyterlab/apputils';

import { PageConfig } from '@jupyterlab/coreutils';

import { IDocumentManager } from '@jupyterlab/docmanager';

import {
  IDocumentProvider,
  IDocumentProviderFactory,
  ProviderMock
} from '@jupyterlab/docprovider';

import { WebsocketProvider } from 'y-websocket';

import { IMainMenu } from '@jupyterlab/mainmenu';

import { ITranslator, TranslationManager } from '@jupyterlab/translation';

const YJS_WEBSOCKET_URL = 'wss://demos.yjs.dev';

class WebSocketProvider extends WebsocketProvider implements IDocumentProvider {
  constructor(options: IDocumentProviderFactory.IOptions) {
    super(YJS_WEBSOCKET_URL, options.guid, options.ymodel.ydoc);
  }
  requestInitialContent(): Promise<boolean> {
    return Promise.resolve(true);
  }
  putInitializedState(): void {
    // no-op
  }
  acquireLock(): Promise<number> {
    return Promise.resolve(0);
  }
  releaseLock(lock: number): void {
    // no-op
  }
}

/**
 * The command IDs used by the application extension.
 */
namespace CommandIDs {
  export const download = 'docmanager:download';
}

/**
 * An alternative document provider plugin
 */
const docProviderPlugin: JupyterFrontEndPlugin<IDocumentProviderFactory> = {
  id: '@jupyterlite/application-extension:docprovider',
  provides: IDocumentProviderFactory,
  activate: (app: JupyterFrontEnd): IDocumentProviderFactory => {
    const collaborative = PageConfig.getOption('collaborative');
    const factory = (options: IDocumentProviderFactory.IOptions): IDocumentProvider => {
      return collaborative ? new WebSocketProvider(options) : new ProviderMock();
    };
    return factory;
  }
};

/**
 * A plugin providing download commands in the file menu and command palette.
 */
const downloadPlugin: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlite/application-extension:download',
  autoStart: true,
  requires: [ITranslator, IDocumentManager],
  optional: [ICommandPalette, IMainMenu],
  activate: (
    app: JupyterFrontEnd,
    translator: ITranslator,
    docManager: IDocumentManager,
    palette: ICommandPalette | null,
    mainMenu: IMainMenu | null
  ) => {
    const trans = translator.load('jupyterlab');
    const { commands, shell } = app;
    const isEnabled = () => {
      const { currentWidget } = shell;
      return !!(currentWidget && docManager.contextForWidget(currentWidget));
    };
    commands.addCommand(CommandIDs.download, {
      label: trans.__('Download'),
      caption: trans.__('Download the file to your computer'),
      isEnabled,
      execute: () => {
        // Checks that shell.currentWidget is valid:
        const current = shell.currentWidget;
        if (isEnabled() && current) {
          const context = docManager.contextForWidget(current);
          if (!context) {
            return showDialog({
              title: trans.__('Cannot Download'),
              body: trans.__('No context found for current widget!'),
              buttons: [Dialog.okButton({ label: trans.__('OK') })]
            });
          }
          const element = document.createElement('a');
          element.href = `data:text/json;charset=utf-8,${encodeURIComponent(
            context.model.toString()
          )}`;
          element.download = context.path;
          document.body.appendChild(element);
          element.click();
          document.body.removeChild(element);
        }
      }
    });

    const category = trans.__('File Operations');

    if (palette) {
      palette.addItem({ command: CommandIDs.download, category });
    }

    if (mainMenu) {
      mainMenu.fileMenu.addGroup([{ command: CommandIDs.download }], 6);
    }
  }
};

/**
 * A simplified Translator
 */
const translator: JupyterFrontEndPlugin<ITranslator> = {
  id: '@jupyterlite/application-extension:translator',
  activate: (app: JupyterFrontEnd): ITranslator => {
    const translationManager = new TranslationManager();
    return translationManager;
  },
  autoStart: true,
  provides: ITranslator
};

const plugins: JupyterFrontEndPlugin<any>[] = [
  docProviderPlugin,
  downloadPlugin,
  translator
];

export default plugins;
