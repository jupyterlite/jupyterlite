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
  parent: IEmscriptenFSNode | null;
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
    return {
      dev: 0,
      ino: 0,
      mode: 0,
      nlink: 0,
      uid: 0,
      gid: 0,
      rdev: 0,
      size: 0,
      blksize: 0,
      blocks: 0,
      atime: new Date(),
      mtime: new Date(),
      ctime: new Date(),
      timestamp: 0,
    };
  }

  public setattr(node: IEmscriptenFSNode, attr: IStats): void {
    console.log('DriveFSEmscriptenNodeOps -- setattr', node, attr);
  }

  public lookup(parent: IEmscriptenFSNode, name: string): IEmscriptenFSNode {
    console.log('DriveFSEmscriptenNodeOps -- lookup', parent, name);
    // TODO Push to service worker for creating file
    return this.fs.FS.createNode(parent, name, DIR_MODE);
  }

  public mknod(
    parent: IEmscriptenFSNode,
    name: string,
    mode: number,
    dev: any
  ): IEmscriptenFSNode {
    console.log('DriveFSEmscriptenNodeOps -- mknod', parent, name, mode, dev);
    // TODO WAT?
    return this.fs.FS.createNode(parent, name, mode);
  }

  public rename(
    oldNode: IEmscriptenFSNode,
    newDir: IEmscriptenFSNode,
    newName: string
  ): void {
    console.log('DriveFSEmscriptenNodeOps -- rename', oldNode, newDir, newName);
  }

  public unlink(parent: IEmscriptenFSNode, name: string): void {
    console.log('DriveFSEmscriptenNodeOps -- unlink', parent, name);
  }

  public rmdir(parent: IEmscriptenFSNode, name: string) {
    this.fs.API.rmdir(parent.name, name);
  }

  public readdir(node: IEmscriptenFSNode): string[] {
    return this.fs.API.readdir(node.name);
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

  readdir(path: string) {
    return this.request('GET', `${path}?m=readdir`);
  }

  rmdir(parent: string, name: string) {
    return this.request('GET', `${parent}/${name}?m=rmdir`);
  }

  private _baseUrl: string;
}

export class DriveFS {
  FS: any;
  API: ContentsAPI;

  constructor(options: DriveFS.IOptions) {
    this.FS = options.FS;
    this.API = new ContentsAPI(options.baseUrl);

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
    return DIR_MODE;
  }

  realPath(node: IEmscriptenFSNode): string {
    console.log('DriveFS -- realPath', node);
    return '';
  }
}

/**
 * A namespace for DriveFS configurations, etc.
 */
export namespace DriveFS {
  /**
   * Initialization options for a drive;
   */
  export interface IOptions {
    FS: any;
    baseUrl: string;
  }
}
