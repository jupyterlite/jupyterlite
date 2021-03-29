import { Kernels } from '@jupyterlite/kernel';

import { KernelSpecs } from '@jupyterlite/kernelspec';

import { Sessions } from '@jupyterlite/session';

import { Contents } from '@jupyterlite/contents';

import { Settings } from '@jupyterlite/settings';

import { Router } from './router';

/**
 * A (very, very) simplified Jupyter Server running in the browser.
 */
export class JupyterServer {
  /**
   * Construct a new JupyterServer.
   */
  constructor() {
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
      `/api/contents${filePattern}/checkpoints/(.*)`,
      async (req: Request) => {
        const filename = Private.parseFilename(req.url, filePattern);
        const res = await this._contents.deleteCheckpoint(filename, 'TODO');
        return new Response(JSON.stringify(res), { status: 204 });
      }
    );

    // GET /api/contents/{path} - Get contents of file or directory
    this._router.add(
      'GET',
      `/api/contents${filePattern}`,
      async (req: Request) => {
        const filename = Private.parseFilename(req.url, filePattern);
        const nb = await this._contents.get(filename);
        return new Response(JSON.stringify(nb));
      }
    );

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
    // TODO

    // KernelSpecs
    this._router.add('GET', '/api/kernelspecs', async (req: Request) => {
      const res = this._kernelspecs.get();
      return new Response(JSON.stringify(res));
    });

    // NbConvert
    this._router.add('GET', '/api/nbconvert', async (req: Request) => {
      return new Response(JSON.stringify({}));
    });

    // Sessions
    this._router.add('GET', '/api/sessions.*', async (req: Request) => {
      return new Response(JSON.stringify([]), { status: 200 });
    });

    this._router.add('PATCH', '/api/sessions.*', async (req: Request) => {
      const payload = await req.text();
      const options = JSON.parse(payload);
      const session = this._sessions.patch(options);
      return new Response(JSON.stringify(session), { status: 200 });
    });

    this._router.add('DELETE', '/api/sessions.*', async (req: Request) => {
      return new Response(null, { status: 204 });
    });

    this._router.add('POST', '/api/sessions.*', async (req: Request) => {
      const payload = await req.text();
      const options = JSON.parse(payload);
      const session = this._sessions.startNew(options);
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
  private _kernelspecs = new KernelSpecs();
  private _contents = new Contents();
  private _kernels = new Kernels();
  private _settings = new Settings();
  private _sessions = new Sessions({ kernels: this._kernels });
}

/**
 * A namespace for JupyterServer statics.
 */
export namespace JupyterServer {}

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
