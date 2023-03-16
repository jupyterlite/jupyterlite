import { JupyterLiteServer, JupyterLiteServerPlugin } from '@jupyterlite/server';

/**
 * Initialization data for the @jupyterlite/javascript-kernel-extension extension.
 */
const plugin: JupyterLiteServerPlugin<void> = {
  id: '@jupyterlite/javascript-kernel-extension:plugin',
  autoStart: true,
  activate: (app: JupyterLiteServer) => {
    console.log(
      'JupyterLite server extension @jupyterlite/javascript-kernel-extension is activated!'
    );
  },
};

export default plugin;
