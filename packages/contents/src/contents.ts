import { PageConfig, URLExt } from '@jupyterlab/coreutils';

import { Contents as ServerContents } from '@jupyterlab/services';

import { INotebookContent } from '@jupyterlab/nbformat';

import { PathExt } from '@jupyterlab/coreutils';

import type localforage from 'localforage';

import { IContents, MIME, FILE } from './tokens';
import { PromiseDelegate } from '@lumino/coreutils';

export type IModel = ServerContents.IModel;

/**
 * The name of the local storage.
 */
const DEFAULT_STORAGE_NAME = 'JupyterLite Storage';

/**
 * The number of checkpoints to save.
 */
const N_CHECKPOINTS = 5;

/**
 * A class to handle requests to /api/contents
 */
export class Contents implements IContents {
  /**
   * Construct a new localForage-powered contents provider
   */
  constructor(options: Contents.IOptions) {
    this._localforage = options.localforage;
    this._storageName = options.storageName || DEFAULT_STORAGE_NAME;
    this._storageDrivers = options.storageDrivers || null;
    this._ready = new PromiseDelegate();
  }

  /**
   * Finish any initialization after server has started and all extensions are applied.
   */
  async initialize() {
    await this.initStorage();
    this._ready.resolve(void 0);
  }

  /**
   * Initialize all storage instances
   */
  protected async initStorage(): Promise<void> {
    this._storage = this.createDefaultStorage();
    this._counters = this.createDefaultCounters();
    this._checkpoints = this.createDefaultCheckpoints();
  }

  /**
   * A promise that resolves once all storage is fully initialized.
   */
  get ready(): Promise<void> {
    return this._ready.promise;
  }

  /**
   * A lazy reference to the underlying storage.
   */
  protected get storage(): Promise<LocalForage> {
    return this.ready.then(() => this._storage as LocalForage);
  }

  /**
   * A lazy reference to the underlying counters.
   */
  protected get counters(): Promise<LocalForage> {
    return this.ready.then(() => this._counters as LocalForage);
  }

  /**
   * A lazy reference to the underlying checkpoints.
   */
  protected get checkpoints(): Promise<LocalForage> {
    return this.ready.then(() => this._checkpoints as LocalForage);
  }

  /**
   * Get default options for localForage instances
   */
  protected get defaultStorageOptions(): LocalForageOptions {
    const driver =
      this._storageDrivers && this._storageDrivers.length ? this._storageDrivers : null;
    return {
      version: 1,
      name: this._storageName,
      ...(driver ? { driver } : {}),
    };
  }

  /**
   * Initialize the default storage for contents.
   */
  protected createDefaultStorage(): LocalForage {
    return this._localforage.createInstance({
      description: 'Offline Storage for Notebooks and Files',
      storeName: 'files',
      ...this.defaultStorageOptions,
    });
  }

  /**
   * Initialize the default storage for counting file suffixes.
   */
  protected createDefaultCounters(): LocalForage {
    return this._localforage.createInstance({
      description: 'Store the current file suffix counters',
      storeName: 'counters',
      ...this.defaultStorageOptions,
    });
  }

  /**
   * Create the default checkpoint storage.
   */
  protected createDefaultCheckpoints(): LocalForage {
    return this._localforage.createInstance({
      description: 'Offline Storage for Checkpoints',
      storeName: 'checkpoints',
      ...this.defaultStorageOptions,
    });
  }

