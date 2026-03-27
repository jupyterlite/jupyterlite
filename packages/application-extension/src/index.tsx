// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import type { JupyterFrontEndPlugin } from '@jupyterlab/application';
import { ILabShell, IRouter, JupyterFrontEnd } from '@jupyterlab/application';

import type { SessionContext } from '@jupyterlab/apputils';
import { Clipboard, Dialog, ICommandPalette, showDialog } from '@jupyterlab/apputils';

import { PageConfig, URLExt } from '@jupyterlab/coreutils';

import { IDocumentManager, IDocumentWidgetOpener } from '@jupyterlab/docmanager';

import {
  DirListing,
  IDefaultFileBrowser,
  IFileBrowserFactory,
  IDefaultFileBrowserRenderer,
} from '@jupyterlab/filebrowser';

import {
  DocumentConnectionManager,
  ILSPDocumentConnectionManager,
  IWidgetLSPAdapterTracker,
  LanguageServerManager,
} from '@jupyterlab/lsp';

import { IMainMenu } from '@jupyterlab/mainmenu';
import type { Contents, Setting, Workspace } from '@jupyterlab/services';
import {
  IDefaultDrive,
  ISettingManager,
  IWorkspaceManager,
} from '@jupyterlab/services';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

import type { TranslationBundle } from '@jupyterlab/translation';
import { ITranslator } from '@jupyterlab/translation';

import type { LabIcon } from '@jupyterlab/ui-components';
import {
  clearIcon,
  downloadIcon,
  editIcon,
  linkIcon,
  offlineBoltIcon,
} from '@jupyterlab/ui-components';

import { ILiteRouter, LiteRouter } from '@jupyterlite/application';

import {
  IServiceWorkerManager,
  LiteWorkspaceManager,
  ServiceWorkerManager,
} from '@jupyterlite/apputils';

import {
  BrowserStorageDrive,
  CONTENT_LAYER,
  IKernelClient,
  Settings,
} from '@jupyterlite/services';

import { cloudIcon, liteIcon, liteWordmark } from '@jupyterlite/ui-components';

// Import deprecated packages for backward compatibility with federated extensions
import '@jupyterlite/contents';
import '@jupyterlite/kernel';
import '@jupyterlite/server';

import { filter } from '@lumino/algorithm';

import type { CommandRegistry } from '@lumino/commands';

import type { ReadonlyPartialJSONObject } from '@lumino/coreutils';

import type { DockPanel } from '@lumino/widgets';
import { Widget } from '@lumino/widgets';

import React from 'react';

import { ClearDataDialog } from './clear-data-dialog';

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

  export const revertToServer = 'application:revert-to-server';
}

/**
 * The name of the translation bundle for internationalized strings.
 */

const I18N_BUNDLE = 'jupyterlite';
const DRIVE_LAYER_BADGE_CLASS = 'jp-DriveLayerBadge';
const DRIVE_LAYER_BADGE_RENDERER_PLUGIN_ID =
  '@jupyterlite/application-extension:drive-layer-badge-renderer';
const DRIVE_LAYER_BADGES_PLUGIN_ID =
  '@jupyterlite/application-extension:drive-layer-badges';

class DriveLayerBadgeRenderer extends DirListing.Renderer {
  constructor(
    private readonly trans: TranslationBundle,
    private readonly commands: CommandRegistry,
  ) {
    super();
  }

  override updateItemNode(
    ...args: Parameters<DirListing.Renderer['updateItemNode']>
  ): void {
    const [node, model] = args;
    super.updateItemNode(...args);

    const layer = (model as BrowserStorageDrive.ILayeredModel)[CONTENT_LAYER];
    const existingBadge = node.querySelector<HTMLElement>(
      `.${DRIVE_LAYER_BADGE_CLASS}`,
    );
    const description = this._getBadgeDescription(layer);

    if (!description) {
      existingBadge?.remove();
      return;
    }

    const badge = existingBadge ?? document.createElement('span');
    const tooltip = this.trans.__('%1: %2', description.label, description.title);
    badge.className = `${DRIVE_LAYER_BADGE_CLASS} ${description.className}`;
    badge.title = tooltip;
    badge.setAttribute('aria-label', tooltip);
    badge.setAttribute('role', 'img');

    // Render icon if it changed
    const currentIcon = badge.dataset.icon;
    if (currentIcon !== description.icon.name) {
      badge.replaceChildren();
      description.icon.element({
        container: badge,
        tag: 'span',
        height: '14px',
        width: '14px',
      });
      badge.dataset.icon = description.icon.name;
    }

    // Make override badges clickable to revert to the server version
    if (layer === 'writable-override') {
      badge.dataset.path = model.path;
      if (!badge.dataset.hasClickHandler) {
        badge.addEventListener('click', (event: Event) => {
          event.stopPropagation();
          event.preventDefault();
          const target = event.currentTarget as HTMLElement;
          void this.commands.execute(CommandIDs.revertToServer, {
            path: target.dataset.path,
          });
        });
        badge.dataset.hasClickHandler = 'true';
      }
    }

    if (!existingBadge) {
      const iconNode = node.querySelector<HTMLElement>('.jp-DirListing-itemIcon');
      if (iconNode?.parentElement) {
        iconNode.insertAdjacentElement('afterend', badge);
      } else {
        node.querySelector<HTMLElement>('.jp-DirListing-itemName')?.prepend(badge);
      }
    }
  }

