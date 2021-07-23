import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';

const plugin: JupyterFrontEndPlugin<void> = {
  id: 'the-smallest-extension:plugin',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => console.log('activated', plugin.id)
};

export default plugin;
