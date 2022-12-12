// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { PageConfig } from '@jupyterlab/coreutils';

import { Contents as ServerContents, KernelSpec } from '@jupyterlab/services';

import {
  BroadcastChannelWrapper,
  Contents,
  IContents,
  IBroadcastChannelWrapper,
} from '@jupyterlite/contents';

import { IKernels, Kernels, IKernelSpecs, KernelSpecs } from '@jupyterlite/kernel';

import { ILicenses, Licenses } from '@jupyterlite/licenses';

import {
  JupyterLiteServer,
  JupyterLiteServerPlugin,
  Router,
  IServiceWorkerManager,
  ServiceWorkerManager,
} from '@jupyterlite/server';

import { ISessions, Sessions } from '@jupyterlite/session';

import { ISettings, Settings } from '@jupyterlite/settings';

import { ITranslation, Translation } from '@jupyterlite/translation';

import { ILocalForage, ensureMemoryStorage } from '@jupyterlite/localforage';

import localforage from 'localforage';

/**
 * The localforage plugin
 */
const localforagePlugin: JupyterLiteServerPlugin<ILocalForage> = {
  id: '@jupyterlite/server-extension:localforage',
  autoStart: true,
  provides: ILocalForage,
  activate: (app: JupyterLiteServer) => {
    return { localforage };
  },
};

/**
 * The volatile localforage memory plugin
 */
const localforageMemoryPlugin: JupyterLiteServerPlugin<void> = {
  id: '@jupyterlite/server-extension:localforage-memory-storage',
  autoStart: true,
  requires: [ILocalForage],
  activate: async (app: JupyterLiteServer, forage: ILocalForage) => {
    if (JSON.parse(PageConfig.getOption('enableMemoryStorage') || 'false')) {
      console.warn(
        'Memory storage fallback enabled: contents and settings may not be saved'
      );
      await ensureMemoryStorage(forage.localforage);
    }
  },
};

/**
 * The contents service plugin.
 */
const contentsPlugin: JupyterLiteServerPlugin<IContents> = {
  id: '@jupyterlite/server-extension:contents',
  requires: [ILocalForage],
  autoStart: true,
  provides: IContents,
  activate: (app: JupyterLiteServer, forage: ILocalForage) => {
    const storageName = PageConfig.getOption('contentsStorageName');
    const storageDrivers = JSON.parse(
      PageConfig.getOption('contentsStorageDrivers') || 'null'
    );
    const { localforage } = forage;
    const contents = new Contents({
      storageName,
      storageDrivers,
      localforage,
    });
    app.started.then(() => contents.initialize().catch(console.warn));
    return contents;
  },
};

/**
 * A plugin providing the routes for the contents service.
 */
