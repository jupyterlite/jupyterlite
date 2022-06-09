export const DIR_MODE = 16895; // 040777
export const FILE_MODE = 33206; // 100666
export const SEEK_CUR = 1;
export const SEEK_END = 2;

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8');

// Types and implementation inspired from
// https://github.com/jvilk/BrowserFS
// https://github.com/jvilk/BrowserFS/blob/a96aa2d417995dac7d376987839bc4e95e218e06/src/generic/emscripten_fs.ts
// And from https://github.com/gzuidhof/starboard-notebook
export interface IStats {
  dev: number;
  ino: number;
  mode: number;
  nlink: number;
  uid: number;
  gid: number;
  rdev: number;
  size: number;
  blksize: number;
  blocks: number;
  atime: Date;
  mtime: Date;
  ctime: Date;
  timestamp?: number;
}

export interface IEmscriptenFSNode {
  name: string;
  mode: number;
  parent: IEmscriptenFSNode;
  mount: { opts: { root: string } };
  stream_ops: IEmscriptenStreamOps;
  node_ops: IEmscriptenNodeOps;
  timestamp: number;
}

export interface IEmscriptenStream {
  node: IEmscriptenFSNode;
  nfd: any;
  flags: string;
  position: number;
  fileData?: Uint8Array;
}

export interface IEmscriptenNodeOps {
  getattr(node: IEmscriptenFSNode): IStats;
  setattr(node: IEmscriptenFSNode, attr: IStats): void;
  lookup(parent: IEmscriptenFSNode, name: string): IEmscriptenFSNode;
  mknod(
    parent: IEmscriptenFSNode,
    name: string,
    mode: number,
    dev: any
  ): IEmscriptenFSNode;
  rename(oldNode: IEmscriptenFSNode, newDir: IEmscriptenFSNode, newName: string): void;
  unlink(parent: IEmscriptenFSNode, name: string): void;
  rmdir(parent: IEmscriptenFSNode, name: string): void;
  readdir(node: IEmscriptenFSNode): string[];
  symlink(parent: IEmscriptenFSNode, newName: string, oldPath: string): void;
  readlink(node: IEmscriptenFSNode): string;
}

export interface IEmscriptenStreamOps {
  open(stream: IEmscriptenStream): void;
  close(stream: IEmscriptenStream): void;
  read(
    stream: IEmscriptenStream,
    buffer: Uint8Array,
    offset: number,
    length: number,
    position: number
  ): number;
  write(
    stream: IEmscriptenStream,
    buffer: Uint8Array,
    offset: number,
    length: number,
    position: number
  ): number;
  llseek(stream: IEmscriptenStream, offset: number, whence: number): number;
}

export class DriveFSEmscriptenStreamOps implements IEmscriptenStreamOps {
  private fs: DriveFS;

  constructor(fs: DriveFS) {
    this.fs = fs;
  }

  public open(stream: IEmscriptenStream): void {
    const path = this.fs.realPath(stream.node);
    if (this.fs.FS.isFile(stream.node.mode)) {
      const result = this.fs.API.get(path);
      if (result === null) {
        return;
      }
      stream.fileData = encoder.encode(result);
    }
  }

  public close(stream: IEmscriptenStream): void {
    const path = this.fs.realPath(stream.node);
    if (this.fs.FS.isFile(stream.node.mode) && stream.fileData) {
      const text = decoder.decode(stream.fileData);
      stream.fileData = undefined;
      this.fs.API.put(path, text);
    }
  }

  public read(
    stream: IEmscriptenStream,
    buffer: Uint8Array,
    offset: number,
    length: number,
    position: number
  ): number {
    if (length <= 0 || stream.fileData === undefined) {
      return 0;
    }

    const size = Math.min((stream.fileData.length ?? 0) - position, length);
    try {
      buffer.set(stream.fileData.subarray(position, position + size), offset);
    } catch (e) {
      throw new this.fs.FS.ErrnoError(this.fs.ERRNO_CODES['EPERM']);
    }
    return size;
  }

  public write(
    stream: IEmscriptenStream,
    buffer: Uint8Array,
    offset: number,
    length: number,
    position: number
  ): number {
    if (length <= 0) {
      return 0;
    }

    stream.node.timestamp = Date.now();

    try {
      if (
        position + length > (stream.fileData?.length ?? 0) ||
        stream.fileData === undefined
      ) {
        const oldData = stream.fileData ?? new Uint8Array();
        stream.fileData = new Uint8Array(position + length);
        stream.fileData.set(oldData);
      }

      stream.fileData.set(buffer.subarray(offset, offset + length), position);

      return length;
    } catch (e) {
      throw new this.fs.FS.ErrnoError(this.fs.ERRNO_CODES['EPERM']);
    }
  }

  public llseek(stream: IEmscriptenStream, offset: number, whence: number): number {
    let position = offset;
    if (whence === SEEK_CUR) {
      position += stream.position;
    } else if (whence === SEEK_END) {
      if (this.fs.FS.isFile(stream.node.mode)) {
        try {
          // Not sure, but let's see
          position += stream.fileData!.length;
        } catch (e) {
          throw new this.fs.FS.ErrnoError(this.fs.ERRNO_CODES['EPERM']);
        }
      }
    }

    if (position < 0) {
      throw new this.fs.FS.ErrnoError(this.fs.ERRNO_CODES['EINVAL']);
    }

    return position;
  }
}

export class DriveFSEmscriptenNodeOps implements IEmscriptenNodeOps {
  private fs: DriveFS;

