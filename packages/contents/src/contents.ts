import { PageConfig, URLExt } from '@jupyterlab/coreutils';

import { Contents as ServerContents } from '@jupyterlab/services';

import { INotebookContent } from '@jupyterlab/nbformat';

import { PathExt } from '@jupyterlab/coreutils';

import localforage from 'localforage';

import { IContents } from './tokens';

/**
 * The name of the local storage.
 */
const DEFAULT_STORAGE_NAME = 'JupyterLite Storage';

/**
 * The number of checkpoints to save.
 */
const N_CHECKPOINTS = 5;

/**
 * A list of mime types of text files
 */
const EXTRA_TEXT_MIME_TYPES = new Set([
  'application/javascript',
  'application/json',
  'application/manifest+json',
  'application/x-python-code',
  'application/xml',
  'image/svg+xml',
]);

/**
 * A class to handle requests to /api/contents
 */
export class Contents implements IContents {
  /**
   * Construct a new localForage-powered contents provider
   */
  constructor(options?: Contents.IOptions) {
    this._storageName = (options || {}).contentsStorageName || DEFAULT_STORAGE_NAME;
    this._storage = this.createDefaultStorage();
    this._counters = this.createDefaultCounters();
    this._checkpoints = this.createDefaultCheckpoints();
  }

  /**
   * Initialize the default storage for contents.
   */
  protected createDefaultStorage(): LocalForage {
    return localforage.createInstance({
      name: this._storageName,
      description: 'Offline Storage for Notebooks and Files',
      storeName: 'files',
      version: 1,
    });
  }

  /**
   * Initialize the default storage for counting file suffixes.
   */
  protected createDefaultCounters(): LocalForage {
    return localforage.createInstance({
      name: this._storageName,
      description: 'Store the current file suffix counters',
      storeName: 'counters',
      version: 1,
    });
  }

  /**
   * Create the default checkpoint storage.
   */
  protected createDefaultCheckpoints(): LocalForage {
    return localforage.createInstance({
      name: this._storageName,
      description: 'Offline Storage for Checkpoints',
      storeName: 'checkpoints',
      version: 1,
    });
  }

  /**
   * Create a new untitled file or directory in the specified directory path.
   *
   * @param options: The options used to create the file.
   *
   * @returns A promise which resolves with the created file content when the file is created.
   */
  async newUntitled(
    options?: ServerContents.ICreateOptions
  ): Promise<ServerContents.IModel | null> {
    const path = options?.path ?? '';
    const type = options?.type ?? 'notebook';
    const created = new Date().toISOString();

    let dirname = PathExt.dirname(path);
    const basename = PathExt.basename(path);
    const extname = PathExt.extname(path);
    const item = await this.get(dirname);

    // handle the case of "Save As", where the path points to the new file
    // to create, e.g. subfolder/example-copy.ipynb
    let name = '';
    if (path && !extname && item) {
      // directory
      dirname = `${path}/`;
      name = '';
    } else if (dirname && basename) {
      // file in a subfolder
      dirname = `${dirname}/`;
      name = basename;
    } else {
      // file at the top level
      dirname = '';
      name = path;
    }

    let file: ServerContents.IModel;
    switch (type) {
      case 'directory': {
        const counter = await this._incrementCounter('directory');
        name = `Untitled Folder${counter || ''}`;
        file = {
          name,
          path: `${dirname}${name}`,
          last_modified: created,
          created,
          format: 'text',
          mimetype: '',
          content: null,
          size: undefined,
          writable: true,
          type: 'directory',
        };
        break;
      }
      case 'file': {
        const ext = options?.ext ?? '.txt';
        const counter = await this._incrementCounter('file');
        name = name || `untitled${counter || ''}${ext}`;
        file = {
          name,
          path: `${dirname}${name}`,
          last_modified: created,
          created,
          format: 'text',
          // TODO: handle mimetypes
          mimetype: 'text/plain',
          content: '',
          size: 0,
          writable: true,
          type: 'file',
        };
        break;
      }
      default: {
        const counter = await this._incrementCounter('notebook');
        name = name || `Untitled${counter || ''}.ipynb`;
        file = {
          name,
          path: `${dirname}${name}`,
          last_modified: created,
          created,
          format: 'json',
          mimetype: 'application/json',
          content: Private.EMPTY_NB,
          size: JSON.stringify(Private.EMPTY_NB).length,
          writable: true,
          type: 'notebook',
        };
        break;
      }
    }

    const key = file.path;
    await this._storage.setItem(key, file);
    return file;
  }

