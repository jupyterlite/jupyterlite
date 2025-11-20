// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

// Types and implementation inspired from https://github.com/jvilk/BrowserFS
// LICENSE: https://github.com/jvilk/BrowserFS/blob/8977a704ea469d05daf857e4818bef1f4f498326/LICENSE
// And from https://github.com/gzuidhof/starboard-notebook

// LICENSE: https://github.com/gzuidhof/starboard-notebook/blob/cd8d3fc30af4bd29cdd8f6b8c207df8138f5d5dd/LICENSE
import type { Contents } from '@jupyterlab/services';

import { UUID } from '@lumino/coreutils';

import type {
  FS,
  ERRNO_CODES,
  PATH,
  IEmscriptenStream,
  IEmscriptenStreamOps,
  IEmscriptenNodeOps,
  IEmscriptenFSNode,
  IStats,
} from './emscripten';
import { DIR_MODE, SEEK_CUR, SEEK_END, instanceOfStream } from './emscripten';

export const DRIVE_SEPARATOR = ':';

export const BLOCK_SIZE = 4096;

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8');

export type TDriveMethod =
  | 'readdir'
  | 'rmdir'
  | 'rename'
  | 'getmode'
  | 'lookup'
  | 'mknod'
  | 'getattr'
  | 'get'
  | 'put';

/**
 * Type of the data argument for the drive request, based on the request name
 */
export type TDriveData = {
  rename: {
    /**
     * The new path for the file
     */
    newPath: string;
  };
  mknod: {
    /**
     * The mode of the file to create
     */
    mode: number;
  };
  put: {
    /**
     * The file content to write
     */
    data: any;

    /**
     * The file content format
     */
    format: Contents.FileFormat;
  };
};

/**
 * Drive request
 */
export type TDriveRequest<T extends TDriveMethod> = {
  /**
   * The method of the request (rmdir, readdir etc)
   */
  method: T;

  /**
   * A unique ID to identify the origin of this request
   */
  browsingContextId?: string;

  /**
   * A unique ID to correlate this specific request with its response
   */
  requestId?: string;

  /**
   * The path to the file/directory for which the request was sent
   */
  path: string;
} & (T extends keyof TDriveData ? { data: TDriveData[T] } : object);

type TDriveResponses = {
  readdir: string[];
  rmdir: null;
  rename: null;
  getmode: number;
  lookup: DriveFS.ILookup;
  mknod: null;
  getattr: IStats;
  get: {
    /**
     * The returned file content
     */
    content: any;

    /**
     * The content format
     */
    format: Contents.FileFormat;
  } | null;
  put: null;
};

/**
 * Drive response
 */
export type TDriveResponse<T extends TDriveMethod> = TDriveResponses[T];

// Mapping flag -> do we need to overwrite the file upon closing it
const flagNeedsWrite: { [flag: number]: boolean } = {
  0 /*O_RDONLY*/: false,
  1 /*O_WRONLY*/: true,
  2 /*O_RDWR*/: true,
  64 /*O_CREAT*/: true,
  65 /*O_WRONLY|O_CREAT*/: true,
  66 /*O_RDWR|O_CREAT*/: true,
  129 /*O_WRONLY|O_EXCL*/: true,
  193 /*O_WRONLY|O_CREAT|O_EXCL*/: true,
  514 /*O_RDWR|O_TRUNC*/: true,
  577 /*O_WRONLY|O_CREAT|O_TRUNC*/: true,
  578 /*O_CREAT|O_RDWR|O_TRUNC*/: true,
  705 /*O_WRONLY|O_CREAT|O_EXCL|O_TRUNC*/: true,
  706 /*O_RDWR|O_CREAT|O_EXCL|O_TRUNC*/: true,
  1024 /*O_APPEND*/: true,
  1025 /*O_WRONLY|O_APPEND*/: true,
  1026 /*O_RDWR|O_APPEND*/: true,
  1089 /*O_WRONLY|O_CREAT|O_APPEND*/: true,
  1090 /*O_RDWR|O_CREAT|O_APPEND*/: true,
  1153 /*O_WRONLY|O_EXCL|O_APPEND*/: true,
  1154 /*O_RDWR|O_EXCL|O_APPEND*/: true,
  1217 /*O_WRONLY|O_CREAT|O_EXCL|O_APPEND*/: true,
  1218 /*O_RDWR|O_CREAT|O_EXCL|O_APPEND*/: true,
  4096 /*O_RDONLY|O_DSYNC*/: true,
  4098 /*O_RDWR|O_DSYNC*/: true,
};

