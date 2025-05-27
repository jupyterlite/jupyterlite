// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';

import { createRendermimePlugins } from '@jupyterlab/application/lib/mimerenderers';

import { LabStatus } from '@jupyterlab/application/lib/status';

import { PageConfig } from '@jupyterlab/coreutils';

import { IRenderMime } from '@jupyterlab/rendermime-interfaces';

import { ISingleWidgetShell, SingleWidgetShell } from './singleWidgetShell';

/**
 * App is the main application class. It is instantiated once and shared.
 */
export class SingleWidgetApp extends JupyterFrontEnd<ISingleWidgetShell> {
  /**
   * Construct a new SingleWidgetApp object.
   *
   * @param options The instantiation options for an application.
   */
  constructor(options: SingleWidgetApp.IOptions = { shell: new SingleWidgetShell() }) {
    super({
      ...options,
      shell: options.shell ?? new SingleWidgetShell(),
    });
    if (options.mimeExtensions) {
      for (const plugin of createRendermimePlugins(options.mimeExtensions)) {
        this.registerPlugin(plugin);
      }
    }
  }

  /**
   * The name of the application.
   */
  readonly name = 'Single Widget Application';

  /**
   * A namespace/prefix plugins may use to denote their provenance.
   */
  readonly namespace = this.name;

  /**
   * The application busy and dirty status signals and flags.
   */
  readonly status = new LabStatus(this);

  /**
   * The version of the application.
   */
  readonly version = PageConfig.getOption('appVersion') ?? 'unknown';

  /**
   * The JupyterLab application paths dictionary.
   */
  get paths(): JupyterFrontEnd.IPaths {
    return {
      urls: {
        base: PageConfig.getOption('baseUrl'),
        notFound: PageConfig.getOption('notFoundUrl'),
        app: PageConfig.getOption('appUrl'),
        static: PageConfig.getOption('staticUrl'),
        settings: PageConfig.getOption('settingsUrl'),
        themes: PageConfig.getOption('themesUrl'),
        doc: PageConfig.getOption('docUrl'),
        translations: PageConfig.getOption('translationsApiUrl'),
        hubHost: PageConfig.getOption('hubHost') || undefined,
        hubPrefix: PageConfig.getOption('hubPrefix') || undefined,
        hubUser: PageConfig.getOption('hubUser') || undefined,
        hubServerName: PageConfig.getOption('hubServerName') || undefined,
      },
      directories: {
        appSettings: PageConfig.getOption('appSettingsDir'),
        schemas: PageConfig.getOption('schemasDir'),
        static: PageConfig.getOption('staticDir'),
        templates: PageConfig.getOption('templatesDir'),
        themes: PageConfig.getOption('themesDir'),
        userSettings: PageConfig.getOption('userSettingsDir'),
        serverRoot: PageConfig.getOption('serverRoot'),
        workspaces: PageConfig.getOption('workspacesDir'),
      },
    };
  }
}

/**
 * A namespace for App statics.
 */
export namespace SingleWidgetApp {
  /**
   * The instantiation options for an App application.
   */
  export interface IOptions
    extends JupyterFrontEnd.IOptions<ISingleWidgetShell>,
      Partial<IInfo> {}

  /**
   * The information about a Jupyter Notebook application.
   */
  export interface IInfo {
    /**
     * The mime renderer extensions.
     */
    readonly mimeExtensions: IRenderMime.IExtensionModule[];
  }

  /**
   * The interface for a module that exports a plugin or plugins as
   * the default value.
   */
  export interface IPluginModule {
    /**
     * The default export.
     */
    default: JupyterFrontEndPlugin<any> | JupyterFrontEndPlugin<any>[];
  }
}