  constructor(fs: DriveFS) {
    this.fs = fs;
  }

  public getattr(node: IEmscriptenFSNode): IStats {
    return this.fs.API.getattr(this.fs.realPath(node));
  }

  public setattr(node: IEmscriptenFSNode, attr: IStats): void {
    // TODO
  }

  public lookup(parent: IEmscriptenFSNode, name: string): IEmscriptenFSNode {
    const path = this.fs.PATH.join2(this.fs.realPath(parent), name);
    const result = this.fs.API.lookup(path);
    if (!result.ok) {
      throw this.fs.FS.genericErrors[this.fs.ERRNO_CODES['ENOENT']];
    }
    return this.fs.createNode(parent, name, result.mode);
  }

  public mknod(
    parent: IEmscriptenFSNode,
    name: string,
    mode: number,
    dev: any
  ): IEmscriptenFSNode {
    const path = this.fs.PATH.join2(this.fs.realPath(parent), name);
    this.fs.API.mknod(path, mode);
    return this.fs.FS.createNode(parent, name, mode, dev);
  }

  public rename(
    oldNode: IEmscriptenFSNode,
    newDir: IEmscriptenFSNode,
    newName: string
  ): void {
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

  public unlink(parent: IEmscriptenFSNode, name: string): void {
    this.fs.API.rmdir(this.fs.PATH.join2(this.fs.realPath(parent), name));
  }

  public rmdir(parent: IEmscriptenFSNode, name: string) {
    this.fs.API.rmdir(this.fs.PATH.join2(this.fs.realPath(parent), name));
  }

  public readdir(node: IEmscriptenFSNode): string[] {
    return this.fs.API.readdir(this.fs.realPath(node));
  }

  public symlink(parent: IEmscriptenFSNode, newName: string, oldPath: string): void {
    throw new this.fs.FS.ErrnoError(this.fs.ERRNO_CODES['EPERM']);
  }

  public readlink(node: IEmscriptenFSNode): string {
    throw new this.fs.FS.ErrnoError(this.fs.ERRNO_CODES['EPERM']);
  }
}

/**
 * Wrap serviceworker requests for an Emscripten-compatible syncronous API.
 */
export class ContentsAPI {
  constructor(baseUrl: string, FS: any, ERRNO_CODES: any) {
    this._baseUrl = baseUrl;
    this.FS = FS;
    this.ERRNO_CODES = ERRNO_CODES;
  }

  request(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    jsonParse = true,
    data: string | null = null
  ): any {
    const xhr = new XMLHttpRequest();
    xhr.open(method, `${this._baseUrl}api${path}`, false);

    try {
      if (data === null) {
        xhr.send();
      } else {
        xhr.send(data);
      }
    } catch (e) {
      console.error(e);
    }

    if (xhr.status >= 400) {
      throw new this.FS.ErrnoError(this.ERRNO_CODES["EINVAL"]);
    }

    if (jsonParse) {
      return JSON.parse(xhr.responseText);
    } else {
      return xhr.responseText;
    }
  }

  lookup(path: string): DriveFS.ILookup {
    return this.request('GET', `${path}?m=lookup`);
  }

  getmode(path: string): number {
    return Number.parseInt(this.request('GET', `${path}?m=getmode`));
  }

  mknod(path: string, mode: number) {
    return this.request('GET', `${path}?m=mknod&args=${mode}`);
  }

  rename(oldPath: string, newPath: string): void {
    return this.request('GET', `${oldPath}?m=rename&args=${newPath}`);
  }

  readdir(path: string): string[] {
    const dirlist = this.request('GET', `${path}?m=readdir`);
    dirlist.push('.');
    dirlist.push('..');
    return dirlist;
  }

  rmdir(path: string): void {
    return this.request('GET', `${path}?m=rmdir`);
  }

  get(path: string): any {
    return this.request('GET', `${path}?m=get`, false);
  }

  put(path: string, value: string) {
    return this.request('PUT', `${path}?m=put`, false, value);
  }

  getattr(path: string): IStats {
    const stats = this.request('GET', `${path}?m=getattr`);
    // Turn datetimes into proper objects
    stats.atime = new Date(stats.atime);
    stats.mtime = new Date(stats.mtime);
    stats.ctime = new Date(stats.ctime);
    return stats;
  }

  private _baseUrl: string;
  private FS: any;
  private ERRNO_CODES: any;
}

export class DriveFS {
  FS: any;
  API: ContentsAPI;
  PATH: DriveFS.IPath;
  ERRNO_CODES: any;

  constructor(options: DriveFS.IOptions) {
    this.FS = options.FS;
    this.PATH = options.PATH;
    this.ERRNO_CODES = options.ERRNO_CODES;
    this.API = new ContentsAPI(options.baseUrl, this.FS, this.ERRNO_CODES);

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
    dev?: any
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
   * The response to a lookup request;
   */
  export interface ILookup {
    ok: boolean;
    mode: number;
  }

  /**
   * The emscripten FS Path API;
   */
  export interface IPath {
    basename: (path: string) => string;
    dirname: (path: string) => string;
    join: (...parts: string[]) => string;
    join2: (l: string, r: string) => string;
    normalize: (path: string) => string;
    splitPath: (filename: string) => string;
  }

  /**
   * Initialization options for a drive;
   */
  export interface IOptions {
    FS: any;
    PATH: IPath;
    ERRNO_CODES: any;
    baseUrl: string;
  }
}