/** Implementation-specifc extension of an open stream, adding the file. */
export interface IDriveStream extends IEmscriptenStream {
  file?: DriveFS.IFile;
}

export class DriveFSEmscriptenStreamOps implements IEmscriptenStreamOps {
  private fs: DriveFS;

  constructor(fs: DriveFS) {
    this.fs = fs;
  }

  open(stream: IDriveStream): void {
    const path = this.fs.realPath(stream.node);

    if (this.fs.FS.isFile(stream.node.mode)) {
      try {
        const file = this.fs.API.get(path);
        stream.file = file;
      } catch (e) {
        // If we're opening a file for writing and the file does not exist, create it! Otherwise, throw the proper error
        // We need to do this because the current thread is thinking a file exist (isFile returns true)
        // whilst it was actually deleted in the main thread

        // if writing
        const flags = stream.flags ?? stream.shared.flags;
        let parsedFlags = typeof flags === 'string' ? parseInt(flags, 10) : flags;
        parsedFlags &= 0x1fff;

        let needsWrite = true;
        if (parsedFlags in flagNeedsWrite) {
          needsWrite = flagNeedsWrite[parsedFlags];
        }
        if (needsWrite) {
          stream.node = this.fs.node_ops.mknod(
            stream.node.parent,
            stream.node.name,
            stream.node.mode,
            0, // dev should be 0 for regular files
          );
          const file = this.fs.API.get(path);
          stream.file = file;
        } else {
          throw new this.fs.FS.ErrnoError(this.fs.ERRNO_CODES['ENOENT']);
        }
      }
    }
  }

  close(stream: IDriveStream): void {
    if (!this.fs.FS.isFile(stream.node.mode) || !stream.file) {
      return;
    }

    const path = this.fs.realPath(stream.node);

    const flags = stream.flags ?? stream.shared.flags;
    let parsedFlags = typeof flags === 'string' ? parseInt(flags, 10) : flags;
    parsedFlags &= 0x1fff;

    let needsWrite = true;
    if (parsedFlags in flagNeedsWrite) {
      needsWrite = flagNeedsWrite[parsedFlags];
    }

    if (needsWrite) {
      this.fs.API.put(path, stream.file);
    }

    stream.file = undefined;
  }

  read(
    stream: IDriveStream,
    buffer: Uint8Array,
    offset: number,
    length: number,
    position: number,
  ): number {
    if (
      length <= 0 ||
      stream.file === undefined ||
      position >= (stream.file.data.length || 0)
    ) {
      return 0;
    }

    const size = Math.min(stream.file.data.length - position, length);
    buffer.set(stream.file.data.subarray(position, position + size), offset);
    return size;
  }

  write(
    stream: IDriveStream,
    buffer: Uint8Array,
    offset: number,
    length: number,
    position: number,
  ): number {
    if (length <= 0 || stream.file === undefined) {
      return 0;
    }

    const now = Date.now();
    stream.node.timestamp = now;
    stream.node.atime = now;
    stream.node.mtime = now;
    stream.node.ctime = now;

    if (position + length > (stream.file?.data.length || 0)) {
      const oldData = stream.file.data ? stream.file.data : new Uint8Array();
      stream.file.data = new Uint8Array(position + length);
      stream.file.data.set(oldData);
    }

    stream.file.data.set(buffer.subarray(offset, offset + length), position);

    return length;
  }

  llseek(stream: IDriveStream, offset: number, whence: number): number {
    let position = offset;
    if (whence === SEEK_CUR) {
      position += stream.position ?? stream.shared.position;
    } else if (whence === SEEK_END) {
      if (this.fs.FS.isFile(stream.node.mode)) {
        if (stream.file !== undefined) {
          position += stream.file.data.length;
        } else {
          throw new this.fs.FS.ErrnoError(this.fs.ERRNO_CODES.EPERM);
        }
      }
    }

    if (position < 0) {
      throw new this.fs.FS.ErrnoError(this.fs.ERRNO_CODES.EINVAL);
    }

    return position;
  }
}

export class DriveFSEmscriptenNodeOps implements IEmscriptenNodeOps {
  private fs: DriveFS;

  constructor(fs: DriveFS) {
    this.fs = fs;
  }

  protected node = (
    nodeOrStream: IEmscriptenFSNode | IEmscriptenStream,
  ): IEmscriptenFSNode => {
    if (instanceOfStream(nodeOrStream)) {
      return nodeOrStream.node;
    }
    return nodeOrStream;
  };

