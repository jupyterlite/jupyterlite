import { PathExt } from '@jupyterlab/coreutils';
import { Contents } from '@jupyterlab/services';
import { BLOCK_SIZE, TDriveMethod, TDriveRequest, TDriveResponse } from './drivefs';
import { DIR_MODE, FILE_MODE } from './emscripten';

export interface IDriveContentsProcessor {
  /**
   * Process a content request
   *
   * @param request the request
   */
  processDriveRequest<T extends TDriveMethod>(
    request: TDriveRequest<T>,
  ): Promise<TDriveResponse<T>>;

  /**
   * Process the request to read a directory content
   *
   * @param request the request
   */
  readdir(request: TDriveRequest<'readdir'>): Promise<TDriveResponse<'readdir'>>;

  /**
   * Process the request to remove a directory
   *
   * @param request the request
   */
  rmdir(request: TDriveRequest<'rmdir'>): Promise<TDriveResponse<'rmdir'>>;

  /**
   * Process the request to rename a file or directory
   *
   * @param request the request
   */
  rename(request: TDriveRequest<'rename'>): Promise<TDriveResponse<'rename'>>;

  /**
   * Process the request to get the node mode (file or directory)
   *
   * @param request the request
   */
  getmode(request: TDriveRequest<'getmode'>): Promise<TDriveResponse<'getmode'>>;

  /**
   * Process the request to check if a node exist
   *
   * @param request the request
   */
  lookup(request: TDriveRequest<'lookup'>): Promise<TDriveResponse<'lookup'>>;

  /**
   * Process the request to create a directory/file
   *
   * @param request the request
   */
  mknod(request: TDriveRequest<'mknod'>): Promise<TDriveResponse<'mknod'>>;

  /**
   * Process the request to get a node stats
   *
   * @param request the request
   */
  getattr(request: TDriveRequest<'getattr'>): Promise<TDriveResponse<'getattr'>>;

  /**
   * Process the request to get the content of a file
   *
   * @param request the request
   */
  get(request: TDriveRequest<'get'>): Promise<TDriveResponse<'get'>>;

  /**
   * Process the request to write the content of a file
   *
   * @param request the request
   */
  put(request: TDriveRequest<'put'>): Promise<TDriveResponse<'put'>>;
}

/**
 * Class for processing a drive request from the DriveFS.
 */
export class DriveContentsProcessor implements IDriveContentsProcessor {
  private contentsManager: Contents.IManager;

  constructor(options: DriveContentsProcessor.IOptions) {
    this.contentsManager = options.contentsManager;
  }

  async processDriveRequest<T extends TDriveMethod>(
    request: TDriveRequest<T>,
  ): Promise<TDriveResponse<T>> {
    switch (request.method) {
      case 'readdir':
        return this.readdir(request as TDriveRequest<'readdir'>) as Promise<
          TDriveResponse<T>
        >;
      case 'rmdir':
        return this.rmdir(request as TDriveRequest<'rmdir'>) as Promise<
          TDriveResponse<T>
        >;
      case 'rename':
        return this.rename(request as TDriveRequest<'rename'>) as Promise<
          TDriveResponse<T>
        >;
      case 'getmode':
        return this.getmode(request as TDriveRequest<'getmode'>) as Promise<
          TDriveResponse<T>
        >;
      case 'lookup':
        return this.lookup(request as TDriveRequest<'lookup'>) as Promise<
          TDriveResponse<T>
        >;
      case 'mknod':
        return this.mknod(request as TDriveRequest<'mknod'>) as Promise<
          TDriveResponse<T>
        >;
      case 'getattr':
        return this.getattr(request as TDriveRequest<'getattr'>) as Promise<
          TDriveResponse<T>
        >;
      case 'get':
        return this.get(request as TDriveRequest<'get'>) as Promise<TDriveResponse<T>>;
      case 'put':
        return this.put(request as TDriveRequest<'put'>) as Promise<TDriveResponse<T>>;
    }

    throw `Drive request ${request.method} does not exist.`;
  }

  async readdir(request: TDriveRequest<'readdir'>): Promise<TDriveResponse<'readdir'>> {
    const model = await this.contentsManager.get(request.path, { content: true });
    let response: string[] = [];
    if (model.type === 'directory' && model.content) {
      response = model.content.map((subcontent: Contents.IModel) => subcontent.name);
    }
    return response;
  }

  async rmdir(request: TDriveRequest<'rmdir'>): Promise<TDriveResponse<'rmdir'>> {
    await this.contentsManager.delete(request.path);
    return null;
  }

  async rename(request: TDriveRequest<'rename'>): Promise<TDriveResponse<'rename'>> {
    await this.contentsManager.rename(request.path, request.data.newPath);
    return null;
  }

  async getmode(request: TDriveRequest<'getmode'>): Promise<TDriveResponse<'getmode'>> {
    const model = await this.contentsManager.get(request.path);
    let response: number;
    if (model.type === 'directory') {
      response = DIR_MODE;
    } else {
      response = FILE_MODE;
    }
    return response;
  }

  async lookup(request: TDriveRequest<'lookup'>): Promise<TDriveResponse<'lookup'>> {
    let response: TDriveResponse<'lookup'>;

    try {
      const model = await this.contentsManager.get(request.path);
      response = {
        ok: true,
        mode: model.type === 'directory' ? DIR_MODE : FILE_MODE,
      };
    } catch (e) {
      response = { ok: false };
    }

    return response;
  }

  async mknod(request: TDriveRequest<'mknod'>): Promise<TDriveResponse<'mknod'>> {
    const model = await this.contentsManager.newUntitled({
      path: PathExt.dirname(request.path),
      type: request.data.mode === DIR_MODE ? 'directory' : 'file',
      ext: PathExt.extname(request.path),
    });
    await this.contentsManager.rename(model.path, request.path);
    return null;
  }

  async getattr(request: TDriveRequest<'getattr'>): Promise<TDriveResponse<'getattr'>> {
    const model = await this.contentsManager.get(request.path);
    // create a default date for drives that send incomplete information
    // for nested foldes and files
    const defaultDate = new Date(0).toISOString();

    return {
      dev: 1,
      nlink: 1,
      uid: 0,
      gid: 0,
      rdev: 0,
      size: model.size || 0,
      blksize: BLOCK_SIZE,
      blocks: Math.ceil(model.size || 0 / BLOCK_SIZE),
      atime: model.last_modified || defaultDate, // TODO Get the proper atime?
      mtime: model.last_modified || defaultDate,
      ctime: model.created || defaultDate,
      timestamp: 0,
    };
  }

  async get(request: TDriveRequest<'get'>): Promise<TDriveResponse<'get'>> {
    const model = await this.contentsManager.get(request.path, { content: true });

    let response;

    if (model.type !== 'directory') {
      response = {
        content:
          model.format === 'json' ? JSON.stringify(model.content) : model.content,
        format: model.format,
      };
    }

    return response;
  }

  async put(request: TDriveRequest<'put'>): Promise<TDriveResponse<'put'>> {
    await this.contentsManager.save(request.path, {
      content:
        request.data.format === 'json'
          ? JSON.parse(request.data.data)
          : request.data.data,
      type: 'file',
      format: request.data.format as Contents.FileFormat,
    });
    return null;
  }
}

/**
 * A namespace for DriveContentsProcessor configurations, etc.
 */
export namespace DriveContentsProcessor {
  /**
   * Initialization options for a drive;
   */
  export interface IOptions {
    contentsManager: Contents.IManager;
  }
}
