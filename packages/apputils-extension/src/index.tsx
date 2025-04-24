// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  JupyterLab,
} from '@jupyterlab/application';

import {
  ILicensesClient,
  ICommandPalette,
  MainAreaWidget,
  WidgetTracker,
} from '@jupyterlab/apputils';

import { IPluginManager, PluginListModel, Plugins } from '@jupyterlab/pluginmanager';

import {
  ITranslator,
  ITranslatorConnector,
  nullTranslator,
} from '@jupyterlab/translation';

import { extensionIcon } from '@jupyterlab/ui-components';

import {
  LiteLicensesClient,
  LitePluginListModel,
  LiteTranslatorConnector,
} from '@jupyterlite/apputils';

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
  optional: [ITranslator, ICommandPalette],
  provides: IPluginManager,
  activate: (
    app: JupyterFrontEnd,
    translator: ITranslator | null,
    palette: ICommandPalette | null,
  ): IPluginManager => {
    if (!(app instanceof JupyterLab)) {
      // only activate in JupyterLab
      // TODO: require JupyterLab.IInfo instead when the upstream PR is merged and released?
      // https://github.com/jupyterlab/jupyterlab/pull/17367
      return {
        open: async () => {
          // eslint-disable-next-line no-console
          console.info('Plugin manager viewer is only available in JupyterLab');
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

    const availablePlugins = app.info.availablePlugins;

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

const plugins: JupyterFrontEndPlugin<any>[] = [
  licensesClient,
  pluginManagerPlugin,
  translatorConnector,
];

export default plugins;