const contentsRoutesPlugin: JupyterLiteServerPlugin<void> = {
  id: '@jupyterlite/server-extension:contents-routes',
  autoStart: true,
  requires: [IContents],
  activate: (app: JupyterLiteServer, contents: IContents) => {
    // GET /api/contents/{path}/checkpoints - Get a list of checkpoints for a file
    app.router.get(
      '/api/contents/(.+)/checkpoints',
      async (req: Router.IRequest, filename: string) => {
        const res = await contents.listCheckpoints(filename);
        return new Response(JSON.stringify(res));
      }
    );

    // POST /api/contents/{path}/checkpoints/{checkpoint_id} - Restore a file to a particular checkpointed state
    app.router.post(
      '/api/contents/(.+)/checkpoints/(.*)',
      async (req: Router.IRequest, filename: string, checkpoint: string) => {
        const res = await contents.restoreCheckpoint(filename, checkpoint);
        return new Response(JSON.stringify(res), { status: 204 });
      }
    );

    // POST /api/contents/{path}/checkpoints - Create a new checkpoint for a file
    app.router.post(
      '/api/contents/(.+)/checkpoints',
      async (req: Router.IRequest, filename: string) => {
        const res = await contents.createCheckpoint(filename);
        return new Response(JSON.stringify(res), { status: 201 });
      }
    );

    // DELETE /api/contents/{path}/checkpoints/{checkpoint_id} - Delete a checkpoint
    app.router.delete(
      '/api/contents/(.+)/checkpoints/(.*)',
      async (req: Router.IRequest, filename: string, checkpoint: string) => {
        const res = await contents.deleteCheckpoint(filename, checkpoint);
        return new Response(JSON.stringify(res), { status: 204 });
      }
    );

    // GET /api/contents/{path} - Get contents of file or directory
    app.router.get(
      '/api/contents(.*)',
      async (req: Router.IRequest, filename: string) => {
        const options: ServerContents.IFetchOptions = {
          content: req.query?.content === '1',
        };
        const nb = await contents.get(filename, options);
        if (!nb) {
          return new Response(null, { status: 404 });
        }
        return new Response(JSON.stringify(nb));
      }
    );

    // POST /api/contents/{path} - Create a new file in the specified path
    app.router.post('/api/contents(.*)', async (req: Router.IRequest, path: string) => {
      const options = req.body;
      const copyFrom = options?.copy_from as string;
      let file: ServerContents.IModel | null;
      if (copyFrom) {
        file = await contents.copy(copyFrom, path);
      } else {
        file = await contents.newUntitled(options);
      }
      if (!file) {
        return new Response(null, { status: 400 });
      }
      return new Response(JSON.stringify(file), { status: 201 });
    });

    // PATCH /api/contents/{path} - Rename a file or directory without re-uploading content
    app.router.patch(
      '/api/contents(.*)',
      async (req: Router.IRequest, filename: string) => {
        const newPath = (req.body?.path as string) ?? '';
        filename = filename[0] === '/' ? filename.slice(1) : filename;
        const nb = await contents.rename(filename, newPath);
        return new Response(JSON.stringify(nb));
      }
    );

    // PUT /api/contents/{path} - Save or upload a file
    app.router.put(
      '/api/contents/(.+)',
      async (req: Router.IRequest, filename: string) => {
        const body = req.body;
        const nb = await contents.save(filename, body);
        return new Response(JSON.stringify(nb));
      }
    );

    // DELETE /api/contents/{path} - Delete a file in the given path
    app.router.delete(
      '/api/contents/(.+)',
      async (req: Router.IRequest, filename: string) => {
        await contents.delete(filename);
        return new Response(null, { status: 204 });
      }
    );
  },
};

/**
 * A plugin installing the service worker.
 */
const serviceWorkerPlugin: JupyterLiteServerPlugin<IServiceWorkerManager> = {
  id: '@jupyterlite/server-extension:service-worker',
  autoStart: true,
  provides: IServiceWorkerManager,
  activate: (app: JupyterLiteServer) => {
    return new ServiceWorkerManager();
  },
};

/**
 * A plugin for handling communication with the Emscpriten file system.
 */
const emscriptenFileSystemPlugin: JupyterLiteServerPlugin<IBroadcastChannelWrapper> = {
  id: '@jupyterlite/server-extension:emscripten-filesystem',
  autoStart: true,
  optional: [IServiceWorkerManager],
  provides: IBroadcastChannelWrapper,
  activate: (
    app: JupyterLiteServer,
    serviceWorkerRegistrationWrapper?: IServiceWorkerManager
  ): IBroadcastChannelWrapper => {
    const { contents } = app.serviceManager;
    const broadcaster = new BroadcastChannelWrapper({ contents });
    const what = 'Kernel filesystem and JupyterLite contents';

    function logStatus(msg?: string, err?: any) {
      if (err) {
        console.warn(err);
      }
      if (msg) {
        console.warn(msg);
      }
      if (err || msg) {
        console.warn(`${what} will NOT be synced`);
      } else {
        console.info(`${what} will be synced`);
      }
    }

    if (!serviceWorkerRegistrationWrapper) {
      logStatus('JupyterLite ServiceWorker not available');
    } else {
      serviceWorkerRegistrationWrapper.ready
        .then(() => {
          broadcaster.enable();
          logStatus();
        })
        .catch((err: any) => {
          logStatus('JupyterLite ServiceWorker failed to become available', err);
        });
    }

    return broadcaster;
  },
};

/**
 * The kernels service plugin.
 */
const kernelsPlugin: JupyterLiteServerPlugin<IKernels> = {
  id: '@jupyterlite/server-extension:kernels',
  autoStart: true,
  provides: IKernels,
  requires: [IKernelSpecs],
  activate: (app: JupyterLiteServer, kernelspecs: IKernelSpecs) => {
    return new Kernels({ kernelspecs });
  },
};

/**
 * A plugin providing the routes for the kernels service
 */
