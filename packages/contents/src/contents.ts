import {
  Contents as ServerContents,
  ServerConnection
} from '@jupyterlab/services';

import { INotebookContent } from '@jupyterlab/nbformat';

import { ModelDB } from '@jupyterlab/observables';

import { PathExt } from '@jupyterlab/coreutils';

import { ISignal, Signal } from '@lumino/signaling';

import localforage from 'localforage';

import { IContents } from './tokens';

/**
 * A class to handle requests to /api/contents
 */
export class Contents implements IContents {
  /**
   * A signal emitted when the file has changed.
   */
  get fileChanged(): ISignal<
    ServerContents.IManager,
    ServerContents.IChangedArgs
  > {
    return this._fileChanged;
  }

  /**
   * Test whether the manager has been disposed.
   */
  get isDisposed(): boolean {
    return this._isDisposed;
  }

  /**
   * Return the server settings.
   */
  get serverSettings(): ServerConnection.ISettings {
    // TODO: placeholder
    return ServerConnection.makeSettings();
  }

  /**
   * Dispose of the resources held by the manager.
   */
  dispose(): void {
    throw new Error('Method not implemented.');
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
  ): Promise<ServerContents.IModel> {
    const name = options?.path ?? `Untitled${Contents._counter++ || ''}.ipynb`;
    const created = new Date().toISOString();
    const isFile = PathExt.extname(options?.path ?? '') !== '.ipynb';
    const file: ServerContents.IModel = {
      name,
      path: name,
      last_modified: created,
      created,
      format: isFile ? 'text' : 'json',
      mimetype: isFile ? '' : 'application/json',
      content: null,
      size: undefined,
      writable: true,
      type: options?.type ?? 'notebook'
    };
    await this._storage.setItem(name, file);
    return file;
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
  ): Promise<ServerContents.IModel> {
    // only handle flat for now
    if (path === '') {
      const content: ServerContents.IModel[] = [];
      await this._storage.iterate(item => {
        const file = (item as unknown) as ServerContents.IModel;
        content.push(file);
      });
      return {
        name: '',
        path: '',
        last_modified: new Date(0).toISOString(),
        created: new Date(0).toISOString(),
        format: 'json',
        mimetype: 'application/json',
        content,
        size: undefined,
        writable: true,
        type: 'directory'
      };
    }
    // remove leading slash
    path = path.slice(1);
    const item = await this._storage.getItem(path);
    if (!item) {
      throw Error(`Could not find file with path ${path}`);
    }
    const model = (item as unknown) as ServerContents.IModel;
    if (!options?.content) {
      return {
        ...model,
        content: null,
        size: undefined
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
    const item = await this._storage.getItem(oldLocalPath);
    if (!item) {
      throw Error(`Could not find file with path ${oldLocalPath}`);
    }
    const file = (item as unknown) as ServerContents.IModel;
    const modified = new Date().toISOString();
    const newFile = {
      ...file,
      name: newLocalPath,
      path: newLocalPath,
      last_modified: modified
    };
    await this._storage.setItem(newLocalPath, newFile);
    // remove the old file
    await this._storage.removeItem(oldLocalPath);
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
  ): Promise<ServerContents.IModel> {
    let item = (await this._storage.getItem(path)) as ServerContents.IModel;
    if (!item) {
      item = await this.newUntitled({ path });
    }
    // override with the new values
    const modified = new Date().toISOString();
    item = {
      ...item,
      ...options,
      last_modified: modified
    };

    // process the file if coming from an upload
    const ext = PathExt.extname(options.name ?? '');
    if (options.content && options.format === 'base64') {
      const content = atob(options.content);
      const nb = ext === '.ipynb';
      item = {
        ...item,
        content: nb ? JSON.parse(content) : content,
        format: nb ? 'json' : 'text',
        type: nb ? 'notebook' : 'file'
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
    return this._storage.removeItem(path);
  }

  /**
   * Create a checkpoint for a file.
   *
   * @param path - The path of the file.
   *
   * @returns A promise which resolves with the new checkpoint model when the
   *   checkpoint is created.
   */
  async createCheckpoint(
    path: string
  ): Promise<ServerContents.ICheckpointModel> {
    console.warn('TODO: implement createCheckpoint');
    return Private.DEFAULT_CHECKPOINTS[0];
  }

  /**
   * List available checkpoints for a file.
   *
   * @param path - The path of the file.
   *
   * @returns A promise which resolves with a list of checkpoint models for
   *    the file.
   */
  async listCheckpoints(
    path: string
  ): Promise<ServerContents.ICheckpointModel[]> {
    console.warn('TODO: implement listCheckpoints');
    return Private.DEFAULT_CHECKPOINTS;
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
    console.warn('TODO: implement listCheckpoints');
    return;
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
    console.warn('TODO: implement deleteCheckpoint');
    return;
  }

  /**
   * Add an `IDrive` to the manager.
   */
  addDrive(drive: ServerContents.IDrive): void {
    throw new Error('Method not implemented.');
  }

  /**
   * Given a path of the form `drive:local/portion/of/it.txt`
   * get the local part of it.
   *
   * @param path: the path.
   *
   * @returns The local part of the path.
   */
  localPath(path: string): string {
    throw new Error('Method not implemented.');
  }

  /**
   * Normalize a global path. Reduces '..' and '.' parts, and removes
   * leading slashes from the local part of the path, while retaining
   * the drive name if it exists.
   *
   * @param path: the path.
   *
   * @returns The normalized path.
   */
  normalize(path: string): string {
    throw new Error('Method not implemented.');
  }

  /**
   * Resolve a global path, starting from the root path. Behaves like
   * posix-path.resolve, with 3 differences:
   *  - will never prepend cwd
   *  - if root has a drive name, the result is prefixed with "<drive>:"
   *  - before adding drive name, leading slashes are removed
   *
   * @param path: the path.
   *
   * @returns The normalized path.
   */
  resolvePath(root: string, path: string): string {
    throw new Error('Method not implemented.');
  }

  /**
   * Given a path of the form `drive:local/portion/of/it.txt`
   * get the name of the drive. If the path is missing
   * a drive portion, returns an empty string.
   *
   * @param path: the path.
   *
   * @returns The drive name for the path, or the empty string.
   */
  driveName(path: string): string {
    throw new Error('Method not implemented.');
  }

  /**
   * Given a path, get a ModelDB.IFactory from the
   * relevant backend. Returns `null` if the backend
   * does not provide one.
   */
  getModelDBFactory(path: string): ModelDB.IFactory | null {
    throw new Error('Method not implemented.');
  }

  /**
   * Get an encoded download url given a file path.
   *
   * @param path - An absolute POSIX file path on the server.
   *
   * #### Notes
   * It is expected that the path contains no relative paths.
   *
   * The returned URL may include a query parameter.
   */
  getDownloadUrl(path: string): Promise<string> {
    throw new Error('Method not implemented.');
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
  copy(path: string, toDir: string): Promise<ServerContents.IModel> {
    throw new Error('Method not implemented.');
  }

  private _isDisposed = false;
  private _fileChanged = new Signal<this, ServerContents.IChangedArgs>(this);
  private _storage = localforage.createInstance({
    name: 'JupyterLite Storage',
    description: 'Offline Storage for Notebooks and Files',
    version: 1,
    storeName: 'files'
  });
  private static _counter = 0;
}

/**
 * A namespace for private data.
 */
namespace Private {
  /**
   * The default checkpoints.
   */
  export const DEFAULT_CHECKPOINTS = [
    { id: 'checkpoint', last_modified: '2021-03-27T13:51:59.816052Z' }
  ];

  /**
   * The content for an empty notebook.
   */
  export const EMPTY_NB: INotebookContent = {
    metadata: {
      orig_nbformat: 4
    },
    nbformat_minor: 4,
    nbformat: 4,
    cells: []
  };
}
