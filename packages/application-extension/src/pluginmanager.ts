import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  JupyterLab,
} from '@jupyterlab/application';
import { ICommandPalette, MainAreaWidget, WidgetTracker } from '@jupyterlab/apputils';
import {
  IEntry,
  IPluginManager,
  PluginListModel,
  Plugins,
} from '@jupyterlab/pluginmanager';
import { ITranslator, nullTranslator } from '@jupyterlab/translation';
import { extensionIcon } from '@jupyterlab/ui-components';

/**
 * The command IDs used by the plugin manager plugin.
 */
namespace CommandIDs {
  export const open = 'plugin-manager:open';
}

/**
 * Custom PluginModel for use in JupyterLite
 */
export class LitePluginListModel extends PluginListModel {
  /**
   * Create a new PluginListModel.
   */
  constructor(options: PluginListModel.IOptions) {
    super(options);
    this._availablePlugins = options.pluginData.availablePlugins.map((plugin) => {
      let tokenLabel = plugin.provides ? plugin.provides.name.split(':')[1] : undefined;
      if (plugin.provides && !tokenLabel) {
        tokenLabel = plugin.provides.name;
      }
      return {
        ...plugin,
        tokenLabel,
        // keep all plugins locked and enabled for now until there is
        // a way to enable/disable plugins in JupyterLite
        locked: true,
        enabled: true,
      };
    });
  }

  get available(): ReadonlyArray<IEntry> {
    return this._availablePlugins;
  }

  async refresh(): Promise<void> {
    // no-op
  }

  async enable(entry: IEntry): Promise<void> {
    // no-op
  }

  async disable(entry: IEntry): Promise<void> {
    // no-op
  }

  private _availablePlugins: IEntry[];
}

/**
 * A plugin for managing status of other plugins.
 */
export const pluginManagerPlugin: JupyterFrontEndPlugin<IPluginManager> = {
  id: '@jupyterlite/application-extension:pluginmanager',
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
      return {
        open: async () => {
          // eslint-disable-next-line no-console
          console.info('Plugin manager viewer is only available in JupyterLab');
        },
      };
    }

    const { commands, shell } = app;
    translator = translator ?? nullTranslator;
    const trans = translator.load('jupyterlab');

    // Translation strings.
    const category = trans.__('Plugin Manager');
    const widgetLabel = trans.__('Advanced Plugin Manager');

    const namespace = 'plugin-manager';
    const tracker = new WidgetTracker<MainAreaWidget<Plugins>>({
      namespace: namespace,
    });

    const availablePlugins = app.info.availablePlugins;

    /**
     * Create a MainAreaWidget for Plugin Manager.
     */
    function createWidget(args?: PluginListModel.IConfigurableState) {
      const model = new LitePluginListModel({
        ...args,
        pluginData: {
          availablePlugins,
        },
        serverSettings: app.serviceManager.serverSettings,
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

    // Register commands.
    commands.addCommand(CommandIDs.open, {
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
      palette.addItem({ command: CommandIDs.open, category });
    }

    return {
      open: () => {
        return app.commands.execute(CommandIDs.open);
      },
    };
  },
};