const kernelsRoutesPlugin: JupyterLiteServerPlugin<void> = {
  id: '@jupyterlite/server-extension:kernels-routes',
  autoStart: true,
  requires: [IKernels],
  activate: (app: JupyterLiteServer, kernels: IKernels) => {
    // POST /api/kernels/{kernel_id} - Restart a kernel
    app.router.post(
      '/api/kernels/(.*)/restart',
      async (req: Router.IRequest, kernelId: string) => {
        const res = await kernels.restart(kernelId);
        return new Response(JSON.stringify(res));
      }
    );

    // DELETE /api/kernels/{kernel_id} - Kill a kernel and delete the kernel id
    app.router.delete(
      '/api/kernels/(.*)',
      async (req: Router.IRequest, kernelId: string) => {
        const res = await kernels.shutdown(kernelId);
        return new Response(JSON.stringify(res), { status: 204 });
      }
    );
  },
};

/**
 * The kernel spec service plugin.
 */
const kernelSpecPlugin: JupyterLiteServerPlugin<IKernelSpecs> = {
  id: '@jupyterlite/server-extension:kernelspec',
  autoStart: true,
  provides: IKernelSpecs,
  activate: (app: JupyterLiteServer) => {
    return new KernelSpecs();
  },
};

/**
 * A plugin providing the routes for the kernelspec service.
 */
const kernelSpecRoutesPlugin: JupyterLiteServerPlugin<void> = {
  id: '@jupyterlite/server-extension:kernelspec-routes',
  autoStart: true,
  requires: [IKernelSpecs],
  activate: (app: JupyterLiteServer, kernelspecs: IKernelSpecs) => {
    app.router.get('/api/kernelspecs', async (req: Router.IRequest) => {
      const { specs } = kernelspecs;
      if (!specs) {
        return new Response(null);
      }
      // follow the same format as in Jupyter Server
      const allKernelSpecs: {
        [name: string]: {
          name: string;
          spec: KernelSpec.ISpecModel | undefined;
          resources: { [name: string]: string } | undefined;
        };
      } = {};
      const allSpecs = specs.kernelspecs;
      Object.keys(allSpecs).forEach((name) => {
        const spec = allSpecs[name];
        const { resources } = spec ?? {};
        allKernelSpecs[name] = {
          name,
          spec,
          resources,
        };
      });
      const res = {
        default: specs.default,
        kernelspecs: allKernelSpecs,
      };
      return new Response(JSON.stringify(res));
    });
  },
};

/**
 * The licenses service plugin
 */
const licensesPlugin: JupyterLiteServerPlugin<ILicenses> = {
  id: '@jupyterlite/server-extension:licenses',
  autoStart: true,
  provides: ILicenses,
  activate: (app: JupyterLiteServer) => {
    return new Licenses();
  },
};

/**
 * A plugin providing the routes for the licenses service.
 */
const licensesRoutesPlugin: JupyterLiteServerPlugin<void> = {
  id: '@jupyterlite/server-extension:licenses-routes',
  autoStart: true,
  requires: [ILicenses],
  activate(app: JupyterLiteServer, licenses: ILicenses) {
    app.router.get('/api/licenses', async (req: Router.IRequest) => {
      const res = await licenses.get();
      return new Response(JSON.stringify(res));
    });
  },
};

/**
 * A plugin providing the routes for the nbconvert service.
 * TODO: provide the service in a separate plugin?
 */
const nbconvertRoutesPlugin: JupyterLiteServerPlugin<void> = {
  id: '@jupyterlite/server-extension:nbconvert-routes',
  autoStart: true,
  activate: (app: JupyterLiteServer) => {
    app.router.get('/api/nbconvert', async (req: Router.IRequest) => {
      return new Response(JSON.stringify({}));
    });
  },
};

/**
 * The sessions service plugin.
 */
const sessionsPlugin: JupyterLiteServerPlugin<ISessions> = {
  id: '@jupyterlite/server-extension:sessions',
  autoStart: true,
  provides: ISessions,
  requires: [IKernels],
  activate: (app: JupyterLiteServer, kernels: IKernels) => {
    return new Sessions({ kernels });
  },
};

/**
 * A plugin providing the routes for the session service.
 */