  /**
   * Copy a file into a given directory.
   *
   * @param path - The original file path.
   * @param toDir - The destination directory path.
   *
   * @returns A promise which resolves with the new contents model when the
   *  file is copied.
   *
   * #### Notes
   * The server will select the name of the copied file.
   */
  async copy(path: string, toDir: string): Promise<ServerContents.IModel> {
    let name = PathExt.basename(path);
    toDir = toDir === '' ? '' : `${toDir.slice(1)}/`;
    // TODO: better handle naming collisions with existing files
    while (await this.get(`${toDir}${name}`, { content: true })) {
      const ext = PathExt.extname(name);
      const base = name.replace(ext, '');
      name = `${base} (copy)${ext}`;
    }
    const toPath = `${toDir}${name}`;
    let item = await this.get(path, { content: true });
    if (!item) {
      throw Error(`Could not find file with path ${path}`);
    }
    item = {
      ...item,
      name,
      path: toPath,
    };
    await this._storage.setItem(toPath, item);
    return item;
  }

  /**
   * Get a file or directory.
   *
   * @param path: The path to the file.
   * @param options: The options used to fetch the file.
   *
   * @returns A promise which resolves with the file content.
   */
  async get(
    path: string,
    options?: ServerContents.IFetchOptions
  ): Promise<ServerContents.IModel | null> {
    // remove leading slash
    path = decodeURIComponent(path.replace(/^\//, ''));

    if (path === '') {
      return await this._getFolder(path);
    }

    const item = await this._storage.getItem(path);
    const serverItem = await this._getServerContents(path, options);

    const model = (item || serverItem) as ServerContents.IModel | null;

    if (!model) {
      return null;
    }

    if (!options?.content) {
      return {
        ...model,
        content: null,
        size: undefined,
      };
    }

    // for directories, find all files with the path as the prefix
    if (model.type === 'directory') {
      const contentMap = new Map<string, ServerContents.IModel>();
      await this._storage.iterate((item, key) => {
        const file = item as unknown as ServerContents.IModel;
        // use an additional slash to not include the directory itself
        if (key === `${path}/${file.name}`) {
          contentMap.set(file.name, file);
        }
      });

      const serverContents: ServerContents.IModel[] = serverItem
        ? serverItem.content
        : Array.from((await this._getServerDirectory(path)).values());
      for (const file of serverContents) {
        if (!contentMap.has(file.name)) {
          contentMap.set(file.name, file);
        }
      }

      const content = [...contentMap.values()];

      return {
        name: PathExt.basename(path),
        path,
        last_modified: model.last_modified,
        created: model.created,
        format: 'json',
        mimetype: 'application/json',
        content,
        size: undefined,
        writable: true,
        type: 'directory',
      };
    }
    return model;
  }

  /**
   * Rename a file or directory.
   *
   * @param oldLocalPath - The original file path.
   * @param newLocalPath - The new file path.
   *
   * @returns A promise which resolves with the new file content model when the file is renamed.
   */
  async rename(
    oldLocalPath: string,
    newLocalPath: string
  ): Promise<ServerContents.IModel> {
    const path = decodeURIComponent(oldLocalPath);
    const file = await this.get(path, { content: true });
    if (!file) {
      throw Error(`Could not find file with path ${path}`);
    }
    const modified = new Date().toISOString();
    const name = PathExt.basename(newLocalPath);
    const newFile = {
      ...file,
      name,
      path: newLocalPath,
      last_modified: modified,
    };
    await this._storage.setItem(newLocalPath, newFile);
    // remove the old file
    await this._storage.removeItem(path);
    // remove the corresponding checkpoint
    await this._checkpoints.removeItem(path);
    // if a directory, recurse through all children
    if (file.type === 'directory') {
      let child: ServerContents.IModel;
      for (child of file.content) {
        await this.rename(
          URLExt.join(oldLocalPath, child.name),
          URLExt.join(newLocalPath, child.name)
        );
      }
    }

    return newFile;
  }

  /**
   * Save a file.
   *
   * @param path - The desired file path.
   * @param options - Optional overrides to the model.
   *
   * @returns A promise which resolves with the file content model when the file is saved.
   */
  async save(
    path: string,
    options: Partial<ServerContents.IModel> = {}
  ): Promise<ServerContents.IModel | null> {
    path = decodeURIComponent(path);
    let item = (await this.get(path)) || (await this.newUntitled({ path }));
    if (!item) {
      return null;
    }
    // override with the new values
    const modified = new Date().toISOString();
    item = {
      ...item,
      ...options,
      last_modified: modified,
    };

    // process the file if coming from an upload
    const ext = PathExt.extname(options.name ?? '');
    if (options.content && options.format === 'base64') {
      // TODO: keep base64 if not a text file (image)
      const content = decodeURIComponent(escape(atob(options.content)));
      const nb = ext === '.ipynb';
      item = {
        ...item,
        content: nb ? JSON.parse(content) : content,
        format: nb ? 'json' : 'text',
        type: nb ? 'notebook' : 'file',
      };
    }

    await this._storage.setItem(path, item);
    return item;
  }

  /**
   * Delete a file.
   *
   * @param path - The path to the file.
   */
  async delete(path: string): Promise<void> {
    path = decodeURIComponent(path);
    const toDelete: string[] = [];
    // handle deleting directories recursively
    await this._storage.iterate((item, key) => {
      if (key === path || key.startsWith(`${path}/`)) {
        toDelete.push(key);
      }
    });
    await Promise.all(
      toDelete.map(async (p) => {
        return Promise.all([
          this._storage.removeItem(p),
          this._checkpoints.removeItem(p),
        ]);
      })
    );
  }

  /**
   * Create a checkpoint for a file.
   *
   * @param path - The path of the file.
   *
   * @returns A promise which resolves with the new checkpoint model when the
   *   checkpoint is created.
   */
  async createCheckpoint(path: string): Promise<ServerContents.ICheckpointModel> {
    path = decodeURIComponent(path);
    const item = await this.get(path, { content: true });
    if (!item) {
      throw Error(`Could not find file with path ${path}`);
    }
    const copies = (
      ((await this._checkpoints.getItem(path)) as ServerContents.IModel[]) ?? []
    ).filter((item) => !!item);
    copies.push(item);
    // keep only a certain amount of checkpoints per file
    if (copies.length > N_CHECKPOINTS) {
      copies.splice(0, copies.length - N_CHECKPOINTS);
    }
    await this._checkpoints.setItem(path, copies);
    const id = `${copies.length - 1}`;
    return {
      id,
      last_modified: (item as ServerContents.IModel).last_modified,
    };
  }

  /**
   * List available checkpoints for a file.
   *
   * @param path - The path of the file.
   *
   * @returns A promise which resolves with a list of checkpoint models for
   *    the file.
   */
  async listCheckpoints(path: string): Promise<ServerContents.ICheckpointModel[]> {
    const copies = ((await this._checkpoints.getItem(path)) ||
      []) as ServerContents.IModel[];
    return copies
      .filter((item) => !!item)
      .map((file, id) => {
        return {
          id: id.toString(),
          last_modified: file.last_modified,
        };
      });
  }

  /**
   * Restore a file to a known checkpoint state.
   *
   * @param path - The path of the file.
   * @param checkpointID - The id of the checkpoint to restore.
   *
   * @returns A promise which resolves when the checkpoint is restored.
   */
  async restoreCheckpoint(path: string, checkpointID: string): Promise<void> {
    path = decodeURIComponent(path);
    const copies = ((await this._checkpoints.getItem(path)) ||
      []) as ServerContents.IModel[];
    const id = parseInt(checkpointID);
    const item = copies[id];
    await this._storage.setItem(path, item);
  }

  /**
   * Delete a checkpoint for a file.
   *
   * @param path - The path of the file.
   * @param checkpointID - The id of the checkpoint to delete.
   *
   * @returns A promise which resolves when the checkpoint is deleted.
   */
  async deleteCheckpoint(path: string, checkpointID: string): Promise<void> {
    path = decodeURIComponent(path);
    const copies = ((await this._checkpoints.getItem(path)) ||
      []) as ServerContents.IModel[];
    const id = parseInt(checkpointID);
    copies.splice(id, 1);
    await this._checkpoints.setItem(path, copies);
  }

  /**
   * retrieve the contents for this path from the union of local storage and
   * `api/contents/{path}/all.json`.
   *
   * @param path - The contents path to retrieve
   *
   * @returns A promise which resolves with a Map of contents, keyed by local file name
   */
  private async _getFolder(path: string): Promise<ServerContents.IModel | null> {
    const content = new Map<string, ServerContents.IModel>();
    await this._storage.iterate((item, key) => {
      if (key.includes('/')) {
        return;
      }
      const file = item as unknown as ServerContents.IModel;
      content.set(file.path, file);
    });

    // layer in contents that don't have local overwrites
    for (const file of (await this._getServerDirectory(path)).values()) {
      if (!content.has(file.path)) {
        content.set(file.path, file);
      }
    }

    if (path && content.size === 0) {
      return null;
    }

    return {
      name: '',
      path,
      last_modified: new Date(0).toISOString(),
      created: new Date(0).toISOString(),
      format: 'json',
      mimetype: 'application/json',
      content: Array.from(content.values()),
      size: undefined,
      writable: true,
      type: 'directory',
    };
  }

  /**
   * Attempt to recover the model from `{:path}/__all__.json` file, fall back to
   * deriving the model (including content) off the file in `/files/`. Otherwise
   * return `null`.
   */
  private async _getServerContents(
    path: string,
    options?: ServerContents.IFetchOptions
  ): Promise<ServerContents.IModel | null> {
    const name = PathExt.basename(path);
    const parentContents = await this._getServerDirectory(URLExt.join(path, '..'));
    let model = parentContents.get(name);
    if (!model) {
      return null;
    }
    model = model || {
      name,
      path,
      last_modified: new Date(0).toISOString(),
      created: new Date(0).toISOString(),
      format: 'text',
      mimetype: 'text/plain',
      type: 'file',
      writable: true,
      content: null,
    };

    if (options?.content) {
      if (model.type === 'directory') {
        const serverContents = await this._getServerDirectory(path);
        model = { ...model, content: Array.from(serverContents.values()) };
      } else {
        const fileUrl = URLExt.join(PageConfig.getBaseUrl(), 'files', path);
        const response = await fetch(fileUrl);
        if (!response.ok) {
          return null;
        }
        const mimetype = model.mimetype || response.headers.get('Content-Type');

        if (
          model.type === 'notebook' ||
          mimetype?.indexOf('json') !== -1 ||
          path.match(/\.(ipynb|[^/]*json[^/]*)$/)
        ) {
          model = {
            ...model,
            content: await response.json(),
            format: 'json',
            mimetype: model.mimetype || 'application/json',
          };
        } else if (
          mimetype.indexOf('text') !== -1 ||
          EXTRA_TEXT_MIME_TYPES.has(mimetype)
        ) {
          model = {
            ...model,
            content: await response.text(),
            format: 'text',
            mimetype: mimetype || 'text/plain',
          };
        } else {
          const byteToString = (data: string, byte: number) =>
            data + String.fromCharCode(byte);
          const content = btoa(
            new Uint8Array(await response.arrayBuffer()).reduce(byteToString, '')
          );
          model = {
            ...model,
            content,
            format: 'base64',
            mimetype: mimetype || 'octet/stream',
          };
        }
      }
    }

    return model;
  }

  /**
   * retrieve the contents for this path from `__index__.json` in the appropriate
   * folder.
   *
   * @param newLocalPath - The new file path.
   *
   * @returns A promise which resolves with a Map of contents, keyed by local file name
   */
  private async _getServerDirectory(
    path: string
  ): Promise<Map<string, ServerContents.IModel>> {
    const content = this._serverContents.get(path) || new Map();

    if (!this._serverContents.has(path)) {
      const apiURL = URLExt.join(
        PageConfig.getBaseUrl(),
        'api/contents',
        path,
        'all.json'
      );

      try {
        const response = await fetch(apiURL);
        const json = JSON.parse(await response.text());
        for (const file of json['content'] as ServerContents.IModel[]) {
          content.set(file.name, file);
        }
      } catch (err) {
        console.warn(
          `don't worry, about ${err}... nothing's broken. if there had been a
          file at ${apiURL}, you might see some more files.`
        );
      }
      this._serverContents.set(path, content);
    }

    return content;
  }

  /**
   * Increment the counter for a given file type.
   * Used to avoid collisions when creating new untitled files.
   *
   * @param type The file type to increment the counter for.
   */
  private async _incrementCounter(type: ServerContents.ContentType): Promise<number> {
    const current = ((await this._counters.getItem(type)) as number) ?? -1;
    const counter = current + 1;
    await this._counters.setItem(type, counter);
    return counter;
  }

  private _serverContents = new Map<string, Map<string, ServerContents.IModel>>();
  private _storageName: string = DEFAULT_STORAGE_NAME;
  private _storage: LocalForage;
  private _counters: LocalForage;
  private _checkpoints: LocalForage;
}

/**
 * A namespace for contents information.
 */
export namespace Contents {
  export interface IOptions {
    /**
     * The name of the storage instance on e.g. IndexedDB, localStorage
     */
    contentsStorageName: string;
  }
}

/**
 * A namespace for private data.
 */
namespace Private {
  /**
   * The content for an empty notebook.
   */
  export const EMPTY_NB: INotebookContent = {
    metadata: {
      orig_nbformat: 4,
    },
    nbformat_minor: 4,
    nbformat: 4,
    cells: [],
  };
}
