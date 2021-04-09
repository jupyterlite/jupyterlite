import { Contents as ServerContents } from '@jupyterlab/services';

import { IContents } from '@jupyterlite/contents';

import { IKernels, IKernelSpecs } from '@jupyterlite/kernel';

import { ISessions } from '@jupyterlite/session';

import { ISettings } from '@jupyterlite/settings';

import { Router } from './router';

/**
 * A (very, very) simplified Jupyter Server running in the browser.
 */
export class JupyterServer {
  /**
   * Construct a new JupyterServer.
   */
  constructor(options: JupyterServer.IOptions) {
    const { contents, kernels, kernelspecs, sessions, settings } = options;
    this._contents = contents;
    this._kernels = kernels;
    this._kernelspecs = kernelspecs;
    this._sessions = sessions;
    this._settings = settings;
    console.log(this._kernels);
    this._addRoutes();
  }

  /**
   * Handle an incoming request from the client.
   *
   * @param req The incoming request
   * @param init The optional init request
   */
  async fetch(
    req: RequestInfo,
    init?: RequestInit | null | undefined
  ): Promise<Response> {
    if (!(req instanceof Request)) {
      throw Error('Request info is not a Request');
    }
    return this._router.route(req);
  }

  /**
   * Add the routes.
   */
  private _addRoutes(): void {
    const app = this._router;
    // Contents

    // GET /api/contents/{path}/checkpoints - Get a list of checkpoints for a file
    app.get(
      '/api/contents(.*)/checkpoints',
      async (req: Router.IRequest, filename: string) => {
        const res = await this._contents.listCheckpoints(filename);
        return new Response(JSON.stringify(res));
      }
    );

    // POST /api/contents/{path}/checkpoints/{checkpoint_id} - Restore a file to a particular checkpointed state
    app.post(
      '/api/contents(.*)/checkpoints/(.*)',
      async (req: Router.IRequest, filename: string, checkpoint: string) => {
        const res = await this._contents.restoreCheckpoint(
          filename,
          checkpoint
        );
        return new Response(JSON.stringify(res), { status: 204 });
      }
    );

    // POST /api/contents/{path}/checkpoints - Create a new checkpoint for a file
    app.post(
      '/api/contents(.*)/checkpoints',
      async (req: Router.IRequest, filename: string) => {
        const res = await this._contents.createCheckpoint(filename);
        return new Response(JSON.stringify(res), { status: 201 });
      }
    );

    // DELETE /api/contents/{path}/checkpoints/{checkpoint_id} - Delete a checkpoint
    app.delete(
      '/api/contents/(.+)/checkpoints/(.*)',
      async (req: Router.IRequest, filename: string, checkpoint: string) => {
        const res = await this._contents.deleteCheckpoint(filename, checkpoint);
        return new Response(JSON.stringify(res), { status: 204 });
      }
    );

    // GET /api/contents/{path} - Get contents of file or directory
    app.get(
      '/api/contents/(.+)',
      async (req: Router.IRequest, filename: string) => {
        const options: ServerContents.IFetchOptions = {
          content: req.query?.content === '1'
        };
        const nb = await this._contents.get(filename, options);
        return new Response(JSON.stringify(nb));
      }
    );

    // POST /api/contents/{path} - Create a new file in the specified path
    app.post('/api/contents', async (req: Router.IRequest) => {
      const file = await this._contents.newUntitled();
      return new Response(JSON.stringify(file), { status: 201 });
    });

    // PATCH /api/contents/{path} - Rename a file or directory without re-uploading content
    app.patch(
      '/api/contents/(.+)',
      async (req: Router.IRequest, filename: string) => {
        const newPath = (req.body?.path as string) ?? '';
        const nb = await this._contents.rename(filename, newPath);
        return new Response(JSON.stringify(nb));
      }
    );

    // PUT /api/contents/{path} - Save or upload a file
    app.put(
      '/api/contents/(.+)',
      async (req: Router.IRequest, filename: string) => {
        const nb = await this._contents.save(filename);
        return new Response(JSON.stringify(nb));
      }
    );

    // DELETE /api/contents/{path} - Delete a file in the given path
    app.delete(
      '/api/contents/(.+)',
      async (req: Router.IRequest, filename: string) => {
        await this._contents.delete(filename);
        return new Response(JSON.stringify(null), { status: 204 });
      }
    );

    // Kernel
    // POST /api/kernels/{kernel_id} - Restart a kernel
    app.post(
      '/api/kernels/(.*)/restart',
      async (req: Router.IRequest, kernelId: string) => {
        const res = await this._kernels.restart(kernelId);
        return new Response(JSON.stringify(res));
      }
    );

    // DELETE /api/kernels/{kernel_id} - Kill a kernel and delete the kernel id
    app.delete(
      '/api/kernels/(.*)',
      async (req: Router.IRequest, kernelId: string) => {
        const res = await this._kernels.shutdown(kernelId);
        return new Response(JSON.stringify(res), { status: 204 });
      }
    );

    // KernelSpecs
    app.get('/api/kernelspecs', async (req: Router.IRequest) => {
      const res = this._kernelspecs.specs;
      return new Response(JSON.stringify(res));
    });

    // NbConvert
    app.get('/api/nbconvert', async (req: Router.IRequest) => {
      return new Response(JSON.stringify({}));
    });

    // Sessions
    // GET /api/sessions/{session} - Get session
    app.get('/api/sessions/(.+)', async (req: Router.IRequest, id: string) => {
      const session = await this._sessions.get(id);
      return new Response(JSON.stringify(session), { status: 200 });
    });

    // GET /api/sessions - List available sessions
    app.get('/api/sessions', async (req: Router.IRequest) => {
      const sessions = await this._sessions.list();
      return new Response(JSON.stringify(sessions), { status: 200 });
    });

    // PATCH /api/sessions/{session} - This can be used to rename a session
    app.patch('/api/sessions(.*)', async (req: Router.IRequest, id: string) => {
      const options = req.body as any;
      const session = await this._sessions.patch(options);
      return new Response(JSON.stringify(session), { status: 200 });
    });

    // DELETE /api/sessions/{session} - Delete a session
    app.delete(
      '/api/sessions/(.+)',
      async (req: Router.IRequest, id: string) => {
        await this._sessions.shutdown(id);
        return new Response(null, { status: 204 });
      }
    );

    // POST /api/sessions - Create a new session or return an existing session if a session of the same name already exists
    app.post('/api/sessions', async (req: Router.IRequest) => {
      const options = req.body as any;
      const session = await this._sessions.startNew(options);
      return new Response(JSON.stringify(session), { status: 201 });
    });

    // Settings
    // TODO: improve the regex
    const pluginPattern = new RegExp(/(?:@([^/]+?)[/])?([^/]+?):(\w+)/);

    app.get(pluginPattern, async (req: Router.IRequest, pluginId: string) => {
      const settings = await this._settings.get(pluginId);
      return new Response(JSON.stringify(settings));
    });

    app.put(pluginPattern, async (req: Router.IRequest, pluginId: string) => {
      const body = req.body as any;
      const { raw } = body;
      await this._settings.save(pluginId, raw);
      return new Response(null, { status: 204 });
    });

    app.get('/api/settings', async (req: Router.IRequest) => {
      const plugins = await this._settings.getAll();
      return new Response(JSON.stringify(plugins));
    });
  }

  private _router = new Router();
  private _contents: IContents;
  private _kernels: IKernels;
  private _kernelspecs: IKernelSpecs;
  private _sessions: ISessions;
  private _settings: ISettings;
}

/**
 * A namespace for JupyterServer statics.
 */
export namespace JupyterServer {
  /**
   * The instantiation options for a JupyterServer
   */
  export interface IOptions {
    /**
     * The contents service.
     */
    contents: IContents;

    /**
     * The kernels service.
     */
    kernels: IKernels;

    /**
     * The kernel specs service.
     */
    kernelspecs: IKernelSpecs;

    /**
     * The sessions service.
     */
    sessions: ISessions;

    /**
     * The settings service.
     */
    settings: ISettings;
  }
}