const sessionsRoutesPlugin: JupyterLiteServerPlugin<void> = {
  id: '@jupyterlite/server-extension:sessions-routes',
  autoStart: true,
  requires: [ISessions],
  activate: (app: JupyterLiteServer, sessions: ISessions) => {
    // GET /api/sessions/{session} - Get session
    app.router.get('/api/sessions/(.+)', async (req: Router.IRequest, id: string) => {
      const session = await sessions.get(id);
      return new Response(JSON.stringify(session), { status: 200 });
    });

    // GET /api/sessions - List available sessions
    app.router.get('/api/sessions', async (req: Router.IRequest) => {
      const list = await sessions.list();
      return new Response(JSON.stringify(list), { status: 200 });
    });

    // PATCH /api/sessions/{session} - This can be used to rename a session
    app.router.patch('/api/sessions(.*)', async (req: Router.IRequest, id: string) => {
      const options = req.body as any;
      const session = await sessions.patch(options);
      return new Response(JSON.stringify(session), { status: 200 });
    });

    // DELETE /api/sessions/{session} - Delete a session
    app.router.delete(
      '/api/sessions/(.+)',
      async (req: Router.IRequest, id: string) => {
        await sessions.shutdown(id);
        return new Response(null, { status: 204 });
      }
    );

    // POST /api/sessions - Create a new session or return an existing session if a session of the same name already exists
    app.router.post('/api/sessions', async (req: Router.IRequest) => {
      const options = req.body as any;
      const session = await sessions.startNew(options);
      return new Response(JSON.stringify(session), { status: 201 });
    });
  },
};

/**
 * The settings service plugin.
 */
const settingsPlugin: JupyterLiteServerPlugin<ISettings> = {
  id: '@jupyterlite/server-extension:settings',
  autoStart: true,
  requires: [ILocalForage],
  provides: ISettings,
  activate: (app: JupyterLiteServer, forage: ILocalForage) => {
    const storageName = PageConfig.getOption('settingsStorageName');
    const storageDrivers = JSON.parse(
      PageConfig.getOption('settingsStorageDrivers') || 'null'
    );
    const { localforage } = forage;
    const settings = new Settings({ storageName, storageDrivers, localforage });
    app.started.then(() => settings.initialize().catch(console.warn));
    return settings;
  },
};

/**
 * A plugin providing the routes for the settings service.
 */
const settingsRoutesPlugin: JupyterLiteServerPlugin<void> = {
  id: '@jupyterlite/server-extension:settings-routes',
  autoStart: true,
  requires: [ISettings],
  activate: (app: JupyterLiteServer, settings: ISettings) => {
    // TODO: improve the regex
    // const pluginPattern = new RegExp(/(?:@([^/]+?)[/])?([^/]+?):(\w+)/);
    const pluginPattern = '/api/settings/((?:@([^/]+?)[/])?([^/]+?):([^:]+))$';

    app.router.get(pluginPattern, async (req: Router.IRequest, pluginId: string) => {
      const setting = await settings.get(pluginId);
      return new Response(JSON.stringify(setting));
    });

    app.router.put(pluginPattern, async (req: Router.IRequest, pluginId: string) => {
      const body = req.body as any;
      const { raw } = body;
      await settings.save(pluginId, raw);
      return new Response(null, { status: 204 });
    });

    app.router.get('/api/settings', async (req: Router.IRequest) => {
      const plugins = await settings.getAll();
      return new Response(JSON.stringify(plugins));
    });
  },
};

/**
 * The translation service plugin.
 */
const translationPlugin: JupyterLiteServerPlugin<ITranslation> = {
  id: '@jupyterlite/server-extension:translation',
  autoStart: true,
  provides: ITranslation,
  activate: (app: JupyterLiteServer) => {
    const translation = new Translation();

    app.router.get(
      '/api/translations/?(.*)',
      async (req: Router.IRequest, locale: string) => {
        const data = await translation.get(locale || 'all');
        return new Response(JSON.stringify(data));
      }
    );

    return translation;
  },
};

/**
 * A plugin providing the routes for the translation service.
 */
const translationRoutesPlugin: JupyterLiteServerPlugin<void> = {
  id: '@jupyterlite/server-extension:translation-routes',
  autoStart: true,
  requires: [ITranslation],
  activate: (app: JupyterLiteServer, translation: ITranslation) => {
    app.router.get(
      '/api/translations/?(.*)',
      async (req: Router.IRequest, locale: string) => {
        const data = await translation.get(locale || 'all');
        return new Response(JSON.stringify(data));
      }
    );
  },
};

const plugins: JupyterLiteServerPlugin<any>[] = [
  contentsPlugin,
  contentsRoutesPlugin,
  emscriptenFileSystemPlugin,
  kernelsPlugin,
  kernelsRoutesPlugin,
  kernelSpecPlugin,
  kernelSpecRoutesPlugin,
  licensesPlugin,
  licensesRoutesPlugin,
  localforageMemoryPlugin,
  localforagePlugin,
  nbconvertRoutesPlugin,
  serviceWorkerPlugin,
  sessionsPlugin,
  sessionsRoutesPlugin,
  settingsPlugin,
  settingsRoutesPlugin,
  translationPlugin,
  translationRoutesPlugin,
];

export default plugins;