  private _getBadgeDescription(
    layer: BrowserStorageDrive.TContentLayer | undefined,
  ): { className: string; label: string; title: string; icon: LabIcon } | null {
    switch (layer) {
      case 'server':
        return {
          className: 'jp-mod-server',
          label: this.trans.__('Server'),
          title: this.trans.__('Read from site assets'),
          icon: cloudIcon,
        };
      case 'writable':
        return {
          className: 'jp-mod-writable',
          label: this.trans.__('Writable'),
          title: this.trans.__('Saved in browser storage'),
          icon: editIcon,
        };
      case 'writable-override':
        return {
          className: 'jp-mod-override',
          label: this.trans.__('Override'),
          title: this.trans.__(
            'Writable copy overrides a server file (click to revert)',
          ),
          icon: offlineBoltIcon,
        };
      default:
        return null;
    }
  }
}

/**
 * The custom URL router provider.
 *
 * Provides IRouter, plus the additional methods to transform `/path/`-based routes
 */
const liteRouter: JupyterFrontEndPlugin<ILiteRouter> = {
  id: '@jupyterlite/application-extension:lite-router',
  autoStart: true,
  provides: ILiteRouter,
  requires: [JupyterFrontEnd.IPaths],
  activate: (app: JupyterFrontEnd, paths: JupyterFrontEnd.IPaths) => {
    const { commands } = app;
    const { base } = paths.urls;
    const router = new LiteRouter({ base, commands });

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

/**
 * The default URL router provider.
 */
const router: JupyterFrontEndPlugin<IRouter> = {
  id: '@jupyterlite/application-extension:router',
  autoStart: true,
  provides: IRouter,
  requires: [ILiteRouter],
  activate: (app: JupyterFrontEnd, router: ILiteRouter) => {
    return router;
  },
};

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
            {trans.__('© 2021-, JupyterLite Contributors')}
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
        icon: (args) =>
          args['isMenu']
            ? undefined
            : downloadIcon.bindprops({ stylesheet: 'menuItem' }),
        label: trans.__('Download'),
      });
    }
  },
};

/**
 * A plugin to provide a custom file browser renderer for drive layer badges.
 */
const driveLayerBadgeRenderer: JupyterFrontEndPlugin<IDefaultFileBrowserRenderer> = {
  id: DRIVE_LAYER_BADGE_RENDERER_PLUGIN_ID,
  autoStart: true,
  provides: IDefaultFileBrowserRenderer,
  requires: [ITranslator],
  activate: (
    app: JupyterFrontEnd,
    translator: ITranslator,
  ): IDefaultFileBrowserRenderer => {
    const trans = translator.load(I18N_BUNDLE);
    return new DriveLayerBadgeRenderer(trans, app.commands);
  },
};

/**
 * A plugin to annotate file browser items with server/writable layer badges.
 */
