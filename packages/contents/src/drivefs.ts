// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

// Types and implementation inspired from https://github.com/jvilk/BrowserFS
// LICENSE: https://github.com/jvilk/BrowserFS/blob/8977a704ea469d05daf857e4818bef1f4f498326/LICENSE
// And from https://github.com/gzuidhof/starboard-notebook

// LICENSE: https://github.com/gzuidhof/starboard-notebook/blob/cd8d3fc30af4bd29cdd8f6b8c207df8138f5d5dd/LICENSE
import {
  FS,
  ERRNO_CODES,
  PATH,
  DIR_MODE,
  SEEK_CUR,
  SEEK_END,
  IEmscriptenStream,
  IEmscriptenStreamOps,
  IEmscriptenNodeOps,
  IEmscriptenFSNode,
  IStats,
} from './emscripten';

export const DRIVE_SEPARATOR = ':';
export const DRIVE_API_PATH = '/api/drive.v1';

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
 * Interface of a request on the /api/drive endpoint
 */
export interface IDriveRequest {
  /**
   * The method of the request (rmdir, readdir etc)
   */
  method: TDriveMethod;

  /**
   * The path to the file/directory for which the request was sent
   */
  path: string;

  /**
   * Extra data on the request
   */
  data?: any;
}

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
      stream.file = this.fs.API.get(path);
    }
  }

  close(stream: IDriveStream): void {
    if (!this.fs.FS.isFile(stream.node.mode) || !stream.file) {
      return;
    }

    const path = this.fs.realPath(stream.node);

    const flags = stream.flags;
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
    position: number
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
    position: number
  ): number {
    if (length <= 0 || stream.file === undefined) {
      return 0;
    }

    stream.node.timestamp = Date.now();

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
      position += stream.position;
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

  getattr(node: IEmscriptenFSNode): IStats {
    return {
      ...this.fs.API.getattr(this.fs.realPath(node)),
      mode: node.mode,
      ino: node.id,
    };
  }

  setattr(node: IEmscriptenFSNode, attr: IStats): void {
    for (const [key, value] of Object.entries(attr)) {
      switch (key) {
        case 'mode':
          node.mode = value;
          break;
        case 'timestamp':
          node.timestamp = value;
          break;
        default:
          console.warn('setattr', key, 'of', value, 'on', node, 'not yet implemented');
          break;
      }
    }
  }

  lookup(parent: IEmscriptenFSNode, name: string): IEmscriptenFSNode {
    const path = this.fs.PATH.join2(this.fs.realPath(parent), name);
    const result = this.fs.API.lookup(path);
    if (!result.ok) {
      throw this.fs.FS.genericErrors[this.fs.ERRNO_CODES['ENOENT']];
    }
    return this.fs.createNode(parent, name, result.mode, 0);
  }

  mknod(
    parent: IEmscriptenFSNode,
    name: string,
    mode: number,
    dev: number
  ): IEmscriptenFSNode {
    const path = this.fs.PATH.join2(this.fs.realPath(parent), name);
    this.fs.API.mknod(path, mode);
    return this.fs.createNode(parent, name, mode, dev);
  }

  rename(oldNode: IEmscriptenFSNode, newDir: IEmscriptenFSNode, newName: string): void {
    this.fs.API.rename(
      oldNode.parent
        ? this.fs.PATH.join2(this.fs.realPath(oldNode.parent), oldNode.name)
        : oldNode.name,
      this.fs.PATH.join2(this.fs.realPath(newDir), newName)
    );

    // Updating the in-memory node
    oldNode.name = newName;
    oldNode.parent = newDir;
  }

  unlink(parent: IEmscriptenFSNode, name: string): void {
    this.fs.API.rmdir(this.fs.PATH.join2(this.fs.realPath(parent), name));
  }

  rmdir(parent: IEmscriptenFSNode, name: string) {
    this.fs.API.rmdir(this.fs.PATH.join2(this.fs.realPath(parent), name));
  }

  readdir(node: IEmscriptenFSNode): string[] {
    return this.fs.API.readdir(this.fs.realPath(node));
  }

  symlink(parent: IEmscriptenFSNode, newName: string, oldPath: string): void {
    throw new this.fs.FS.ErrnoError(this.fs.ERRNO_CODES['EPERM']);
  }

  readlink(node: IEmscriptenFSNode): string {
    throw new this.fs.FS.ErrnoError(this.fs.ERRNO_CODES['EPERM']);
  }
}

/**
 * Wrap ServiceWorker requests for an Emscripten-compatible synchronous API.
 */
export class ContentsAPI {
  constructor(
    baseUrl: string,
    driveName: string,
    mountpoint: string,
    FS: FS,
    ERRNO_CODES: ERRNO_CODES
  ) {
    this._baseUrl = baseUrl;
    this._driveName = driveName;
    this._mountpoint = mountpoint;
    this.FS = FS;
    this.ERRNO_CODES = ERRNO_CODES;
  }

  request(data: IDriveRequest): any {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', encodeURI(this.endpoint), false);

    try {
      xhr.send(JSON.stringify(data));
    } catch (e) {
      console.error(e);
    }

    if (xhr.status >= 400) {
      throw new this.FS.ErrnoError(this.ERRNO_CODES['EINVAL']);
    }

    return JSON.parse(xhr.responseText);
  }

  lookup(path: string): DriveFS.ILookup {
    return this.request({ method: 'lookup', path: this.normalizePath(path) });
  }

  getmode(path: string): number {
    return Number.parseInt(
      this.request({ method: 'getmode', path: this.normalizePath(path) })
    );
  }

  mknod(path: string, mode: number) {
    return this.request({
      method: 'mknod',
      path: this.normalizePath(path),
      data: { mode },
    });
  }

  rename(oldPath: string, newPath: string): void {
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

  rmdir(path: string): void {
    return this.request({ method: 'rmdir', path: this.normalizePath(path) });
  }

  get(path: string): DriveFS.IFile {
    const response = this.request({ method: 'get', path: this.normalizePath(path) });

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

  put(path: string, value: DriveFS.IFile) {
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
    const stats: IStats = this.request({
      method: 'getattr',
      path: this.normalizePath(path),
    });
    // Turn datetimes into proper objects
    stats.atime = new Date(stats.atime);
    stats.mtime = new Date(stats.mtime);
    stats.ctime = new Date(stats.ctime);
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

  /**
   * Get the api/drive endpoint
   */
  get endpoint(): string {
    return `${this._baseUrl}api/drive`;
  }

  private _baseUrl: string;
  private _driveName: string;
  private _mountpoint: string;
  private FS: FS;
  private ERRNO_CODES: ERRNO_CODES;
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
    this.API = new ContentsAPI(
      options.baseUrl,
      options.driveName,
      options.mountpoint,
      this.FS,
      this.ERRNO_CODES
    );
    this.driveName = options.driveName;

    this.node_ops = new DriveFSEmscriptenNodeOps(this);
    this.stream_ops = new DriveFSEmscriptenStreamOps(this);
  }

  node_ops: IEmscriptenNodeOps;
  stream_ops: IEmscriptenStreamOps;

  mount(mount: any): IEmscriptenFSNode {
    return this.createNode(null, mount.mountpoint, DIR_MODE | 511, 0);
  }

  createNode(
    parent: IEmscriptenFSNode | null,
    name: string,
    mode: number,
    dev: number
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
    mode: number;
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
  }
}