  getattr = (value: IEmscriptenFSNode | IEmscriptenStream): IStats => {
    const node = this.node(value);
    return {
      ...this.fs.API.getattr(this.fs.realPath(node)),
      mode: node.mode,
      ino: node.id,
    };
  };

  setattr = (value: IEmscriptenFSNode | IEmscriptenStream, attr: IStats): void => {
    const node = this.node(value);
    for (const [key, value] of Object.entries(attr)) {
      switch (key) {
        case 'mode':
          node.mode = value;
          break;
        case 'timestamp':
          node.timestamp = value;
          break;
        case 'atime':
          node.atime = value;
          break;
        case 'mtime':
          node.mtime = value;
          break;
        case 'ctime':
          node.ctime = value;
          break;
        case 'size': {
          const size = value;
          const path = this.fs.realPath(node);
          if (this.fs.FS.isFile(node.mode) && size >= 0) {
            let file;
            try {
              file = this.fs.API.get(path);
            } catch (e) {
              // TODO: Should do anything here? Should we create the file?
              break;
            }

            const oldData = file.data ? file.data : new Uint8Array();
            if (size !== oldData.length) {
              if (size < oldData.length) {
                file.data = file.data.slice(0, size);
              } else {
                file.data = new Uint8Array(size);
                file.data.set(oldData);
              }
              this.fs.API.put(path, file);
            }
          } else {
            console.warn('setattr size of', size, 'on', node, 'not yet implemented');
          }
          break;
        }
        case 'dontFollow':
          // Ignore for now
          break;
        default:
          console.warn('setattr', key, 'of', value, 'on', node, 'not yet implemented');
          break;
      }
    }
  };

  lookup = (
    parent: IEmscriptenFSNode | IEmscriptenStream,
    name: string,
  ): IEmscriptenFSNode => {
    const node = this.node(parent);
    const path = this.fs.PATH.join2(this.fs.realPath(node), name);
    const result = this.fs.API.lookup(path);
    if (!result.ok) {
      throw new this.fs.FS.ErrnoError(this.fs.ERRNO_CODES['ENOENT']);
    }
    return this.fs.createNode(node, name, result.mode!, 0);
  };

  mknod = (
    parent: IEmscriptenFSNode | IEmscriptenStream,
    name: string,
    mode: number,
    dev: number,
  ): IEmscriptenFSNode => {
    const node = this.node(parent);
    const path = this.fs.PATH.join2(this.fs.realPath(node), name);
    this.fs.API.mknod(path, mode);
    return this.fs.createNode(node, name, mode, dev);
  };

  rename = (
    value: IEmscriptenFSNode | IEmscriptenStream,
    newDir: IEmscriptenFSNode | IEmscriptenStream,
    newName: string,
  ): void => {
    const oldNode = this.node(value);
    const newDirNode = this.node(newDir);
    this.fs.API.rename(
      oldNode.parent
        ? this.fs.PATH.join2(this.fs.realPath(oldNode.parent), oldNode.name)
        : oldNode.name,
      this.fs.PATH.join2(this.fs.realPath(newDirNode), newName),
    );

    // Updating the in-memory node
    oldNode.name = newName;
    oldNode.parent = newDirNode;
  };

  unlink = (parent: IEmscriptenFSNode | IEmscriptenStream, name: string): null => {
    return this.fs.API.rmdir(
      this.fs.PATH.join2(this.fs.realPath(this.node(parent)), name),
    );
  };

  rmdir = (parent: IEmscriptenFSNode | IEmscriptenStream, name: string): null => {
    return this.fs.API.rmdir(
      this.fs.PATH.join2(this.fs.realPath(this.node(parent)), name),
    );
  };

  readdir = (value: IEmscriptenFSNode | IEmscriptenStream): string[] => {
    return this.fs.API.readdir(this.fs.realPath(this.node(value)));
  };

  symlink = (
    parent: IEmscriptenFSNode | IEmscriptenStream,
    newName: string,
    oldPath: string,
  ): void => {
    throw new this.fs.FS.ErrnoError(this.fs.ERRNO_CODES['EPERM']);
  };

  readlink = (node: IEmscriptenFSNode | IEmscriptenStream): string => {
    throw new this.fs.FS.ErrnoError(this.fs.ERRNO_CODES['EINVAL']);
  };
}

/**
 * ContentsAPI base class
 */
export abstract class ContentsAPI {
  constructor(options: ContentsAPI.IOptions) {
    this._driveName = options.driveName;
    this._mountpoint = options.mountpoint;

    this.FS = options.FS;
    this.ERRNO_CODES = options.ERRNO_CODES;
  }

