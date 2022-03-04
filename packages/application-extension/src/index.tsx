// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  IRouter,
  JupyterFrontEndPlugin,
  JupyterFrontEnd,
  ILabShell,
} from '@jupyterlab/application';

import { Clipboard, ICommandPalette, Dialog, showDialog } from '@jupyterlab/apputils';

import { PageConfig, URLExt } from '@jupyterlab/coreutils';

import { IDocumentManager } from '@jupyterlab/docmanager';

import {
  IDocumentProvider,
  IDocumentProviderFactory,
  ProviderMock,
  getAnonymousUserName,
  getRandomColor,
} from '@jupyterlab/docprovider';

import { IFileBrowserFactory } from '@jupyterlab/filebrowser';

import { IMainMenu } from '@jupyterlab/mainmenu';

import { Contents } from '@jupyterlab/services';

import { ITranslator } from '@jupyterlab/translation';

import { downloadIcon, linkIcon } from '@jupyterlab/ui-components';

import { liteIcon, liteWordmark } from '@jupyterlite/ui-components';

import { filter, toArray } from '@lumino/algorithm';

import { UUID, PromiseDelegate } from '@lumino/coreutils';

import { Widget } from '@lumino/widgets';

import { getParam } from 'lib0/environment';

import { WebrtcProvider } from 'y-webrtc';

import { Awareness } from 'y-protocols/awareness';

import React from 'react';

/**
 * The default notebook factory.
 */
const NOTEBOOK_FACTORY = 'Notebook';

/**
 * The editor factory.
 */
const EDITOR_FACTORY = 'Editor';

/**
 * A regular expression to match path to notebooks, documents and consoles
 */
const URL_PATTERN = new RegExp('/(lab|notebooks|edit|consoles)\\/?');

class WebRtcProvider extends WebrtcProvider implements IDocumentProvider {
  constructor(options: IWebRtcProvider.IOptions) {
    super(
      `${options.room}${options.path}`,
      options.ymodel.ydoc,
      WebRtcProvider.yProviderOptions(options)
    );
    this.awareness = options.ymodel.awareness;
    const color = `#${getParam('--usercolor', getRandomColor().slice(1))}`;
    const name = getParam('--username', getAnonymousUserName());
    const currState = this.awareness.getLocalState();
    // only set if this was not already set by another plugin
    if (currState && !currState.name) {
      this.awareness.setLocalStateField('user', {
        name,
        color,
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
 * A public namespace for WebRTC options
 */
export namespace IWebRtcProvider {
  export interface IOptions extends IDocumentProviderFactory.IOptions {
    room: string;
    signalingUrls?: string[];
  }

  export interface IYjsWebRtcOptions {
    signaling: Array<string>;
    password: string | null;
    awareness: Awareness;
    maxConns: number;
    filterBcConns: boolean;
    peerOpts: any;
  }
}

/**
 * A private (so far) namespace for Yjs/WebRTC implementation details
 */
namespace WebRtcProvider {
  /**
   * Re-map Lab provider options to yjs ones.
   */
  export function yProviderOptions(
    options: IWebRtcProvider.IOptions
  ): IWebRtcProvider.IYjsWebRtcOptions {
    return {
      signaling:
        options.signalingUrls && options.signalingUrls.length
          ? options.signalingUrls
          : [
              'wss://signaling.yjs.dev',
              'wss://y-webrtc-signaling-eu.herokuapp.com',
              'wss://y-webrtc-signaling-us.herokuapp.com',
            ],
      password: null,
      awareness: new Awareness(options.ymodel.ydoc),
      maxConns: 20 + Math.floor(Math.random() * 15), // the random factor reduces the chance that n clients form a cluster
      filterBcConns: true,
      peerOpts: {}, // simple-peer options. See https://github.com/feross/simple-peer#peer--new-peeropts
    };
  }
}

/**
 * The command IDs used by the application extension.
 */
namespace CommandIDs {
  export const about = 'application:about';

  export const docmanagerDownload = 'docmanager:download';

  export const filebrowserDownload = 'filebrowser:download';

  export const copyShareableLink = 'filebrowser:share-main';
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
              className: 'jp-About-button jp-mod-reject jp-mod-styled',
            }),
          ],
        });
      },
    });

    if (palette) {
      palette.addItem({ command: CommandIDs.about, category });
    }

    if (menu) {
      menu.helpMenu.addGroup([{ command: CommandIDs.about }], 0);
    }
  },
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
    const signalingUrls = JSON.parse(
      PageConfig.getOption('fullWebRtcSignalingUrls') || 'null'
    );
    // default to a random id to not collaborate with others by default
    const room = `${host}-${roomName || UUID.uuid4()}`;
    const factory = (options: IDocumentProviderFactory.IOptions): IDocumentProvider => {
      return collaborative
        ? new WebRtcProvider({
            room,
            ...options,
            ...(signalingUrls && signalingUrls.length ? { signalingUrls } : {}),
          })
        : new ProviderMock();
    };
    return factory;
  },
};

/**
 * A plugin providing download commands in the file menu and command palette.
 */