  /**
   * Create a new untitled file or directory in the specified directory path.
   *
   * @param options: The options used to create the file.
   *
   * @returns A promise which resolves with the created file content when the file is created.
   */
  async newUntitled(options?: ServerContents.ICreateOptions): Promise<IModel | null> {
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

    let file: IModel;
    switch (type) {
      case 'directory': {
        const counter = await this._incrementCounter('directory');
        name = `Untitled Folder${counter || ''}`;
        file = {
          name,
          path: `${dirname}${name}`,
          last_modified: created,
          created,
          format: 'json',
          mimetype: '',
          content: null,
          size: 0,
          writable: true,
          type: 'directory',
        };
        break;
      }
      case 'notebook': {
        const counter = await this._incrementCounter('notebook');
        name = name || `Untitled${counter || ''}.ipynb`;
        file = {
          name,
          path: `${dirname}${name}`,
          last_modified: created,
          created,
          format: 'json',
          mimetype: MIME.JSON,
          content: Private.EMPTY_NB,
          size: JSON.stringify(Private.EMPTY_NB).length,
          writable: true,
          type: 'notebook',
        };
        break;
      }
      default: {
        const ext = options?.ext ?? '.txt';
        const counter = await this._incrementCounter('file');
        const mimetype = FILE.getType(ext) || MIME.OCTET_STREAM;

        let format: ServerContents.FileFormat;
        if (FILE.hasFormat(ext, 'text') || mimetype.indexOf('text') !== -1) {
          format = 'text';
        } else if (ext.indexOf('json') !== -1 || ext.indexOf('ipynb') !== -1) {
          format = 'json';
        } else {
          format = 'base64';
        }

        name = name || `untitled${counter || ''}${ext}`;
        file = {
          name,
          path: `${dirname}${name}`,
          last_modified: created,
          created,
          format,
          mimetype,
          content: '',
          size: 0,
          writable: true,
          type: 'file',
        };
        break;
      }
    }

    const key = file.path;
    await (await this.storage).setItem(key, file);
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
  async copy(path: string, toDir: string): Promise<IModel> {
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
    await (await this.storage).setItem(toPath, item);
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
  ): Promise<IModel | null> {
    // remove leading slash
    path = decodeURIComponent(path.replace(/^\//, ''));

    if (path === '') {
      return await this._getFolder(path);
    }

    const storage = await this.storage;
    const item = await storage.getItem(path);
    const serverItem = await this._getServerContents(path, options);

    const model = (item || serverItem) as IModel | null;

    if (!model) {
      return null;
    }

    if (!options?.content) {
      return {
        size: 0,
        ...model,
        content: null,
      };
    }

    // for directories, find all files with the path as the prefix
    if (model.type === 'directory') {
      const contentMap = new Map<string, IModel>();
      await storage.iterate<IModel, void>((file, key) => {
        // use an additional slash to not include the directory itself
        if (key === `${path}/${file.name}`) {
          contentMap.set(file.name, file);
        }
      });

      const serverContents: IModel[] = serverItem
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
        mimetype: MIME.JSON,
        content,
        size: 0,
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
  async rename(oldLocalPath: string, newLocalPath: string): Promise<IModel> {
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
    const storage = await this.storage;
    await storage.setItem(newLocalPath, newFile);
    // remove the old file
    await storage.removeItem(path);
    // remove the corresponding checkpoint
    await (await this.checkpoints).removeItem(path);
    // if a directory, recurse through all children
    if (file.type === 'directory') {
      let child: IModel;
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
  async save(path: string, options: Partial<IModel> = {}): Promise<IModel | null> {
    path = decodeURIComponent(path);

    // process the file if coming from an upload
    const ext = PathExt.extname(options.name ?? '');

    let item: IModel | null = await this.get(path);

    if (!item) {
      item = await this.newUntitled({ path, ext, type: 'file' });
    }

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

    if (options.content && options.format === 'base64') {
      if (ext === '.ipynb') {
        const contentUnescaped = this.unescapeContent(options.content);
        const size = contentUnescaped.length;
        item = {
          ...item,
          content: JSON.parse(contentUnescaped),
          format: 'json',
          type: 'notebook',
          size: size,
        };
      } else if (FILE.hasFormat(ext, 'json')) {
        const contentUnescaped = this.unescapeContent(options.content);
        const size = contentUnescaped.length;
        item = {
          ...item,
          content: JSON.parse(contentUnescaped),
          format: 'json',
          type: 'file',
          size: size,
        };
      } else if (FILE.hasFormat(ext, 'text')) {
        const contentUnescaped = this.unescapeContent(options.content);
        const size = contentUnescaped.length;
        item = {
          ...item,
          content: contentUnescaped,
          format: 'text',
          type: 'file',
          size: size,
        };
      } else {
        item = {
          ...item,
          size: atob(options.content).length,
        };
      }
    }

    await (await this.storage).setItem(path, item);
    return item;
  }

  unescapeContent(content: string): string {
    return decodeURIComponent(escape(atob(content)));
  }

  /**
   * Delete a file from browser storage.
   *
   * Has no effect on server-backed files, which will re-appear with their
   * original timestamp.
   *
   * @param path - The path to the file.
   */
  async delete(path: string): Promise<void> {
    path = decodeURIComponent(path);
    const slashed = `${path}/`;
    const toDelete = (await (await this.storage).keys()).filter(
      (key) => key === path || key.startsWith(slashed)
    );
    await Promise.all(toDelete.map(this.forgetPath, this));
  }

  /**
   * Remove the localForage and checkpoints for a path.
   *
   * @param path - The path to the file
   */
  protected async forgetPath(path: string): Promise<void> {
    await Promise.all([
      (await this.storage).removeItem(path),
      (await this.checkpoints).removeItem(path),
    ]);
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
    const checkpoints = await this.checkpoints;
    path = decodeURIComponent(path);
    const item = await this.get(path, { content: true });
    if (!item) {
      throw Error(`Could not find file with path ${path}`);
    }
    const copies = (((await checkpoints.getItem(path)) as IModel[]) ?? []).filter(
      Boolean
    );
    copies.push(item);
    // keep only a certain amount of checkpoints per file
    if (copies.length > N_CHECKPOINTS) {
      copies.splice(0, copies.length - N_CHECKPOINTS);
    }
    await checkpoints.setItem(path, copies);
    const id = `${copies.length - 1}`;
    return { id, last_modified: (item as IModel).last_modified };
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
    const copies: IModel[] = (await (await this.checkpoints).getItem(path)) || [];
    return copies.filter(Boolean).map(this.normalizeCheckpoint, this);
  }

  protected normalizeCheckpoint(
    model: IModel,
    id: number
  ): ServerContents.ICheckpointModel {
    return { id: id.toString(), last_modified: model.last_modified };
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
    const copies = ((await (await this.checkpoints).getItem(path)) || []) as IModel[];
    const id = parseInt(checkpointID);
    const item = copies[id];
    await (await this.storage).setItem(path, item);
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
    const copies = ((await (await this.checkpoints).getItem(path)) || []) as IModel[];
    const id = parseInt(checkpointID);
    copies.splice(id, 1);
    await (await this.checkpoints).setItem(path, copies);
  }

  /**
   * retrieve the contents for this path from the union of local storage and
   * `api/contents/{path}/all.json`.
   *
   * @param path - The contents path to retrieve
   *
   * @returns A promise which resolves with a Map of contents, keyed by local file name
   */
  private async _getFolder(path: string): Promise<IModel | null> {
    const content = new Map<string, IModel>();
    const storage = await this.storage;
    await storage.iterate<IModel, void>((file, key) => {
      if (key.includes('/')) {
        return;
      }
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
      mimetype: MIME.JSON,
      content: Array.from(content.values()),
      size: 0,
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
  ): Promise<IModel | null> {
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
      mimetype: MIME.PLAIN_TEXT,
      type: 'file',
      writable: true,
      size: 0,
      content: '',
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
        const ext = PathExt.extname(name);

        if (
          model.type === 'notebook' ||
          FILE.hasFormat(ext, 'json') ||
          mimetype?.indexOf('json') !== -1 ||
          path.match(/\.(ipynb|[^/]*json[^/]*)$/)
        ) {
          const contentText = await response.text();
          model = {
            ...model,
            content: JSON.parse(contentText),
            format: 'json',
            mimetype: model.mimetype || MIME.JSON,
            size: contentText.length,
          };
        } else if (FILE.hasFormat(ext, 'text') || mimetype.indexOf('text') !== -1) {
          const contentText = await response.text();
          model = {
            ...model,
            content: contentText,
            format: 'text',
            mimetype: mimetype || MIME.PLAIN_TEXT,
            size: contentText.length,
          };
        } else {
          const contentBytes = await response.arrayBuffer();
          const contentBuffer = new Uint8Array(contentBytes);
          model = {
            ...model,
            content: btoa(contentBuffer.reduce(this.reduceBytesToString, '')),
            format: 'base64',
            mimetype: mimetype || MIME.OCTET_STREAM,
            size: contentBuffer.length,
          };
        }
      }
    }

    return model;
  }

  /**
   * A reducer for turning arbitrary binary into a string
   */
  protected reduceBytesToString = (data: string, byte: number): string => {
    return data + String.fromCharCode(byte);
  };

  /**
   * retrieve the contents for this path from `__index__.json` in the appropriate
   * folder.
   *
   * @param newLocalPath - The new file path.
   *
   * @returns A promise which resolves with a Map of contents, keyed by local file name
   */
  private async _getServerDirectory(path: string): Promise<Map<string, IModel>> {
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
        for (const file of json['content'] as IModel[]) {
          content.set(file.name, file);
        }
      } catch (err) {
        console.warn(
          `don't worry, about ${err}... nothing's broken. If there had been a
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
    const counters = await this.counters;
    const current = ((await counters.getItem(type)) as number) ?? -1;
    const counter = current + 1;
    await counters.setItem(type, counter);
    return counter;
  }

  private _serverContents = new Map<string, Map<string, IModel>>();
  private _storageName: string = DEFAULT_STORAGE_NAME;
  private _storageDrivers: string[] | null = null;
  private _ready: PromiseDelegate<void>;
  private _storage: LocalForage | undefined;
  private _counters: LocalForage | undefined;
  private _checkpoints: LocalForage | undefined;
  private _localforage: typeof localforage;
}

/**
 * A namespace for contents information.
 */
export namespace Contents {
  export interface IOptions {
    /**
     * The name of the storage instance on e.g. IndexedDB, localStorage
     */
    storageName?: string | null;
    storageDrivers?: string[] | null;
    localforage: typeof localforage;
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