  lookup(path: string): DriveFS.ILookup {
    return this.request({ method: 'lookup', path: this.normalizePath(path) });
  }

  getmode(path: string): number {
    return this.request({ method: 'getmode', path: this.normalizePath(path) });
  }

  mknod(path: string, mode: number): null {
    return this.request({
      method: 'mknod',
      path: this.normalizePath(path),
      data: { mode },
    });
  }

  rename(oldPath: string, newPath: string): null {
    return this.request({
      method: 'rename',
      path: this.normalizePath(oldPath),
      data: { newPath: this.normalizePath(newPath) },
    });
  }

  readdir(path: string): string[] {
    const dirlist = this.request({
      method: 'readdir',
      path: this.normalizePath(path),
    });
    dirlist.push('.');
    dirlist.push('..');
    return dirlist;
  }

  rmdir(path: string): null {
    return this.request({ method: 'rmdir', path: this.normalizePath(path) });
  }

  get(path: string): DriveFS.IFile {
    const response = this.request({
      method: 'get',
      path: this.normalizePath(path),
    });

    if (!response) {
      throw new this.FS.ErrnoError(this.ERRNO_CODES['ENOENT']);
    }

    const serializedContent = response.content;
    const format: 'json' | 'text' | 'base64' | null = response.format;

    switch (format) {
      case 'json':
      case 'text':
        return {
          data: encoder.encode(serializedContent),
          format,
        };
      case 'base64': {
        const binString = atob(serializedContent);
        const len = binString.length;
        const data = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          data[i] = binString.charCodeAt(i);
        }
        return {
          data,
          format,
        };
      }
      default:
        throw new this.FS.ErrnoError(this.ERRNO_CODES['ENOENT']);
    }
  }

  put(path: string, value: DriveFS.IFile): null {
    switch (value.format) {
      case 'json':
      case 'text':
        return this.request({
          method: 'put',
          path: this.normalizePath(path),
          data: {
            format: value.format,
            data: decoder.decode(value.data),
          },
        });
      case 'base64': {
        let binary = '';
        for (let i = 0; i < value.data.byteLength; i++) {
          binary += String.fromCharCode(value.data[i]);
        }
        return this.request({
          method: 'put',
          path: this.normalizePath(path),
          data: {
            format: value.format,
            data: btoa(binary),
          },
        });
      }
    }
  }

  getattr(path: string): IStats {
    const stats = this.request({
      method: 'getattr',
      path: this.normalizePath(path),
    });

    // Emscripten 4.0.9+ (used by Pyodide 0.28+) requires all three timestamps
    // to be valid Date objects with .getTime() method (see https://github.com/emscripten-core/emscripten/pull/22998).
    // Fallback to epoch if any timestamp is missing/null/undefined.
    const defaultDate = new Date(0);
    stats.atime = stats.atime ? new Date(stats.atime) : defaultDate;
    stats.mtime = stats.mtime ? new Date(stats.mtime) : defaultDate;
    stats.ctime = stats.ctime ? new Date(stats.ctime) : defaultDate;

    // ensure a non-undefined size (0 isn't great, though)
    stats.size = stats.size || 0;
    return stats;
  }

  /**
   * Normalize a Path by making it compliant for the content manager
   *
   * @param path: the path relatively to the Emscripten drive
   */
  normalizePath(path: string): string {
    // Remove mountpoint prefix
    if (path.startsWith(this._mountpoint)) {
      path = path.slice(this._mountpoint.length);
    }

    // Add JupyterLab drive name
    if (this._driveName) {
      path = `${this._driveName}${DRIVE_SEPARATOR}${path}`;
    }

    return path;
  }

  abstract request<T extends TDriveMethod>(data: TDriveRequest<T>): TDriveResponse<T>;

  private _driveName: string;
  private _mountpoint: string;

  protected FS: FS;
  protected ERRNO_CODES: ERRNO_CODES;
}

/**
 * An Emscripten-compatible synchronous Contents API using the service worker.
 */
export class ServiceWorkerContentsAPI extends ContentsAPI {
  /**
   * Construct a new ServiceWorkerContentsAPI.
   */
  constructor(options: ServiceWorkerContentsAPI.IOptions) {
    super(options);

    this._baseUrl = options.baseUrl;
    this._browsingContextId = options.browsingContextId || '';
  }

