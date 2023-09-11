import { IDisposable } from '@lumino/disposable';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { PageConfig } from '@jupyterlab/coreutils';
import mime from 'mime';

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
  export const JSON = 'application/json';
  export const PLAIN_TEXT = 'text/plain';
  export const OCTET_STREAM = 'octet/stream';
}

/**
 * A namespace for file constructs.
 */
export namespace FILE {
  /**
   * Build-time configured file types.
   */
  const TYPES: Record<string, Partial<IRenderMime.IFileType>> = JSON.parse(
    PageConfig.getOption('fileTypes') || '{}'
  );

  /**
   * Get a mimetype (or fallback).
   */
  export function getType(ext: string, defaultType: string | null = null): string {
    ext = ext.toLowerCase();
    for (const fileType of Object.values(TYPES)) {
      for (const fileExt of fileType.extensions || []) {
        if (fileExt === ext && fileType.mimeTypes && fileType.mimeTypes.length) {
          return fileType.mimeTypes[0];
        }
      }
    }

    return mime.getType(ext) || defaultType || MIME.OCTET_STREAM;
  }

  /**
   * Determine whether the given extension matches a given fileFormat.
   */
  export function hasFormat(
    ext: string,
    fileFormat: 'base64' | 'text' | 'json'
  ): boolean {
    ext = ext.toLowerCase();
    for (const fileType of Object.values(TYPES)) {
      if (fileType.fileFormat !== fileFormat) {
        continue;
      }
      for (const fileExt of fileType.extensions || []) {
        if (fileExt === ext) {
          return true;
        }
      }
    }
    return false;
  }
}

/**
 * The token for the BroadcastChannel broadcaster.
 */
export const IBroadcastChannelWrapper = new Token<IBroadcastChannelWrapper>(
  '@jupyterlite/contents:IBroadcastChannelWrapper'
);

export interface IBroadcastChannelWrapper extends IDisposable {
  enable(): void;
  disable(): void;
  enabled: boolean;
}
