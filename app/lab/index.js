// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { JupyterLab } from '@jupyterlab/application';

import { JupyterLiteServer } from '@jupyterlite/server';

// The webpack public path needs to be set before loading the CSS assets.
import { PageConfig } from '@jupyterlab/coreutils';
// eslint-disable-next-line
__webpack_public_path__ = PageConfig.getOption('fullStaticUrl') + '/';

const styles = import('./build/style.js');

const extensions = [
  import('@jupyterlite/application-extension'),
  import('@jupyterlite/theme-extension'),
  import('@jupyterlab/application-extension'),
  import('@jupyterlab/apputils-extension'),
  import('@jupyterlab/celltags-extension'),
  import('@jupyterlab/codemirror-extension'),
  import('@jupyterlab/completer-extension'),
  import('@jupyterlab/console-extension'),
  import('@jupyterlab/csvviewer-extension'),
  import('@jupyterlab/docmanager-extension'),
  import('@jupyterlab/filebrowser-extension'),
  import('@jupyterlab/fileeditor-extension'),
  import('@jupyterlab/help-extension'),
  import('@jupyterlab/imageviewer-extension'),
  import('@jupyterlab/inspector-extension'),
  import('@jupyterlab/launcher-extension'),
  import('@jupyterlab/mainmenu-extension'),
  import('@jupyterlab/markdownviewer-extension'),
  import('@jupyterlab/mathjax2-extension'),
  import('@jupyterlab/notebook-extension'),
  import('@jupyterlab/rendermime-extension'),
  import('@jupyterlab/running-extension'),
  import('@jupyterlab/settingeditor-extension'),
  import('@jupyterlab/shortcuts-extension'),
  import('@jupyterlab/statusbar-extension'),
  import('@jupyterlab/theme-dark-extension'),
  import('@jupyterlab/theme-light-extension'),
  import('@jupyterlab/toc-extension'),
  import('@jupyterlab/tooltip-extension'),
  import('@jupyterlab/ui-components-extension'),
  import('@telamonian/theme-darcula')
];

const mimeExtensions = [
  import('@jupyterlite/iframe-extension'),
  import('@jupyterlab/json-extension')
];

const mods = [
  import('@jupyterlite/javascript-kernel-extension'),
  import('@jupyterlite/p5-kernel-extension'),
  import('@jupyterlite/pyolite-kernel-extension'),
  import('@jupyterlite/server-extension')
];

// Promise.allSettled polyfill, until our supported browsers implement it
// See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled
if (Promise.allSettled === undefined) {
  Promise.allSettled = promises =>
    Promise.all(
      promises.map(promise =>
        promise.then(
          value => ({
            status: 'fulfilled',
            value
          }),
          reason => ({
            status: 'rejected',
            reason
          })
        )
      )
    );
}

function loadScript(url) {
  return new Promise((resolve, reject) => {
    const newScript = document.createElement('script');
    newScript.onerror = reject;
    newScript.onload = resolve;
    newScript.async = true;
    document.head.appendChild(newScript);
    newScript.src = url;
  });
}

async function loadComponent(url, scope) {
  await loadScript(url);

  // From https://webpack.js.org/concepts/module-federation/#dynamic-remote-containers
  // eslint-disable-next-line no-undef
  await __webpack_init_sharing__('default');
  const container = window._JUPYTERLAB[scope];
  // Initialize the container, it may provide shared modules and may need ours
  // eslint-disable-next-line no-undef
  await container.init(__webpack_share_scopes__.default);
}

void (async function bootstrap() {
  // This is all the data needed to load and activate plugins. This should be
  // gathered by the server and put onto the initial page template.
  const extension_text = PageConfig.getOption('federated_extensions');
  let fed_extensions = [];

  if (extension_text) {
    const extension_data = JSON.parse(extension_text);

    // We first load all federated components so that the shared module
    // deduplication can run and figure out which shared modules from all
    // components should be actually used. We have to do this before importing
    // and using the module that actually uses these components so that all
    // dependencies are initialized.
    let labExtensionUrl = PageConfig.getOption('fullLabextensionsUrl');
    fed_extensions = await Promise.allSettled(
      extension_data.map(async data => {
        await loadComponent(`${labExtensionUrl}/${data.name}/${data.load}`, data.name);
        // eslint-disable-next-line no-undef
        const mod = Object.values(__webpack_share_scopes__.default[data.name])[0];
        const p = await mod.get();
        return p;
      })
    );

    fed_extensions.forEach(p => {
      if (p.status === 'rejected') {
        // There was an error loading the component
        console.error(p.reason);
      }
    });
  }

  // Now that all federated containers are initialized with the main
  // container, we can import the main function.
  // let main = (await import('./index.out.js')).main;
  window.addEventListener('load', async () => {
    // Make sure the styles have loaded
    await styles;

    // create the in-browser JupyterLite Server
    const jupyterLiteServer = new JupyterLiteServer({});
    jupyterLiteServer.registerPluginModules(await Promise.all(mods));
    // start the server
    await jupyterLiteServer.start();

    // retrieve the custom service manager from the server app
    const { serviceManager } = jupyterLiteServer;

    // create a full-blown JupyterLab frontend
    const lab = new JupyterLab({
      mimeExtensions: await Promise.all(mimeExtensions),
      serviceManager
    });

    const disabled = [
      '@jupyterlab/apputils-extension:themes',
      '@jupyterlab/apputils-extension:workspaces',
      '@jupyterlab/application-extension:tree-resolver',
      // TODO: improve/replace resolver and main to avoid redirect issues
      // @see https://github.com/jtpio/jupyterlite/issues/22
      '@jupyterlab/apputils-extension:resolver',
      '@jupyterlab/application-extension:main'
    ];
    const plugins = (await Promise.all(extensions)).map(mod => {
      let data = mod.default;
      if (!Array.isArray(data)) {
        data = [data];
      }
      return data.filter(mod => !disabled.includes(mod.id));
    });

    await Promise.all(
      fed_extensions.map(async p => {
        const data = await p.value();
        console.log(data);
      })
    );

    lab.registerPluginModules(plugins);

    /* eslint-disable no-console */
    console.log('Starting app');
    await lab.start();
    console.log('JupyterLite started, waiting for restore');
    await lab.restored;
    console.log('JupyterLite restored');
  });
})();
