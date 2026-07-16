// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { PathExt } from '@jupyterlab/coreutils';

import type { Contents } from '@jupyterlab/services';
import { ServerConnection } from '@jupyterlab/services';

import type { ISignal } from '@lumino/signaling';
import { Signal } from '@lumino/signaling';

import { MIME } from './tokens';

type IModel = Contents.IModel;

const encoder = new TextEncoder();

/**
 * The name of the debug drive.
 */
export const DEBUG_DRIVE_NAME = 'JupyterLite';

/**
 * The configuration files exposed by the debug drive.
 */
const CONFIGURATION_FILES = [
  'jupyter-lite.json',
  'jupyter-lite.ipynb',
  'overrides.json',
];

/**
 * A read-only drive exposing generated JupyterLite configuration files.
 */
export class DebugDrive implements Contents.IDrive {
  /**
   * Construct a new debug drive.
   */
  constructor(options: DebugDrive.IOptions) {
    this._serverSettings = options.serverSettings ?? ServerConnection.makeSettings();
    this.ready = this._loadConfigurationFiles(options.rootUrl, options.applicationUrl);
  }

  /**
   * A promise that resolves when the configuration files are ready.
   */
  readonly ready: Promise<void>;

  /**
   * Dispose the drive.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._isDisposed = true;
    for (const url of this._objectUrls) {
      URL.revokeObjectURL(url);
    }
    this._objectUrls.clear();
    Signal.clearData(this);
  }

  /**
   * Whether the drive is disposed.
   */
  get isDisposed(): boolean {
    return this._isDisposed;
  }

  /**
   * The name of the drive.
   */
  get name(): string {
    return DEBUG_DRIVE_NAME;
  }

  /**
   * The server settings of the drive.
   */
  get serverSettings(): ServerConnection.ISettings {
    return this._serverSettings;
  }

  /**
   * A signal emitted when a file operation takes place.
   */
  get fileChanged(): ISignal<Contents.IDrive, Contents.IChangedArgs> {
    return this._fileChanged;
  }

  /**
   * Get a file or directory as a read-only model.
   */
  async get(path: string, options?: Contents.IFetchOptions): Promise<IModel> {
    await this.ready;
    path = Private.normalizePath(path);

    const file = this._files.get(path);
    if (file) {
      const format = options?.format ?? file.format;
      const content = options?.content
        ? Private.convertContent(file.content, format)
        : null;
      return {
        name: file.name,
        path,
        last_modified: this._timestamp,
        created: this._timestamp,
        format,
        mimetype: file.mimetype,
        content,
        size: encoder.encode(file.content).length,
        writable: false,
        type: file.type,
      };
    }

    const directories = Private.virtualDirectories(this._files);
    if (!directories.has(path)) {
      throw new Error(`Could not find content with path ${path}`);
    }

    let content: IModel[] | null = null;
    if (options?.content) {
      const children = new Map<string, IModel>();
      for (const directory of directories) {
        if (directory && PathExt.dirname(directory) === path) {
          const model = Private.directoryModel(directory, null, this._timestamp);
          children.set(model.name, model);
        }
      }
      for (const entry of this._files.values()) {
        if (PathExt.dirname(entry.path) === path) {
          children.set(entry.name, Private.fileMetadata(entry, this._timestamp));
        }
      }
      content = Array.from(children.values()).sort((a, b) =>
        a.name.localeCompare(b.name),
      );
    }
    return Private.directoryModel(path, content, this._timestamp);
  }

  /**
   * Get a download URL for a file.
   */
  async getDownloadUrl(path: string): Promise<string> {
    await this.ready;
    path = Private.normalizePath(path);

    const file = this._files.get(path);
    if (!file) {
      throw new Error(`Cannot download content with path ${path}`);
    }
    const blob = new Blob([file.content], { type: file.mimetype });
    const url = URL.createObjectURL(blob);
    this._objectUrls.add(url);
    return url;
  }

  async newUntitled(options?: Contents.ICreateOptions): Promise<IModel> {
    throw Private.readOnlyError();
  }

  async copy(path: string, toDir: string): Promise<IModel> {
    throw Private.readOnlyError();
  }

  async rename(oldLocalPath: string, newLocalPath: string): Promise<IModel> {
    throw Private.readOnlyError();
  }

  async save(
    path: string,
    options: Partial<IModel> & Contents.IContentProvisionOptions = {},
  ): Promise<IModel> {
    throw Private.readOnlyError();
  }

  async delete(path: string): Promise<void> {
    throw Private.readOnlyError();
  }

  async createCheckpoint(path: string): Promise<Contents.ICheckpointModel> {
    throw Private.readOnlyError();
  }

  async listCheckpoints(path: string): Promise<Contents.ICheckpointModel[]> {
    return [];
  }

