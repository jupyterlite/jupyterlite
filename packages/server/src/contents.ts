import { Contents as ServerContents } from '@jupyterlab/services';

import { INotebookContent } from '@jupyterlab/nbformat';

import { Router } from './router';

import { IJupyterServer } from './tokens';

/**
 * A class to handle requests to /api/contents
 */
export class Contents implements IJupyterServer.IRoutable {
  /**
   * Construct a new Contents.
   */
  constructor() {
    this._router.add(
      'GET',
      '/api/contents/(.*)/checkpoints',
      async (req: Request) => {
        return new Response(JSON.stringify(Private.DEFAULT_CHECKPOINTS));
      }
    );
    this._router.add('POST', '/api/contents', async (req: Request) => {
      const file = this._createNew();
      return new Response(JSON.stringify(file), { status: 201 });
    });
    this._router.add('GET', Private.FILE_NAME_REGEX, async (req: Request) => {
      const filename = Private.parseFilename(req.url);
      const nb = this.get(filename);
      return new Response(JSON.stringify(nb));
    });
    this._router.add('PUT', Private.FILE_NAME_REGEX, async (req: Request) => {
      const filename = Private.parseFilename(req.url);
      const nb = this.get(filename);
      return new Response(JSON.stringify(nb));
    });
  }

  /**
   * Get a notebook by name.
   *
   * @param name The name of the notebook.
   */
  get(name: string): ServerContents.IModel {
    console.log(`TODO: return ${name}`);
    return Private.EMPTY_NOTEBOOK;
  }

  /**
   * Dispatch a request to the local router.
   *
   * @param req The request to dispatch.
   */
  dispatch(req: Request): Promise<Response> {
    return this._router.route(req);
  }

  /**
   * Create a new file.
   * @returns The new file to create.
   */
  private _createNew(): ServerContents.IModel {
    // TODO: create new files
    return Private.EMPTY_NOTEBOOK;
  }

  private _router = new Router();
}

/**
 * A namespace for Contents statics.
 */
export namespace Contents {
  /**
   * The url for the contents service.
   */
  export const CONTENTS_SERVICE_URL = '/api/contents';
}

/**
 * A namespace for private data.
 */
namespace Private {
  /**
   * The regex to match file names.
   */
  export const FILE_NAME_REGEX = new RegExp(/(\w+\.ipynb)/);

  /**
   * Parse the file name from a URL.
   *
   * @param url The request url.
   */
  export const parseFilename = (url: string): string => {
    const matches = new URL(url).pathname.match(FILE_NAME_REGEX);
    return matches?.[0] ?? '';
  };

  /**
   * The default checkpoints.
   */
  export const DEFAULT_CHECKPOINTS = [
    { id: 'checkpoint', last_modified: '2021-03-27T13:51:59.816052Z' }
  ];

  /**
   * The content for an empty notebook.
   */
  const EMPTY_NB: INotebookContent = {
    metadata: {
      orig_nbformat: 4
    },
    nbformat_minor: 4,
    nbformat: 4,
    cells: []
  };

  /**
   * The default notebook to serve.
   */
  export const EMPTY_NOTEBOOK: ServerContents.IModel = {
    name: 'untitled.ipynb',
    path: 'untitled.ipynb',
    last_modified: '2021-03-27T18:41:01.243007Z',
    created: '2021-03-27T18:41:01.243007Z',
    content: EMPTY_NB,
    format: 'json',
    mimetype: 'application/json',
    size: JSON.stringify(EMPTY_NB).length,
    writable: true,
    type: 'notebook'
  };
}
