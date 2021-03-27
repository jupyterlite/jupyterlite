// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  JupyterLiteServer,
  JupyterLiteServerPlugin
} from '@jupyterlite/server';

const main: JupyterLiteServerPlugin<void> = {
  id: '@jupyterlite/server-extension:main',
  autoStart: true,
  activate: (app: JupyterLiteServer) => {
    console.log(main.id, 'activated');
  }
};

const plugins: JupyterLiteServerPlugin<any>[] = [main];

export default plugins;
