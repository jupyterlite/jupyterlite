import { Contents as ServerContents } from '@jupyterlab/services';

import { Token } from '@lumino/coreutils';

/**
 * The token for the settings service.
 */
export const IContents = new Token<IContents>('@jupyterlite/contents:IContents');

/**
 * The interface for the contents service.
 */
export interface IContents {
  /**
   * A promise that resolves after the contents have been full initialized.
   */
  ready: Promise<void>;

  /**
   * Create a new untitled file or directory in the specified directory path.
   *
   * @param options: The options used to create the file.
   *
   * @returns A promise which resolves with the created file content when the file is created.
   */
  newUntitled(
    options?: ServerContents.ICreateOptions
  ): Promise<ServerContents.IModel | null>;

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
  copy(path: string, toDir: string): Promise<ServerContents.IModel>;

  /**
   * Get a file or directory.
   *
   * @param path: The path to the file.
   * @param options: The options used to fetch the file.
   *
   * @returns A promise which resolves with the file content.
   */
  get(
    path: string,
    options?: ServerContents.IFetchOptions
  ): Promise<ServerContents.IModel | null>;

  /**
   * Rename a file or directory.
   *
   * @param oldLocalPath - The original file path.
   * @param newLocalPath - The new file path.
   *
   * @returns A promise which resolves with the new file content model when the file is renamed.
   */
  rename(oldLocalPath: string, newLocalPath: string): Promise<ServerContents.IModel>;

  /**
   * Save a file.
   *
   * @param path - The desired file path.
   * @param options - Optional overrides to the model.
   *
   * @returns A promise which resolves with the file content model when the file is saved.
   */
  save(
    path: string,
    options?: Partial<ServerContents.IModel>
  ): Promise<ServerContents.IModel | null>;

  /**
   * Delete a file.
   *
   * @param path - The path to the file.
   */
  delete(path: string): Promise<void>;

  /**
   * Create a checkpoint for a file.
   *
   * @param path - The path of the file.
   *
   * @returns A promise which resolves with the new checkpoint model when the
   *   checkpoint is created.
   */
  createCheckpoint(path: string): Promise<ServerContents.ICheckpointModel>;

  /**
   * List available checkpoints for a file.
   *
   * @param path - The path of the file.
   *
   * @returns A promise which resolves with a list of checkpoint models for
   *    the file.
   */
  listCheckpoints(path: string): Promise<ServerContents.ICheckpointModel[]>;

  /**
   * Restore a file to a known checkpoint state.
   *
   * @param path - The path of the file.
   * @param checkpointID - The id of the checkpoint to restore.
   *
   * @returns A promise which resolves when the checkpoint is restored.
   */
  restoreCheckpoint(path: string, checkpointID: string): Promise<void>;

  /**
   * Delete a checkpoint for a file.
   *
   * @param path - The path of the file.
   * @param checkpointID - The id of the checkpoint to delete.
   *
   * @returns A promise which resolves when the checkpoint is deleted.
   */
  deleteCheckpoint(path: string, checkpointID: string): Promise<void>;
}

/**
 * Commonly-used mimetypes
 */
export namespace MIME {
  export const JS = 'application/javascript';
  export const JSON = 'application/json';
  export const MANIFEST_JSON = 'application/manifest+json';
  export const PLAIN_TEXT = 'text/plain';
  export const PYTHON = 'application/x-python-code';
  export const SVG = 'image/svg+xml';
  export const XML = 'application/xml';

  /**
   * A list of mime types of common text file types
   */
  export const KNOWN_TEXT_TYPES = new Set([
    JS,
    JSON,
    MANIFEST_JSON,
    PLAIN_TEXT,
    PYTHON,
    SVG,
    XML,
  ]);

  export const OCTET_STREAM = 'octet/stream';
}