const driveLayerBadges: JupyterFrontEndPlugin<void> = {
  id: DRIVE_LAYER_BADGES_PLUGIN_ID,
  autoStart: true,
  requires: [IFileBrowserFactory],
  optional: [ISettingRegistry],
  activate: (
    _: JupyterFrontEnd,
    factory: IFileBrowserFactory,
    settingRegistry: ISettingRegistry | null,
  ): void => {
    let showBadges = true;
    const { tracker } = factory;

    const updateBadgeVisibility = () => {
      tracker.forEach((browser) => {
        browser.toggleClass('jp-DriveLayerBadges', showBadges);
      });
    };

    const initBrowser = (
      browser: ReturnType<IFileBrowserFactory['createFileBrowser']>,
    ) => {
      browser.toggleClass('jp-DriveLayerBadges', showBadges);
      void browser.model.refresh();
    };

    tracker.forEach(initBrowser);
    tracker.widgetAdded.connect((_, browser) => {
      initBrowser(browser);
    });

    if (settingRegistry) {
      void settingRegistry
        .load(DRIVE_LAYER_BADGES_PLUGIN_ID)
        .then((settings) => {
          const updateSetting = () => {
            showBadges = (settings.get('showBadges').composite ?? true) as boolean;
            updateBadgeVisibility();
          };
          updateSetting();
          settings.changed.connect(updateSetting);
        })
        .catch((reason) => {
          console.warn(
            `Failed to load ${DRIVE_LAYER_BADGES_PLUGIN_ID} settings`,
            reason,
          );
        });
    }
  },
};

/**
 * A plugin to add a "Revert to Server Version" command for override files.
 *
 * This adds an entry to the File menu that is only enabled when the current
 * document is a writable override of a server file. Using it removes the local
 * copy and reverts to the original version bundled with the deployment.
 */
