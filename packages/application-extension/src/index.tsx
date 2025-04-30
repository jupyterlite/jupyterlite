// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  ILabShell,
  IRouter,
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';

import {
  Clipboard,
  Dialog,
  ICommandPalette,
  SessionContext,
  showDialog,
} from '@jupyterlab/apputils';

import { PageConfig, URLExt } from '@jupyterlab/coreutils';

import { IDocumentManager, IDocumentWidgetOpener } from '@jupyterlab/docmanager';

import { IFileBrowserFactory } from '@jupyterlab/filebrowser';

import {
  DocumentConnectionManager,
  ILSPDocumentConnectionManager,
  IWidgetLSPAdapterTracker,
  LanguageServerManager,
} from '@jupyterlab/lsp';

import { IMainMenu } from '@jupyterlab/mainmenu';
import {
  Contents,
  IDefaultDrive,
  ISettingManager,
  Setting,
} from '@jupyterlab/services';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { ITranslator } from '@jupyterlab/translation';

import { downloadIcon, linkIcon } from '@jupyterlab/ui-components';

import { IServiceWorkerManager, ServiceWorkerManager } from '@jupyterlite/server';

import { liteIcon, liteWordmark } from '@jupyterlite/ui-components';

import { BrowserStorageDrive } from '@jupyterlite/contents';

import { Settings } from '@jupyterlite/settings';

import { filter } from '@lumino/algorithm';

import { Widget } from '@lumino/widgets';

import React from 'react';

import { ClearDataDialog, IClearOptions } from './clear-data-dialog';

/**
 * A regular expression to match path to notebooks, documents and consoles
 */
const URL_PATTERN = new RegExp('/(lab|tree|notebooks|edit|consoles)\\/?');

/**
 * The JupyterLab document manager plugin id.
 */
const JUPYTERLAB_DOCMANAGER_PLUGIN_ID = '@jupyterlab/docmanager-extension:plugin';

/**
 * The command IDs used by the application extension.
 */
namespace CommandIDs {
  export const about = 'application:about';

  export const docmanagerDownload = 'docmanager:download';

  export const filebrowserDownload = 'filebrowser:download';

  export const copyShareableLink = 'filebrowser:share-main';

  export const clearBrowserData = 'application:clear-browser-data';
}

/**
 * The name of the translation bundle for internationalized strings.
 */

