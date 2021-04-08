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
    // Contents
    const filePattern = '(.*)';

    // GET /api/contents/{path}/checkpoints - Get a list of checkpoints for a file
    this._router.add(
      'GET',
      `/api/contents${filePattern}/checkpoints`,
      async (req: Request) => {
        const filename = Private.parseFilename(req.url, filePattern);
        const res = await this._contents.listCheckpoints(filename);
        return new Response(JSON.stringify(res));
      }
    );

    // POST /api/contents/{path}/checkpoints/{checkpoint_id} - Restore a file to a particular checkpointed state
    this._router.add(
      'POST',
      `/api/contents${filePattern}/checkpoints/(.*)`,
      async (req: Request) => {
        const filename = Private.parseFilename(req.url, filePattern);
        const res = await this._contents.restoreCheckpoint(filename, 'TODO');
        return new Response(JSON.stringify(res), { status: 204 });
      }
    );

    // POST /api/contents/{path}/checkpoints - Create a new checkpoint for a file
    this._router.add(
      'POST',
      `/api/contents${filePattern}/checkpoints`,
      async (req: Request) => {
        const filename = Private.parseFilename(req.url, filePattern);
        const res = await this._contents.createCheckpoint(filename);
        return new Response(JSON.stringify(res), { status: 201 });
      }
    );

    // DELETE /api/contents/{path}/checkpoints/{checkpoint_id} - Delete a checkpoint
    this._router.add(
      'DELETE',
      '/api/contents/(.+)/checkpoints/(.*)',
      async (req: Request) => {
        const filename =
          req.url.match('/api/contents(.+)/checkpoints/(.*)')?.[1] ?? '';
        const res = await this._contents.deleteCheckpoint(filename, 'TODO');
        return new Response(JSON.stringify(res), { status: 204 });
      }
    );

    // GET /api/contents/{path} - Get contents of file or directory
    this._router.add('GET', '/api/contents(.+)', async (req: Request) => {
      const filename = req.url.match('/api/contents(.+)')?.[1] ?? '';
      const options: ServerContents.IFetchOptions = {
        content: req.url.includes('content=1')
      };
      const nb = await this._contents.get(filename, options);
      return new Response(JSON.stringify(nb));
    });

    // POST /api/contents/{path} - Create a new file in the specified path
    this._router.add(
      'POST',
      `/api/contents${filePattern}`,
      async (req: Request) => {
        const file = await this._contents.newUntitled();
        return new Response(JSON.stringify(file), { status: 201 });
      }
    );

    // PATCH /api/contents/{path} - Rename a file or directory without re-uploading content
    this._router.add(
      'PATCH',
      `/api/contents${filePattern}`,
      async (req: Request) => {
        const filename = Private.parseFilename(req.url, filePattern);
        const payload = await req.text();
        const options = JSON.parse(payload);
        const newPath = options.path;
        const nb = await this._contents.rename(filename, newPath);
        return new Response(JSON.stringify(nb));
      }
    );

    // PUT /api/contents/{path} - Save or upload a file
    this._router.add(
      'PUT',
      `/api/contents${filePattern}`,
      async (req: Request) => {
        const filename = Private.parseFilename(req.url, filePattern);
        const nb = await this._contents.save(filename);
        return new Response(JSON.stringify(nb));
      }
    );

    // DELETE /api/contents/{path} - Delete a file in the given path
    this._router.add(
      'DELETE',
      `/api/contents${filePattern}`,
      async (req: Request) => {
        const filename = Private.parseFilename(req.url, filePattern);
        await this._contents.delete(filename);
        return new Response(JSON.stringify(null), { status: 204 });
      }
    );

    // Kernel
    // POST /api/kernels/{kernel_id} - Restart a kernel
    this._router.add(
      'POST',
      '/api/kernels/(.*)/restart',
      async (req: Request) => {
        const kernelId = req.url.match('/api/kernels/(.*)/restart')?.[1] ?? '';
        const res = await this._kernels.restart(kernelId);
        return new Response(JSON.stringify(res));
      }
    );

    // DELETE /api/kernels/{kernel_id} - Kill a kernel and delete the kernel id
    this._router.add('DELETE', '/api/kernels/(.*)', async (req: Request) => {
      const kernelId = req.url.match('/api/kernels/(.*)')?.[1] ?? '';
      const res = await this._kernels.shutdown(kernelId);
      return new Response(JSON.stringify(res), { status: 204 });
    });

    // KernelSpecs
    this._router.add('GET', '/api/kernelspecs', async (req: Request) => {
      const res = this._kernelspecs.specs;
      return new Response(JSON.stringify(res));
    });

    // NbConvert
    this._router.add('GET', '/api/nbconvert', async (req: Request) => {
      return new Response(JSON.stringify({}));
    });

    // Sessions
    // GET /api/sessions/{session} - Get session
    this._router.add('GET', '/api/sessions(.+)', async (req: Request) => {
      const id = req.url.match('/api/sessions(.+)')?.[1] ?? '';
      const session = await this._sessions.get(id);
      return new Response(JSON.stringify(session), { status: 200 });
    });

    // GET /api/sessions - List available sessions
    this._router.add('GET', '/api/sessions', async (req: Request) => {
      const sessions = await this._sessions.list();
      return new Response(JSON.stringify(sessions), { status: 200 });
    });

    // PATCH /api/sessions/{session} - This can be used to rename a session
    this._router.add('PATCH', '/api/sessions.*', async (req: Request) => {
      const payload = await req.text();
      const options = JSON.parse(payload);
      const session = await this._sessions.patch(options);
      return new Response(JSON.stringify(session), { status: 200 });
    });

    // DELETE /api/sessions/{session} - Delete a session
    this._router.add('DELETE', '/api/sessions(.+)', async (req: Request) => {
      const id = req.url.match('/api/sessions(.+)')?.[1] ?? '';
      await this._sessions.shutdown(id);
      return new Response(null, { status: 204 });
    });

    // POST /api/sessions - Create a new session or return an existing session if a session of the same name already exists
    this._router.add('POST', '/api/sessions', async (req: Request) => {
      const payload = await req.text();
      const options = JSON.parse(payload);
      const session = await this._sessions.startNew(options);
      return new Response(JSON.stringify(session), { status: 201 });
    });

    // Settings
    // TODO: improve the regex
    const pluginPattern = new RegExp(/(?:@([^/]+?)[/])?([^/]+?):(\w+)/);

    this._router.add('GET', pluginPattern, async (req: Request) => {
      const pluginId = Private.parsePluginId(req.url, pluginPattern);
      const settings = await this._settings.get(pluginId);
      return new Response(JSON.stringify(settings));
    });

    this._router.add('PUT', pluginPattern, async (req: Request) => {
      const pluginId = Private.parsePluginId(req.url, pluginPattern);
      const payload = await req.text();
      const parsed = JSON.parse(payload);
      const { raw } = parsed;
      await this._settings.save(pluginId, raw);
      return new Response(null, { status: 204 });
    });

    this._router.add('GET', '/api/settings', async (req: Request) => {
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

/**
 * A namespace for private data.
 */
namespace Private {
  /**
   * Parse the plugin id from a URL.
   *
   * @param url The request url.
   */
  export const parsePluginId = (url: string, pattern: RegExp): string => {
    const matches = new URL(url).pathname.match(pattern);
    return matches?.[0] ?? '';
  };

  /**
   * Parse the file name from a URL.
   *
   * @param url The request url.
   */
  export const parseFilename = (url: string, pattern: string): string => {
    const matches = new URL(url).pathname.match(pattern);
    return matches?.[0] ?? '';
  };
}