const revertToServer: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlite/application-extension:revert-to-server',
  autoStart: true,
  requires: [IDocumentManager, ITranslator],
  optional: [IMainMenu, ILabShell],
  activate: (
    app: JupyterFrontEnd,
    docManager: IDocumentManager,
    translator: ITranslator,
    menu: IMainMenu | null,
    labShell: ILabShell | null,
  ): void => {
    const { commands, shell, serviceManager } = app;
    const { contents } = serviceManager;
    const trans = translator.load(I18N_BUNDLE);

    const getOverridePath = async (): Promise<string | null> => {
      const current = shell.currentWidget;
      if (!current) {
        return null;
      }
      const context = docManager.contextForWidget(current);
      if (!context) {
        return null;
      }
      try {
        const model = await contents.get(context.path);
        const layer = (model as BrowserStorageDrive.ILayeredModel)[CONTENT_LAYER];
        if (layer === 'writable-override') {
          return context.path;
        }
      } catch {
        // file may not exist or drive may not support layers
      }
      return null;
    };

    commands.addCommand(CommandIDs.revertToServer, {
      label: trans.__('Revert to Server Version'),
      isEnabled: () => {
        const current = shell.currentWidget;
        return !!(current && docManager.contextForWidget(current));
      },
      execute: async (args: ReadonlyPartialJSONObject) => {
        // Accept a path argument (from badge click) or infer from the current widget
        const path = (args.path as string) ?? (await getOverridePath());
        if (!path) {
          return;
        }
        const name = path.split('/').pop() ?? path;
        const result = await showDialog({
          title: trans.__('Revert to Server Version'),
          body: trans.__(
            'This will remove your local changes to "%1" and revert to the original version bundled with the deployment.',
            name,
          ),
          buttons: [
            Dialog.cancelButton({ label: trans.__('Cancel') }),
            Dialog.warnButton({ label: trans.__('Revert') }),
          ],
        });
        if (result.button.accept) {
          await docManager.deleteFile(path);
        }
      },
    });

    if (menu) {
      menu.fileMenu.addGroup(
        [{ command: CommandIDs.revertToServer }],
        40, // after the standard "Revert Notebook to Checkpoint" group
      );
    }

    // Re-evaluate command state when the active widget changes
    if (labShell) {
      labShell.currentChanged.connect(() => {
        commands.notifyCommandChanged(CommandIDs.revertToServer);
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
            docManager.openOrReveal(file, factory, undefined, {
              ref: '_noref',
            });
          } else {
            // open all files in the lab interface
            files.forEach((file) => docManager.openOrReveal(file));
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
  optional: [IKernelClient],
  activate: (app: JupyterFrontEnd, kernelClient?: IKernelClient) => {
    const { contents } = app.serviceManager;
    const serviceWorkerManager = new ServiceWorkerManager({ contents });
    if (kernelClient !== undefined) {
      serviceWorkerManager.registerStdinHandler(
        'kernel',
        kernelClient.handleStdin.bind(kernelClient),
      );
    }
    return serviceWorkerManager;
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
  optional: [
    ICommandPalette,
    ISettingManager,
    IDefaultDrive,
    IDefaultFileBrowser,
    IWorkspaceManager,
  ],
  activate: (
    app: JupyterFrontEnd,
    translator: ITranslator,
    palette: ICommandPalette | null,
    settingManager: Setting.IManager | null,
    defaultDrive: Contents.IDrive | null,
    defaultFileBrowser: IDefaultFileBrowser | null,
    workspaceManager: Workspace.IManager | null,
  ): void => {
    const { commands } = app;
    const trans = translator.load(I18N_BUNDLE);
    const category = trans.__('Help');

    const isBrowserStorageDrive = defaultDrive instanceof BrowserStorageDrive;
    const isLiteSettingsManager = settingManager instanceof Settings;
    const isLiteWorkspaceManager = workspaceManager instanceof LiteWorkspaceManager;

    if (!isBrowserStorageDrive && !isLiteSettingsManager && !isLiteWorkspaceManager) {
      // not available if none of the default managers
      // are the ones provided by JupyterLite by default
      return;
    }

    // Add a CSS class to the drive if it is a BrowserStorageDrive for the context menu entry
    if (isBrowserStorageDrive && defaultFileBrowser) {
      defaultFileBrowser.addClass('jp-BrowserStorageDrive');
    }

    const clearData = async (options: ClearDataDialog.IClearOptions): Promise<void> => {
      const { clearSettings, clearContents, clearWorkspaces } = options;
      const promises: Promise<void>[] = [];

      if (clearContents && isBrowserStorageDrive) {
        const browserStorageDrive = defaultDrive as BrowserStorageDrive;
        promises.push(browserStorageDrive.clearStorage());
      }

      if (clearSettings && isLiteSettingsManager) {
        const settings = settingManager as Settings;
        promises.push(settings.clear());
      }

      if (clearWorkspaces && isLiteWorkspaceManager) {
        const workspace = workspaceManager as any;
        promises.push(workspace.clear());
      }

      await Promise.all(promises);

      window.location.reload();
    };

    commands.addCommand(CommandIDs.clearBrowserData, {
      label: trans.__('Clear Browser Data'),
      icon: (args) => (args['isPalette'] ? undefined : clearIcon),
      execute: async () => {
        // Pass the availability information to the dialog
        const availability = {
          canClearSettings: isLiteSettingsManager && !!settingManager,
          canClearContents: isBrowserStorageDrive && !!defaultDrive,
          canClearWorkspaces: isLiteWorkspaceManager && !!workspaceManager,
        };

        const body = new ClearDataDialog({
          translator,
          availability,
        });

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

/**
 * A plugin to configure the application mode (single-document vs multiple-document)
 */
const modeSupport: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlite/application-extension:mode-support',
  autoStart: true,
  optional: [ILabShell, IRouter],
  activate: (
    app: JupyterFrontEnd,
    labShell: ILabShell | null,
    router: IRouter | null,
  ) => {
    // only effective in JupyterLab
    if (!labShell) {
      return;
    }

    // Query string parameter has higher priority
    const url = new URL(window.location.href);
    const urlMode = url.searchParams.get('mode');
    const mode = urlMode || PageConfig.getOption('mode') || 'multiple-document';

    // Wait for the app to be restored before setting the mode
    // so the switch button has time to set the signal
    app.restored.then(() => {
      // Only set the mode if it's valid
      if (mode === 'single-document' || mode === 'multiple-document') {
        labShell.mode = mode;

        // Update PageConfig to match the effective mode
        PageConfig.setOption('mode', mode);
      }
    });

    // Watch the mode and update the URL to reflect the change
    labShell.modeChanged.connect((_, newMode: DockPanel.Mode) => {
      const currentUrl = new URL(window.location.href);
      const currentUrlMode = currentUrl.searchParams.get('mode');

      // Update the URL parameter if it differs from the new mode
      if (currentUrlMode !== newMode) {
        currentUrl.searchParams.set('mode', newMode as string);
        if (router) {
          const { pathname, search } = currentUrl;
          router.navigate(`${pathname}${search}`, { skipRouting: true });
        }
      }

      PageConfig.setOption('mode', newMode);
    });
  },
};

const plugins: JupyterFrontEndPlugin<any>[] = [
  about,
  clearBrowserData,
  driveLayerBadgeRenderer,
  driveLayerBadges,
  downloadPlugin,
  liteRouter,
  liteLogo,
  lspConnectionManager,
  modeSupport,
  notifyCommands,
  opener,
  revertToServer,
  router,
  serviceWorkerManagerPlugin,
  sessionContextPatch,
  shareFile,
];

export default plugins;
