// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  JupyterFrontEndPlugin,
  JupyterFrontEnd,
  ILabShell
} from '@jupyterlab/application';

import { ICommandPalette, Dialog, showDialog } from '@jupyterlab/apputils';

import { PageConfig } from '@jupyterlab/coreutils';

import { IDocumentManager } from '@jupyterlab/docmanager';

import {
  IDocumentProvider,
  IDocumentProviderFactory,
  ProviderMock,
  getAnonymousUserName,
  getRandomColor
} from '@jupyterlab/docprovider';

import { IFileBrowserFactory } from '@jupyterlab/filebrowser';

import { IMainMenu } from '@jupyterlab/mainmenu';

import { Contents } from '@jupyterlab/services';

import { ITranslator } from '@jupyterlab/translation';

import { downloadIcon } from '@jupyterlab/ui-components';

import { liteIcon, liteWordmark } from '@jupyterlite/ui-components';

import { toArray } from '@lumino/algorithm';

import { UUID, PromiseDelegate } from '@lumino/coreutils';

import { Widget } from '@lumino/widgets';

import { getParam } from 'lib0/environment';

import { WebrtcProvider } from 'y-webrtc';

import React from 'react';

class WebRtcProvider extends WebrtcProvider implements IDocumentProvider {
  constructor(options: IDocumentProviderFactory.IOptions & { room: string }) {
    super(`${options.room}${options.path}`, options.ymodel.ydoc);
    this.awareness = options.ymodel.awareness;
    const color = `#${getParam('--usercolor', getRandomColor().slice(1))}`;
    const name = getParam('--username', getAnonymousUserName());
    const currState = this.awareness.getLocalState();
    // only set if this was not already set by another plugin
    if (currState && !currState.name) {
      this.awareness.setLocalStateField('user', {
        name,
        color
      });
    }
  }

  setPath() {
    // TODO: this seems super useful
  }

  requestInitialContent(): Promise<boolean> {
    if (this._initialRequest) {
      return this._initialRequest.promise;
    }
    let resolved = false;
    this._initialRequest = new PromiseDelegate<boolean>();
    this.on('synced', (event: any) => {
      if (this._initialRequest) {
        this._initialRequest.resolve(event.synced);
        resolved = true;
      }
    });
    // similar logic as in the upstream plugin
    setTimeout(() => {
      if (!resolved && this._initialRequest) {
        this._initialRequest.resolve(false);
      }
    }, 1000);
    return this._initialRequest.promise;
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

  private _initialRequest: PromiseDelegate<boolean> | null = null;
}

/**
 * The command IDs used by the application extension.
 */
namespace CommandIDs {
  export const about = 'application:about';

  export const docmanagerDownload = 'docmanager:download';

  export const filebrowserDownload = 'filebrowser:download';
}

/**
 * Add a command to show an About dialog.
 */
const about: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlite/application-extension:about',
  autoStart: true,
  requires: [ITranslator],
  optional: [ICommandPalette, IMainMenu],
  activate: (
    app: JupyterFrontEnd,
    translator: ITranslator,
    palette: ICommandPalette | null,
    menu: IMainMenu | null
  ): void => {
    const { commands } = app;
    const trans = translator.load('jupyterlab');
    const category = trans.__('Help');

    commands.addCommand(CommandIDs.about, {
      label: trans.__('About %1', app.name),
      execute: () => {
        const versionNumber = trans.__('Version %1', app.version);
        const versionInfo = (
          <span className="jp-About-version-info">
            <span className="jp-About-version">{versionNumber}</span>
          </span>
        );
        const title = (
          <span className="jp-About-header">
            <div className="jp-About-header-info">
              <liteWordmark.react height="auto" width="196px" />
              {versionInfo}
            </div>
          </span>
        );

        // Create the body of the about dialog
        const jupyterliteURL = 'https://github.com/jupyterlite/jupyterlite';
        const contributorsURL =
          'https://github.com/jupyterlite/jupyterlite/graphs/contributors';
        const externalLinks = (
          <span className="jp-About-externalLinks">
            <a
              href={contributorsURL}
              target="_blank"
              rel="noopener noreferrer"
              className="jp-Button-flat"
            >
              {trans.__('CONTRIBUTOR LIST')}
            </a>
            <a
              href={jupyterliteURL}
              target="_blank"
              rel="noopener noreferrer"
              className="jp-Button-flat"
            >
              {trans.__('JUPYTERLITE ON GITHUB')}
            </a>
          </span>
        );
        const copyright = (
          <span className="jp-About-copyright">
            {trans.__('© 2021 JupyterLite Contributors')}
          </span>
        );
        const body = (
          <div className="jp-About-body">
            {externalLinks}
            {copyright}
          </div>
        );

        return showDialog({
          title,
          body,
          buttons: [
            Dialog.createButton({
              label: trans.__('Dismiss'),
              className: 'jp-About-button jp-mod-reject jp-mod-styled'
            })
          ]
        });
      }
    });

    if (palette) {
      palette.addItem({ command: CommandIDs.about, category });
    }

    if (menu) {
      menu.helpMenu.addGroup([{ command: CommandIDs.about }], 0);
    }
  }
};

