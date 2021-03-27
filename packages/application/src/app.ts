// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { JupyterLab } from '@jupyterlab/application';

/**
 * App is the main application class. It is instantiated once and shared.
 */
export class JupyterLite extends JupyterLab {
  /**
   * Construct a new App object.
   *
   * @param options The instantiation options for an application.
   */
  constructor(options: JupyterLite.IOptions) {
    super(options);
  }

  /**
   * The name of the application.
   */
  readonly name = 'JupyterLite';

  /**
   * A namespace/prefix plugins may use to denote their provenance.
   */
  readonly namespace = this.name;

  /**
   * The version of the application.
   */

  readonly version = '0.1.0';
}

/**
 * A namespace for App statics.
 */
export namespace JupyterLite {
  /**
   * The instantiation options for an App application.
   */
  export type IOptions = JupyterLab.IOptions;
}