const I18N_BUNDLE = 'jupyterlite';

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
    menu: IMainMenu | null,
  ): void => {
    const { commands } = app;
    const trans = translator.load(I18N_BUNDLE);
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
            {trans.__('© 2021-2022 JupyterLite Contributors')}
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
    factory: IFileBrowserFactory | null,
  ) => {
    const trans = translator.load(I18N_BUNDLE);
    const { commands, serviceManager, shell } = app;
    const { contents } = serviceManager;

    const isEnabled = () => {
      const { currentWidget } = shell;
      return !!(currentWidget && docManager.contextForWidget(currentWidget));
    };

    const downloadContent = async (contentPath: string, fileName: string) => {
      const model = await contents.get(contentPath, { content: true });
      const element = document.createElement('a');
      if (
        model.type === 'notebook' ||
        model.format === 'json' ||
        model.mimetype === 'text/json'
      ) {
        const mime = model.mimetype ?? 'text/json';
        const content = JSON.stringify(model.content, null, 2);
        element.href = `data:${mime};charset=utf-8,${encodeURIComponent(content)}`;
      } else if (model.format === 'text' || model.mimetype === 'text/plain') {
        const mime = model.mimetype ?? 'text/plain';
        element.href = `data:${mime};charset=utf-8,${encodeURIComponent(
          model.content,
        )}`;
      } else if (
        model.format === 'base64' ||
        model.mimetype === 'application/octet-stream'
      ) {
        const mime = model.mimetype ?? 'application/octet-stream';
        element.href = `data:${mime};base64,${model.content}`;
      } else {
        throw new Error(
          `Content whose mimetype is "${model.mimetype}" cannot be downloaded`,
        );
      }
      element.download = fileName;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
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
        await context.save();
        try {
          await downloadContent(context.path, context.path);
        } catch (e) {
          return showDialog({
            title: trans.__('Cannot Download'),
            body: JSON.stringify(e),
            buttons: [Dialog.okButton({ label: trans.__('OK') })],
          });
        }
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
          const selected = Array.from(widget.selectedItems());
          selected.forEach(async (item) => {
            if (item.type !== 'directory') {
              try {
                await downloadContent(item.path, item.name);
              } catch (e) {
                return showDialog({
                  title: trans.__('Cannot Download'),
                  body: JSON.stringify(e),
                  buttons: [Dialog.okButton({ label: trans.__('OK') })],
                });
              }
            }
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
  // marking as optional to not throw errors in Notebook
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
 * A plugin to provide the language server connection manager
 *
 * Currently does nothing until LSP is supported in JupyterLite
 */
const lspConnectionManager: JupyterFrontEndPlugin<ILSPDocumentConnectionManager> = {
  id: '@jupyterlite/application-extension:lsp-connection-manager',
  autoStart: true,
  requires: [IWidgetLSPAdapterTracker],
  provides: ILSPDocumentConnectionManager,
  activate: (app: JupyterFrontEnd, tracker: IWidgetLSPAdapterTracker) => {
    const languageServerManager = new (class extends LanguageServerManager {
      async fetchSessions(): Promise<void> {
        // no-op
      }
    })({
      settings: app.serviceManager.serverSettings,
    });

    const connectionManager = new DocumentConnectionManager({
      languageServerManager,
      adapterTracker: tracker,
    });

    return connectionManager;
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
  optional: [ILabShell, ISettingRegistry],
  activate: (
    app: JupyterFrontEnd,
    router: IRouter,
    docManager: IDocumentManager,
    labShell: ILabShell | null,
    settingRegistry: ISettingRegistry | null,
  ): void => {
    const { commands, docRegistry } = app;

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
        if (paths.length === 0) {
          return;
        }
        const files = paths.map((path) => decodeURIComponent(path));
        app.started.then(async () => {
          const page = PageConfig.getOption('notebookPage');
          const [file] = files;
          if (page === 'tree') {
            let appUrl = '/edit';
            // check if the file is a notebook
            const defaultFactory = docRegistry.defaultWidgetFactory(file);
            if (defaultFactory.name === 'Notebook') {
              appUrl = '/notebooks';
            }
            const baseUrl = PageConfig.getBaseUrl();
            const url = new URL(URLExt.join(baseUrl, appUrl, 'index.html'));
            url.searchParams.append('path', file);

            // redirect to the proper page
            window.location.href = url.toString();
            return;
          } else if (page === 'consoles') {
            commands.execute('console:create', { path: file });
            return;
          } else if (page === 'notebooks' || page === 'edit') {
            let defaultFactory = docRegistry.defaultWidgetFactory(file).name;

            // Explicitly get the default viewers from the settings because
            // JupyterLab might not have had the time to load the settings yet (race condition)
            // Relevant code: https://github.com/jupyterlab/jupyterlab/blob/d56ff811f39b3c10c6d8b6eb27a94624b753eb53/packages/docmanager-extension/src/index.tsx#L265-L293
            if (settingRegistry) {
              const settings = await settingRegistry.load(
                JUPYTERLAB_DOCMANAGER_PLUGIN_ID,
              );
              const defaultViewers = settings.get('defaultViewers').composite as {
                [ft: string]: string;
              };
              // get the file types for the path
              const types = docRegistry.getFileTypesForPath(file);
              // for each file type, check if there is a default viewer and if it
              // is available in the docRegistry. If it is the case, use it as the
              // default factory
              types.forEach((ft) => {
                if (
                  defaultViewers[ft.name] !== undefined &&
                  docRegistry.getWidgetFactory(defaultViewers[ft.name])
                ) {
                  defaultFactory = defaultViewers[ft.name];
                }
              });
            }

            const factory = urlParams.get('factory') ?? defaultFactory;
            docManager.open(file, factory, undefined, {
              ref: '_noref',
            });
          } else {
            // open all files in the lab interface
            files.forEach((file) => docManager.open(file));
            const url = new URL(URLExt.join(PageConfig.getBaseUrl(), request));
            // only remove the path (to keep extra parameters like the RTC room)
            url.searchParams.delete('path');
            const { pathname, search } = url;
            router.navigate(`${pathname}${search}`, { skipRouting: true });

            if (labShell) {
              // open the folder where the files are located on startup
              const showInBrowser = () => {
                commands.execute('docmanager:show-in-file-browser');
                labShell.currentChanged.disconnect(showInBrowser);
              };

              labShell.currentChanged.connect(showInBrowser);
            }
          }
        });
      },
    });

    router.register({ command, pattern: URL_PATTERN });
  },
};

/**
 * A plugin installing the service worker.
 */
const serviceWorkerManagerPlugin: JupyterFrontEndPlugin<IServiceWorkerManager> = {
  id: '@jupyterlite/application-extension:service-worker-manager',
  autoStart: true,
  provides: IServiceWorkerManager,
  activate: (app: JupyterFrontEnd) => {
    const { contents } = app.serviceManager;
    return new ServiceWorkerManager({ contents });
  },
};

/**
 * A plugin to patch the session context path so it includes the drive name.
 * TODO: investigate a better way for the kernel to be aware of the drive it is
 * associated with.
 */
const sessionContextPatch: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlite/application-extension:session-context-patch',
  autoStart: true,
  requires: [IDocumentManager, IDocumentWidgetOpener],
  activate: (
    app: JupyterFrontEnd,
    docManager: IDocumentManager,
    widgetOpener: IDocumentWidgetOpener,
  ) => {
    const contents = app.serviceManager.contents;

    widgetOpener.opened.connect((_, widget) => {
      const context = docManager.contextForWidget(widget);
      const driveName = contents.driveName(context?.path ?? '');
      if (driveName === '') {
        // do nothing if this is the default drive
        return;
      }
      const sessionContext = widget.context.sessionContext as SessionContext;
      // Path the session context to include the drive name
      // In JupyterLab 3 the path used to contain the drive name as prefix, which was
      // also part of the /api/sessions requests. Which allowed for knowing the drive associated
      // with a kernel.
      // This was changed in JupyterLab 4 in https://github.com/jupyterlab/jupyterlab/pull/14519
      // and is needed for the kernel to be aware of the drive it is associated with.
      // This is a temporary fix until a better solution is found upstream in JupyterLab ideally.
      // This also avoid having to patch the downstream kernels (e.g. xeus-python and pyodide)
      sessionContext['_name'] = context?.path;
      sessionContext['_path'] = context?.path;
    });
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
    translator: ITranslator,
  ): void => {
    const trans = translator.load(I18N_BUNDLE);
    const { commands, docRegistry } = app;
    const { tracker } = factory;

    commands.addCommand(CommandIDs.copyShareableLink, {
      execute: () => {
        const widget = tracker.currentWidget;
        if (!widget) {
          return;
        }

        const baseUrl = PageConfig.getBaseUrl();
        let appUrl = PageConfig.getOption('appUrl');

        const models = Array.from(
          filter(widget.selectedItems(), (item) => item.type !== 'directory'),
        );

        if (!models.length) {
          return;
        }

        // In the notebook application:
        // - only copy the first element
        // - open /notebooks if it's a notebook, /edit otherwise
        if (appUrl === '/tree') {
          const [model] = models;
          const defaultFactory = docRegistry.defaultWidgetFactory(model.path);
          if (defaultFactory.name === 'Notebook') {
            appUrl = '/notebooks';
          } else {
            appUrl = '/edit';
          }
        }

        const url = new URL(URLExt.join(baseUrl, appUrl, 'index.html'));
        models.forEach((model) => {
          url.searchParams.append('path', model.path);
        });
        Clipboard.copyToSystem(url.href);
      },
      isVisible: () =>
        !!tracker.currentWidget &&
        Array.from(tracker.currentWidget.selectedItems()).length >= 1,
      icon: linkIcon.bindprops({ stylesheet: 'menuItem' }),
      label: trans.__('Copy Shareable Link'),
    });
  },
};

/**
 * A plugin to add a command for clearing browser data.
 */
const clearBrowserData: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlite/application-extension:clear-browser-data',
  autoStart: true,
  requires: [ITranslator],
  optional: [ICommandPalette, ISettingManager, IDefaultDrive],
  activate: (
    app: JupyterFrontEnd,
    translator: ITranslator,
    palette: ICommandPalette | null,
    settingManager: Setting.IManager | null,
    defaultDrive: Contents.IDrive | null,
  ): void => {
    const { commands } = app;
    const trans = translator.load(I18N_BUNDLE);
    const category = trans.__('Help');

    const isBrowserStorageDrive = defaultDrive instanceof BrowserStorageDrive;
    const isLiteSettingsManager = settingManager instanceof Settings;

    if (!isBrowserStorageDrive && !isLiteSettingsManager) {
      // not available if neither the default drive or the settings manager
      // are the ones provided by JupyterLite by default
      return;
    }

    const clearData = async (options: IClearOptions): Promise<void> => {
      const { clearSettings, clearContents } = options;
      const promises: Promise<void>[] = [];

      if (clearContents && isBrowserStorageDrive) {
        const browserStorageDrive = defaultDrive as BrowserStorageDrive;
        promises.push(browserStorageDrive.clearStorage());
      }

      if (clearSettings && isLiteSettingsManager) {
        const settings = settingManager as Settings;
        promises.push(settings.clear());
      }

      await Promise.all(promises);

      window.location.reload();
    };

    commands.addCommand(CommandIDs.clearBrowserData, {
      label: trans.__('Clear Browser Data'),
      execute: async () => {
        // Pass the availability information to the dialog
        const availability = {
          canClearSettings: isLiteSettingsManager && !!settingManager,
          canClearContents: isBrowserStorageDrive && !!defaultDrive,
        };

        const body = new ClearDataDialog(translator, availability);

        const result = await showDialog({
          title: trans.__('Clear Browser Data'),
          body,
          buttons: [
            Dialog.cancelButton({ label: trans.__('Cancel') }),
            Dialog.warnButton({ label: trans.__('Clear') }),
          ],
        });
        if (result.button.accept) {
          return clearData(body.getValue());
        }
        return await Promise.resolve();
      },
    });

    if (palette) {
      palette.addItem({ command: CommandIDs.clearBrowserData, category });
    }
  },
};

const plugins: JupyterFrontEndPlugin<any>[] = [
  about,
  clearBrowserData,
  downloadPlugin,
  liteLogo,
  lspConnectionManager,
  notifyCommands,
  opener,
  serviceWorkerManagerPlugin,
  sessionContextPatch,
  shareFile,
];

export default plugins;