const downloadPlugin: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlite/application-extension:download',
  autoStart: true,
  requires: [ITranslator, IDocumentManager],
  optional: [ICommandPalette, IFileBrowserFactory],
  activate: (
    app: JupyterFrontEnd,
    translator: ITranslator,
    docManager: IDocumentManager,
    palette: ICommandPalette | null,
    factory: IFileBrowserFactory | null
  ) => {
    const trans = translator.load('jupyterlab');
    const { commands, serviceManager, shell } = app;
    const { contents } = serviceManager;

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

    const formatContent = async (path: string) => {
      const model = await contents.get(path, { content: true });
      if (model.type === 'notebook' || model.mimetype.indexOf('json') !== -1) {
        return JSON.stringify(model.content, null, 2);
      }
      return model.content;
    };

    commands.addCommand(CommandIDs.docmanagerDownload, {
      label: trans.__('Download'),
      caption: trans.__('Download the file to your computer'),
      isEnabled,
      execute: async () => {
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
            buttons: [Dialog.okButton({ label: trans.__('OK') })],
          });
        }
        const content = await formatContent(context.path);
        downloadContent(content, context.path);
      },
    });

    const category = trans.__('File Operations');

    if (palette) {
      palette.addItem({ command: CommandIDs.docmanagerDownload, category });
    }

    if (factory) {
      const { tracker } = factory;

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
            const content = await formatContent(item.path);
            downloadContent(content, item.name);
          });
        },
        icon: downloadIcon.bindprops({ stylesheet: 'menuItem' }),
        label: trans.__('Download'),
      });
    }
  },
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
      width: '16px',
    });
    logo.id = 'jp-MainLogo';
    labShell.add(logo, 'top', { rank: 0 });
  },
};

/**
 * A plugin to trigger a refresh of the commands when the shell layout changes.
 */
const notifyCommands: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlite/application-extension:notify-commands',
  autoStart: true,
  optional: [ILabShell],
  activate: (app: JupyterFrontEnd, labShell: ILabShell | null) => {
    if (labShell) {
      labShell.layoutModified.connect(() => {
        app.commands.notifyCommandChanged();
      });
    }
  },
};

/**
 * A custom opener plugin to pass the path to documents as
 * query string parameters.
 */
const opener: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlite/application-extension:opener',
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
        const { request, search } = parsed;
        const matches = request.match(URL_PATTERN) ?? [];
        if (!matches) {
          return;
        }

        const urlParams = new URLSearchParams(search);
        const paths = urlParams.getAll('path');
        if (!paths) {
          return;
        }
        const files = paths.map((path) => decodeURIComponent(path));
        app.restored.then(() => {
          const page = PageConfig.getOption('retroPage');
          const [file] = files;
          switch (page) {
            case 'consoles': {
              commands.execute('console:create', { path: file });
              return;
            }
            case 'notebooks': {
              docManager.open(file, NOTEBOOK_FACTORY, undefined, {
                ref: '_noref',
              });
              return;
            }
            case 'edit': {
              docManager.open(file, EDITOR_FACTORY, undefined, {
                ref: '_noref',
              });
              return;
            }
            default: {
              // open all files in the lab interface
              files.forEach((file) => docManager.open(file));
              const url = new URL(URLExt.join(PageConfig.getBaseUrl(), request));
              // only remove the path (to keep extra parameters like the RTC room)
              url.searchParams.delete('path');
              const { pathname, search } = url;
              router.navigate(`${pathname}${search}`, { skipRouting: true });
              break;
            }
          }
        });
      },
    });

    router.register({ command, pattern: URL_PATTERN });
  },
};

/**
 * A custom plugin to share a link to a file.
 *
 * This url can be used to open a particular file in JupyterLab.
 * It also adds the corresponding room if RTC is enabled.
 *
 */
const shareFile: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlite/application-extension:share-file',
  requires: [IFileBrowserFactory, ITranslator],
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    factory: IFileBrowserFactory,
    translator: ITranslator
  ): void => {
    const trans = translator.load('jupyterlab');
    const { commands } = app;
    const { tracker } = factory;

    const roomName = getParam('--room', '').trim();
    const collaborative = PageConfig.getOption('collaborative') === 'true' && roomName;

    commands.addCommand(CommandIDs.copyShareableLink, {
      execute: () => {
        const widget = tracker.currentWidget;
        if (!widget) {
          return;
        }

        const url = new URL(URLExt.join(PageConfig.getBaseUrl(), 'lab'));
        const models = toArray(
          filter(widget.selectedItems(), (item) => item.type !== 'directory')
        );
        models.forEach((model) => {
          url.searchParams.append('path', model.path);
        });
        if (collaborative) {
          url.searchParams.append('room', roomName);
        }
        Clipboard.copyToSystem(url.href);
      },
      isVisible: () =>
        !!tracker.currentWidget &&
        toArray(tracker.currentWidget.selectedItems()).length >= 1,
      icon: linkIcon.bindprops({ stylesheet: 'menuItem' }),
      label: trans.__('Copy Shareable Link'),
    });
  },
};

const plugins: JupyterFrontEndPlugin<any>[] = [
  about,
  docProviderPlugin,
  downloadPlugin,
  liteLogo,
  notifyCommands,
  opener,
  shareFile,
];

export default plugins;
