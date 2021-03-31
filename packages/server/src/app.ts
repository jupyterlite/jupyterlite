// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { Application, IPlugin } from '@lumino/application';

export type JupyterLiteServerPlugin<T> = IPlugin<JupyterLiteServer, T>;

/**
 * Server is the main application class. It is instantiated once and shared.
 */
export class JupyterLiteServer extends Application<never> {
  /**
   * Construct a new App object.
   *
   * @param options The instantiation options for a JupyterLiteServer application.
   */
  constructor(options: Application.IOptions<never>) {
    super(options);
  }

  /**
   * The name of the application.
   */
  readonly name = 'JupyterLite Server';

  /**
   * A namespace/prefix plugins may use to denote their provenance.
   */
  readonly namespace = this.name;

  /**
   * The version of the application.
   */
  readonly version = 'unknown';

  /**
   * Register plugins from a plugin module.
   *
   * @param mod - The plugin module to register.
   */
  registerPluginModule(mod: JupyterLiteServer.IPluginModule): void {
    let data = mod.default;
    // Handle commonjs exports.
    if (!Object.prototype.hasOwnProperty.call(mod, '__esModule')) {
      data = mod as any;
    }
    if (!Array.isArray(data)) {
      data = [data];
    }
    data.forEach(item => {
      try {
        this.registerPlugin(item);
      } catch (error) {
        console.error(error);
      }
    });
  }

  /**
   * Register the plugins from multiple plugin modules.
   *
   * @param mods - The plugin modules to register.
   */
  registerPluginModules(mods: JupyterLiteServer.IPluginModule[]): void {
    mods.forEach(mod => {
      this.registerPluginModule(mod);
    });
  }
}

/**
 * A namespace for Server statics.
 */
export namespace JupyterLiteServer {
  /**
   * The interface for a module that exports a plugin or plugins as
   * the default value.
   */
  export interface IPluginModule {
    /**
     * The default export.
     */
    default:
      | IPlugin<JupyterLiteServer, any>
      | IPlugin<JupyterLiteServer, any>[];
  }
}
