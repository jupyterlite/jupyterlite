import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

/**
 * Initialization data for the jupyterlab-iframe-bridge-example extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-iframe-bridge-example:plugin',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension jupyterlab-iframe-bridge-example is activated!');
  }
};

export default plugin;
