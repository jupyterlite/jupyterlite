// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { PageConfig, URLExt } from '@jupyterlab/coreutils';

import type { JupyterFrontEndPlugin } from '@jupyterlab/application';
import { JupyterFrontEnd, JupyterLab, IRouter } from '@jupyterlab/application';

import {
  ILicensesClient,
  ICommandPalette,
  MainAreaWidget,
  WidgetTracker,
  IWindowResolver,
} from '@jupyterlab/apputils';

import type { PluginListModel } from '@jupyterlab/pluginmanager';
import { IPluginManager, Plugins } from '@jupyterlab/pluginmanager';

import {
  ITranslator,
  ITranslatorConnector,
  nullTranslator,
} from '@jupyterlab/translation';

import { extensionIcon } from '@jupyterlab/ui-components';

import { ILiteRouter } from '@jupyterlite/application';

import {
  LiteLicensesClient,
  LitePluginListModel,
  LiteTranslatorConnector,
  IWorkspaceRouter,
} from '@jupyterlite/apputils';

import { kernelStatusPlugin } from './kernelstatus';

import { urlResolverPlugin } from './urlresolver';

/**
 * The command IDs used by the apputils extension.
 */
namespace CommandIDs {
  /**
   * The command ID for opening the plugin manager.
   */
  export const openPluginManager = 'apputils:open-plugin-manager';
}

/**
 * The client for fetching licenses data.
 */
const licensesClient: JupyterFrontEndPlugin<ILicensesClient> = {
  id: '@jupyterlite/application-extension:licenses-client',
  autoStart: true,
  provides: ILicensesClient,
  activate: (app: JupyterFrontEnd): ILicensesClient => {
    return new LiteLicensesClient();
  },
};

/**
 * A plugin for managing the status of other plugins.
 */
export const pluginManagerPlugin: JupyterFrontEndPlugin<IPluginManager> = {
  id: '@jupyterlite/application-extension:plugin-manager',
  description: 'Plugin manager viewer',
  autoStart: true,
  optional: [JupyterLab.IInfo, ITranslator, ICommandPalette],
  provides: IPluginManager,
  activate: (
    app: JupyterFrontEnd,
    info: JupyterLab.IInfo | null,
    translator: ITranslator | null,
    palette: ICommandPalette | null,
  ): IPluginManager => {
    const availablePlugins = info?.availablePlugins ?? [];

    if (availablePlugins.length === 0) {
      return {
        open: async () => {
          // eslint-disable-next-line no-console
          console.info('The application does not contain information about plugins');
        },
      };
    }

    const { commands, serviceManager, shell } = app;

    translator = translator ?? nullTranslator;
    const trans = translator.load('jupyterlab');

    const category = trans.__('Plugin Manager');
    const widgetLabel = trans.__('Advanced Plugin Manager');

    const namespace = 'plugin-manager';
    const tracker = new WidgetTracker<MainAreaWidget<Plugins>>({
      namespace: namespace,
    });

    function createWidget(args?: PluginListModel.IConfigurableState) {
      const model = new LitePluginListModel({
        ...args,
        pluginData: {
          availablePlugins,
        },
        serverSettings: serviceManager.serverSettings,
        extraLockedPlugins: [pluginManagerPlugin.id],
        translator: translator ?? nullTranslator,
      });
      const content = new Plugins({
        model,
        translator: translator ?? nullTranslator,
      });
      content.title.label = widgetLabel;
      content.title.icon = extensionIcon;
      content.title.caption = trans.__('Plugin Manager');
      const main = new MainAreaWidget({ content, reveal: model.ready });
      return main;
    }

    commands.addCommand(CommandIDs.openPluginManager, {
      label: widgetLabel,
      execute: (args) => {
        const main = createWidget(args);
        shell.add(main, 'main', { type: 'Plugins' });

        // add to tracker so it can be restored, and update when choices change
        void tracker.add(main);
        main.content.model.trackerDataChanged.connect(() => {
          void tracker.save(main);
        });
        return main;
      },
    });

    if (palette) {
      palette.addItem({ command: CommandIDs.openPluginManager, category });
    }

    return {
      open: () => {
        return app.commands.execute(CommandIDs.openPluginManager);
      },
    };
  },
};