  request<T extends TDriveMethod>(data: TDriveRequest<T>): TDriveResponse<T> {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', encodeURI(this.endpoint), false);

    // Generate unique request ID for correlation
    const requestId = UUID.uuid4();

    // Add the origin browsing context ID and request ID to the request
    const requestWithMetadata = {
      data: { ...data, requestId },
      browsingContextId: this._browsingContextId,
      requestId,
    };

    try {
      xhr.send(JSON.stringify(requestWithMetadata));
    } catch (e) {
      console.error(e);
    }

    if (xhr.status >= 400) {
      throw new this.FS.ErrnoError(this.ERRNO_CODES['EINVAL']);
    }

    return JSON.parse(xhr.responseText);
  }

  /**
   * Get the api/drive endpoint
   */
  get endpoint(): string {
    return `${this._baseUrl}api/drive`;
  }

  private _baseUrl: string;
  private _browsingContextId: string;
}

export class DriveFS {
  FS: FS;
  API: ContentsAPI;
  PATH: PATH;
  ERRNO_CODES: ERRNO_CODES;
  driveName: string;

  constructor(options: DriveFS.IOptions) {
    this.FS = options.FS;
    this.PATH = options.PATH;
    this.ERRNO_CODES = options.ERRNO_CODES;
    this.API = this.createAPI(options);

    this.driveName = options.driveName;

    this.node_ops = new DriveFSEmscriptenNodeOps(this);
    this.stream_ops = new DriveFSEmscriptenStreamOps(this);
  }

  node_ops: IEmscriptenNodeOps;
  stream_ops: IEmscriptenStreamOps;

  /**
   * Create the ContentsAPI.
   *
   * This is supposed to be overwritten if needed.
   */
  createAPI(options: DriveFS.IOptions): ContentsAPI {
    if (!options.browsingContextId || !options.baseUrl) {
      throw new Error(
        'Cannot create service-worker API without current browsingContextId',
      );
    }

    return new ServiceWorkerContentsAPI(options as ServiceWorkerContentsAPI.IOptions);
  }

  mount(mount: any): IEmscriptenFSNode {
    return this.createNode(null, mount.mountpoint, DIR_MODE | 511, 0);
  }

  createNode(
    parent: IEmscriptenFSNode | null,
    name: string,
    mode: number,
    dev: number,
  ): IEmscriptenFSNode {
    const FS = this.FS;
    if (!FS.isDir(mode) && !FS.isFile(mode)) {
      throw new FS.ErrnoError(this.ERRNO_CODES['EINVAL']);
    }
    const node = FS.createNode(parent, name, mode, dev);
    node.node_ops = this.node_ops;
    node.stream_ops = this.stream_ops;
    return node;
  }

  getMode(path: string): number {
    return this.API.getmode(path);
  }

  realPath(node: IEmscriptenFSNode): string {
    const parts: string[] = [];
    let currentNode: IEmscriptenFSNode = node;

    parts.push(currentNode.name);
    while (currentNode.parent !== currentNode) {
      currentNode = currentNode.parent;
      parts.push(currentNode.name);
    }
    parts.reverse();

    return this.PATH.join.apply(null, parts);
  }
}

/**
 * A namespace for ContentsAPI configurations, etc.
 */
export namespace ContentsAPI {
  /**
   * Initialization options for a contents API;
   */
  export interface IOptions {
    /**
     * The name of the drive to use for the contents API request.
     */
    driveName: string;

    /**
     * Where to mount files in the kernel.
     */
    mountpoint: string;

    /**
     * The filesystem module API.
     */
    FS: FS;

    /**
     * The filesystem error codes.
     */
    ERRNO_CODES: ERRNO_CODES;
  }
}

/**
 * A namespace for ServiceWorkerContentsAPI configurations, etc.
 */
export namespace ServiceWorkerContentsAPI {
  /**
   * Initialization options for a service worker contents API
   */
  export interface IOptions extends ContentsAPI.IOptions {
    /**
     * The base URL.
     */
    baseUrl: string;

    /**
     * The ID of the browsing context where the request originated.
     */
    browsingContextId: string;
  }
}

/**
 * A namespace for DriveFS configurations, etc.
 */
export namespace DriveFS {
  /**
   * A file representation;
   */
  export interface IFile {
    data: Uint8Array;
    format: 'json' | 'text' | 'base64';
  }

  /**
   * The response to a lookup request;
   */
  export interface ILookup {
    ok: boolean;
    mode?: number;
  }

  /**
   * Initialization options for a drive;
   */
  export interface IOptions {
    FS: FS;
    PATH: PATH;
    ERRNO_CODES: ERRNO_CODES;
    baseUrl: string;
    driveName: string;
    mountpoint: string;
    browsingContextId?: string;
  }
}