/**
 * An alternative document provider plugin
 */
const docProviderPlugin: JupyterFrontEndPlugin<IDocumentProviderFactory> = {
  id: '@jupyterlite/application-extension:docprovider',
  provides: IDocumentProviderFactory,
  activate: (app: JupyterFrontEnd): IDocumentProviderFactory => {
    const roomName = getParam('--room', '').trim();
    const host = window.location.host;
    // enable if both the page config option (deployment wide) and the room name (user) are defined
    const collaborative = PageConfig.getOption('collaborative') === 'true' && roomName;
    // default to a random id to not collaborate with others by default
    const room = `${host}-${roomName || UUID.uuid4()}`;
    const factory = (options: IDocumentProviderFactory.IOptions): IDocumentProvider => {
      return collaborative
        ? new WebRtcProvider({
            room,
            ...options
          })
        : new ProviderMock();
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
  optional: [ICommandPalette, IFileBrowserFactory, IMainMenu],
  activate: (
    app: JupyterFrontEnd,
    translator: ITranslator,
    docManager: IDocumentManager,
    palette: ICommandPalette | null,
    factory: IFileBrowserFactory | null
  ) => {
    const trans = translator.load('jupyterlab');
    const { commands, contextMenu, serviceManager, shell } = app;
    const isEnabled = () => {
      const { currentWidget } = shell;
      return !!(currentWidget && docManager.contextForWidget(currentWidget));
    };

    const downloadContent = (content: string, path: string) => {
      const element = document.createElement('a');
      element.href = `data:text/json;charset=utf-8,${encodeURIComponent(content)}`;
      element.download = path;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    };

    commands.addCommand(CommandIDs.docmanagerDownload, {
      label: trans.__('Download'),
      caption: trans.__('Download the file to your computer'),
      isEnabled,
      execute: () => {
        // Checks that shell.currentWidget is valid:
        const current = shell.currentWidget;
        if (!isEnabled() || !current) {
          return;
        }
        const context = docManager.contextForWidget(current);
        if (!context) {
          return showDialog({
            title: trans.__('Cannot Download'),
            body: trans.__('No context found for current widget!'),
            buttons: [Dialog.okButton({ label: trans.__('OK') })]
          });
        }
        downloadContent(context.model.toString(), context.path);
      }
    });

    const category = trans.__('File Operations');

    if (palette) {
      palette.addItem({ command: CommandIDs.docmanagerDownload, category });
    }

    if (factory) {
      const { tracker } = factory;
      const { contents } = serviceManager;

      commands.addCommand(CommandIDs.filebrowserDownload, {
        execute: async () => {
          const widget = tracker.currentWidget;

          if (!widget) {
            return;
          }
          const selected = toArray(widget.selectedItems());
          selected.forEach(async (item: Contents.IModel) => {
            if (item.type === 'directory') {
              return;
            }
            const file = await contents.get(item.path, { content: true });
            const formatted =
              file.type === 'notebook' || file.mimetype.indexOf('json') !== -1
                ? JSON.stringify(file.content, null, 2)
                : file.content;
            downloadContent(formatted, item.name);
          });
        },
        icon: downloadIcon.bindprops({ stylesheet: 'menuItem' }),
        label: trans.__('Download')
      });

      contextMenu.addItem({
        command: CommandIDs.filebrowserDownload,
        selector: '.jp-DirListing-item[data-isdir="false"]',
        rank: 9
      });
    }
  }
};

/**
 * The main application icon.
 */
const liteLogo: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlite/application-extension:logo',
  // marking as optional to not throw errors in retro
  optional: [ILabShell],
  autoStart: true,
  activate: (app: JupyterFrontEnd, labShell: ILabShell) => {
    if (!labShell) {
      return;
    }
    const logo = new Widget();
    liteIcon.element({
      container: logo.node,
      elementPosition: 'center',
      margin: '2px 2px 2px 8px',
      height: 'auto',
      width: '16px'
    });
    logo.id = 'jp-MainLogo';
    labShell.add(logo, 'top', { rank: 0 });
  }
};

const plugins: JupyterFrontEndPlugin<any>[] = [
  about,
  docProviderPlugin,
  downloadPlugin,
  liteLogo
];

export default plugins;