/**
 * The main translator connector plugin.
 */
const translatorConnector: JupyterFrontEndPlugin<ITranslatorConnector> = {
  id: '@jupyterlite/application-extension:translator-connector',
  description: 'Provides the application translation connector.',
  autoStart: true,
  provides: ITranslatorConnector,
  activate: (app: JupyterFrontEnd) => {
    return new LiteTranslatorConnector();
  },
};

/**
 * The default window name resolver provider.
 *
 * This adds a dependency on `IWorkspaceRouter`
 */
const resolver: JupyterFrontEndPlugin<IWindowResolver> = {
  id: '@jupyterlite/application-extension:resolver',
  autoStart: true,
  provides: IWindowResolver,
  requires: [JupyterFrontEnd.IPaths, IRouter, IWorkspaceRouter],
  activate: async (
    app: JupyterFrontEnd,
    paths: JupyterFrontEnd.IPaths,
    router: IRouter,
    workspaceRouter: IWorkspaceRouter,
  ) => {
    const url = new URL(window.location.href);
    const workspace =
      url.searchParams.get('workspace') ||
      url.searchParams.get('clone') ||
      PageConfig.getOption('workspace') ||
      'default';
    const candidate = workspace ? workspace : PageConfig.defaultWorkspace;

    const solver: IWindowResolver = {
      name: candidate,
    };

    try {
      return solver;
    } catch (error) {
      const { workspaces } = app.serviceManager;
      const oldWorkspace = await workspaces.fetch(workspace);
      const newWorkspaceId = `${workspace.split('-')[0]}-${+new Date()}`;
      await workspaces.save(newWorkspaceId, oldWorkspace);
      const appUrl = PageConfig.getOption('appUrl');
      url.pathname = appUrl;
      url.searchParams.set('clone', newWorkspaceId);
      url.searchParams.delete('workspace');
      const newUrl = URLExt.join(appUrl, url.toString().split(appUrl)[1]);
      router.navigate(newUrl);
      return solver;
    }
  },
};

/**
 * A custom plugin for workspace files and commands
 */
const workspaces: JupyterFrontEndPlugin<IWorkspaceRouter> = {
  id: '@jupyterlite/application-extension:workspaces',
  requires: [ILiteRouter],
  autoStart: true,
  provides: IWorkspaceRouter,
  activate: (app: JupyterFrontEnd, liteRouter: ILiteRouter): IWorkspaceRouter => {
    const appUrl = PageConfig.getOption('appUrl');
    const baseUrl = PageConfig.getOption('baseUrl');
    if (appUrl) {
      const workspaceUrl = URLExt.join(appUrl, 'workspaces') + '/';
      const autoUrl = URLExt.join(baseUrl, 'doc/workspaces/auto-');
      liteRouter.addTransformer({
        id: workspaces.id,
        transform: ({ options, url }) => {
          if (options.hard && url.pathname.startsWith(workspaceUrl)) {
            const workspace = url.pathname.replace(workspaceUrl, '');
            url.pathname = appUrl;
            url.searchParams.set('workspace', workspace);
          }
          if (options.hard && url.pathname.startsWith(autoUrl)) {
            url.pathname = appUrl;
            url.searchParams.delete('reset');
          }
          return { url, options };
        },
      });
    }

    return {};
  },
};

const plugins: JupyterFrontEndPlugin<any>[] = [
  licensesClient,
  pluginManagerPlugin,
  translatorConnector,
  workspaces,
  kernelStatusPlugin,
  resolver,
  urlResolverPlugin,
];

export default plugins;
