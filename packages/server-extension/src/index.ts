// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { PageConfig } from '@jupyterlab/coreutils';

import { Contents as ServerContents } from '@jupyterlab/services';

import { Contents, IContents } from '@jupyterlite/contents';

import { IKernels, Kernels, IKernelSpecs, KernelSpecs } from '@jupyterlite/kernel';

import {
  JupyterLiteServer,
  JupyterLiteServerPlugin,
  Router,
} from '@jupyterlite/server';

import { ISessions, Sessions } from '@jupyterlite/session';

import { ISettings, Settings } from '@jupyterlite/settings';

import { ITranslation, Translation } from '@jupyterlite/translation';

/**
 * The contents service plugin.
 */
const contentsPlugin: JupyterLiteServerPlugin<IContents> = {
  id: '@jupyterlite/server-extension:contents',
  autoStart: true,
  provides: IContents,
  activate: (app: JupyterLiteServer) => {
    const contentsStorageName = PageConfig.getOption('contentsStorageName');
    const contents = new Contents({ contentsStorageName });

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
    return contents;
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
    const kernels = new Kernels({ kernelspecs });

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

    return kernels;
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
    const kernelspecs = new KernelSpecs({});

    app.router.get('/api/kernelspecs', async (req: Router.IRequest) => {
      const res = kernelspecs.specs;
      return new Response(JSON.stringify(res));
    });

    return kernelspecs;
  },
};

/**
 * The nbconvert service plugin.
 * TODO: provide the service
 */
const nbconvertPlugin: JupyterLiteServerPlugin<void> = {
  id: '@jupyterlite/server-extension:nbconvert',
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
    const sessions = new Sessions({ kernels });

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

    return sessions;
  },
};

/**
 * The settings service plugin.
 */
const settingsPlugin: JupyterLiteServerPlugin<ISettings> = {
  id: '@jupyterlite/server-extension:settings',
  autoStart: true,
  provides: ISettings,
  activate: (app: JupyterLiteServer) => {
    const settingsStorageName = PageConfig.getOption('settingsStorageName');
    const settings = new Settings({ settingsStorageName });

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

    return settings;
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

const plugins: JupyterLiteServerPlugin<any>[] = [
  contentsPlugin,
  kernelsPlugin,
  kernelSpecPlugin,
  nbconvertPlugin,
  sessionsPlugin,
  settingsPlugin,
  translationPlugin,
];

export default plugins;
