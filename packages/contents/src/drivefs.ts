export const DIR_MODE = 16895; // 040777
export const FILE_MODE = 33206; // 100666

// Types and implementation inspired from
// https://github.com/jvilk/BrowserFS
// https://github.com/jvilk/BrowserFS/blob/a96aa2d417995dac7d376987839bc4e95e218e06/src/generic/emscripten_fs.ts
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
}

export interface IEmscriptenStream {
  node: IEmscriptenFSNode;
  nfd: any;
  flags: string;
  position: number;
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
    console.log('DriveFSEmscriptenStreamOps -- ctor');
    this.fs = fs;
    this.fs;
  }

  public open(stream: IEmscriptenStream): void {
    console.log('DriveFSEmscriptenStreamOps -- open', stream);
  }

  public close(stream: IEmscriptenStream): void {
    console.log('DriveFSEmscriptenStreamOps -- close', stream);
  }

  public read(
    stream: IEmscriptenStream,
    buffer: Uint8Array,
    offset: number,
    length: number,
    position: number
  ): number {
    console.log(
      'DriveFSEmscriptenStreamOps -- read',
      stream,
      buffer,
      offset,
      length,
      position
    );
    return 0;
  }

  public write(
    stream: IEmscriptenStream,
    buffer: Uint8Array,
    offset: number,
    length: number,
    position: number
  ): number {
    console.log(
      'DriveFSEmscriptenStreamOps -- write',
      stream,
      buffer,
      offset,
      length,
      position
    );
    return 0;
  }

  public llseek(stream: IEmscriptenStream, offset: number, whence: number): number {
    console.log('DriveFSEmscriptenStreamOps -- llseek', stream, offset, whence);
    let position = offset;
    if (whence === 1) {
      // SEEK_CUR.
      position += stream.position;
    } else if (whence === 2) {
      // SEEK_END.
      if (this.fs.FS.isFile(stream.node.mode)) {
        // TODO WAT?
        position += 500;
      }
    }

    stream.position = position;
    return position;
  }
}

export class DriveFSEmscriptenNodeOps implements IEmscriptenNodeOps {
  private fs: DriveFS;

  constructor(fs: DriveFS) {
    console.log('DriveFSEmscriptenNodeOps -- ctor');
    this.fs = fs;
  }

  public getattr(node: IEmscriptenFSNode): IStats {
    console.log('DriveFSEmscriptenNodeOps -- getattr', node);

    return this.fs.API.getattr(this.fs.realPath(node));
  }

  public setattr(node: IEmscriptenFSNode, attr: IStats): void {
    console.log('DriveFSEmscriptenNodeOps -- setattr', node, attr);
  }

  public lookup(parent: IEmscriptenFSNode, name: string): IEmscriptenFSNode {
    console.log('DriveFSEmscriptenNodeOps -- lookup', parent, name);

    const path = this.fs.PATH.join2(this.fs.realPath(parent), name);
    const result = this.fs.API.lookup(path);
    if (!result.ok) {
      throw this.fs.FS.genericErrors[this.fs.ERRNO_CODES['ENOENT']];
    }
    return this.fs.createNode(
      parent,
      name,
      result.data === null ? DIR_MODE : FILE_MODE
    );
  }

  public mknod(
    parent: IEmscriptenFSNode,
    name: string,
    mode: number,
    dev: any
  ): IEmscriptenFSNode {
    console.log('DriveFSEmscriptenNodeOps -- mknod', parent, name, mode, dev);

    const path = this.fs.PATH.join2(this.fs.realPath(parent), name);
    this.fs.API.mknod(path, mode);
    return this.fs.FS.createNode(parent, name, mode);
  }

  public rename(
    oldNode: IEmscriptenFSNode,
    newDir: IEmscriptenFSNode,
    newName: string
  ): void {
    console.log('DriveFSEmscriptenNodeOps -- rename', oldNode, newDir, newName);
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
    console.log('DriveFSEmscriptenNodeOps -- unlink', parent, name);
    this.fs.API.rmdir(this.fs.PATH.join2(this.fs.realPath(parent), name));
  }

  public rmdir(parent: IEmscriptenFSNode, name: string) {
    console.log('DriveFSEmscriptenNodeOps -- rmdir', parent, name);
    this.fs.API.rmdir(this.fs.PATH.join2(this.fs.realPath(parent), name));
  }

  public readdir(node: IEmscriptenFSNode): string[] {
    console.log('DriveFSEmscriptenNodeOps -- readdir', node);
    return this.fs.API.readdir(this.fs.realPath(node));
  }

  public symlink(parent: IEmscriptenFSNode, newName: string, oldPath: string): void {
    console.log('DriveFSEmscriptenNodeOps -- symlink', parent, newName, oldPath);
  }

  public readlink(node: IEmscriptenFSNode): string {
    console.log('DriveFSEmscriptenNodeOps -- readlink', node);
    return '';
  }
}

/**
 * Wrap serviceworker requests for an Emscripten-compatible syncronous API.
 */
export class ContentsAPI {
  constructor(baseUrl: string) {
    this._baseUrl = baseUrl;
  }

  request(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string): any {
    const xhr = new XMLHttpRequest();
    xhr.open(method, `${this._baseUrl}api${path}`, false);
    try {
      xhr.send();
    } catch (e) {
      console.error(e);
    }
    return JSON.parse(xhr.responseText);
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
    return this.request('GET', `${path}?m=readdir`);
  }

  rmdir(path: string): void {
    return this.request('GET', `${path}?m=rmdir`);
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
}

export class DriveFS {
  FS: any;
  API: ContentsAPI;
  PATH: DriveFS.IPath;
  ERRNO_CODES: any;

  constructor(options: DriveFS.IOptions) {
    this.FS = options.FS;
    this.API = new ContentsAPI(options.baseUrl);
    this.PATH = options.PATH;
    this.ERRNO_CODES = options.ERRNO_CODES;

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
    const node = FS.createNode(parent, name, mode, dev);
    node.node_ops = this.node_ops;
    node.stream_ops = this.stream_ops;
    return node;
  }

  getMode(path: string): number {
    console.log('DriveFS -- getMode', path);
    return this.API.getmode(path);
  }

  realPath(node: IEmscriptenFSNode): string {
    console.log('DriveFS -- realPath', node);
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
    data: any;
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