  async restoreCheckpoint(path: string, checkpointID: string): Promise<void> {
    throw Private.readOnlyError();
  }

  async deleteCheckpoint(path: string, checkpointID: string): Promise<void> {
    throw Private.readOnlyError();
  }

  /**
   * Load known configuration files from the generated site.
   */
  private async _loadConfigurationFiles(
    rootUrl: string,
    applicationUrl: string,
  ): Promise<void> {
    const locations = [{ path: '', url: rootUrl }];
    const applicationPath = Private.relativePath(rootUrl, applicationUrl);
    if (applicationPath) {
      locations.push({ path: applicationPath, url: applicationUrl });
    }

    const requests = locations.flatMap((location) => {
      return CONFIGURATION_FILES.map((name) => ({
        path: PathExt.join(location.path, name),
        url: new URL(name, location.url).href,
      }));
    });

    await Promise.all(
      requests.map(async ({ path, url }) => {
        try {
          const response = await fetch(url);
          if (!response.ok) {
            return;
          }
          const content = await response.text();
          JSON.parse(content);
          Private.addFile(this._files, {
            path,
            content,
            format: path.endsWith('.ipynb') ? 'json' : 'text',
            mimetype: MIME.JSON,
            type: path.endsWith('.ipynb') ? 'notebook' : 'file',
          });
        } catch {
          // These generated files are optional.
        }
      }),
    );
  }

  private _files = new Map<string, Private.IVirtualFile>();
  private _fileChanged = new Signal<Contents.IDrive, Contents.IChangedArgs>(this);
  private _isDisposed = false;
  private _objectUrls = new Set<string>();
  private _serverSettings: ServerConnection.ISettings;
  private _timestamp = new Date().toISOString();
}

/**
 * A namespace for debug drive options.
 */
export namespace DebugDrive {
  /**
   * The options used to create a debug drive.
   */
  export interface IOptions {
    /**
     * The URL of the current JupyterLite application.
     */
    applicationUrl: string;

    /**
     * The URL of the JupyterLite site root.
     */
    rootUrl: string;

    /**
     * The server settings of the drive.
     */
    serverSettings?: ServerConnection.ISettings;
  }
}

namespace Private {
  export interface IVirtualFile {
    content: string;
    format: Contents.FileFormat;
    mimetype: string;
    name: string;
    path: string;
    type: Contents.ContentType;
  }

  export function addFile(
    files: Map<string, IVirtualFile>,
    file: Omit<IVirtualFile, 'name'>,
  ): void {
    files.set(file.path, { ...file, name: PathExt.basename(file.path) });
  }

  export function convertContent(
    content: string,
    format: Contents.FileFormat,
  ): string | object {
    if (format === 'json') {
      return JSON.parse(content);
    }
    if (format === 'base64') {
      return encodeBase64(encoder.encode(content));
    }
    return content;
  }

  export function directoryModel(
    path: string,
    content: IModel[] | null,
    timestamp: string,
  ): IModel {
    return {
      name: path ? PathExt.basename(path) : '',
      path,
      last_modified: timestamp,
      created: timestamp,
      format: 'json',
      mimetype: MIME.JSON,
      content,
      size: 0,
      writable: false,
      type: 'directory',
    };
  }

  export function encodeBase64(content: Uint8Array): string {
    let binary = '';
    for (const byte of content) {
      binary += String.fromCharCode(byte);
    }
    return btoa(binary);
  }

  export function fileMetadata(file: IVirtualFile, timestamp: string): IModel {
    return {
      name: file.name,
      path: file.path,
      last_modified: timestamp,
      created: timestamp,
      format: file.format,
      mimetype: file.mimetype,
      content: null,
      size: encoder.encode(file.content).length,
      writable: false,
      type: file.type,
    };
  }

  export function normalizePath(path: string): string {
    return decodeURIComponent(path.replace(/^\//, ''));
  }

  export function readOnlyError(): Error {
    return new Error('The JupyterLite debug drive is read-only.');
  }

  export function relativePath(rootUrl: string, applicationUrl: string): string | null {
    const root = new URL(rootUrl);
    const application = new URL(applicationUrl);
    const rootPath = root.pathname.replace(/\/?$/, '/');
    const applicationPath = application.pathname.replace(/\/?$/, '/');
    if (root.origin !== application.origin || !applicationPath.startsWith(rootPath)) {
      return null;
    }
    return decodeURIComponent(
      applicationPath.slice(rootPath.length).replace(/\/$/, ''),
    );
  }

  export function virtualDirectories(files: Map<string, IVirtualFile>): Set<string> {
    const directories = new Set<string>(['']);
    for (const path of files.keys()) {
      const parts = path.split('/');
      for (let index = 1; index < parts.length; index++) {
        directories.add(parts.slice(0, index).join('/'));
      }
    }
    return directories;
  }
}
