// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { PathExt } from '@jupyterlab/coreutils';

import { Contents as ServerContents, ContentsManager } from '@jupyterlab/services';

import { DIR_MODE, FILE_MODE } from './emscripten';

import { BLOCK_SIZE, IDriveRequest, DRIVE_API_PATH } from './drivefs';

import { IModel } from './contents';

import { IBroadcastChannelWrapper } from './tokens';

/** A broadcaster for the ServiceWorker */
export class BroadcastChannelWrapper implements IBroadcastChannelWrapper {
  public isDisposed = false;

  constructor(options: BroadcastChannelWrapper.IOptions) {
    this._contents = options.contents;
  }

  get enabled() {
    return this._enabled;
  }

  enable() {
    if (this._channel) {
      console.warn('BroadcastChannel already created and enabled');
      return;
    }
    this._channel = new BroadcastChannel(DRIVE_API_PATH);
    this._channel.addEventListener('message', this._onMessage);
    this._enabled = true;
  }

  disable() {
    if (this._channel) {
      this._channel.removeEventListener('message', this._onMessage);
      this._channel = null;
    }
    this._enabled = false;
  }

  /** Clean up the broadcaster. */
  dispose() {
    if (this.isDisposed) {
      return;
    }
    this.disable();
    this.isDisposed = true;
  }

  /** Handle a message received on the BroadcastChannel */
  protected _onMessage = async (event: MessageEvent<IDriveRequest>): Promise<void> => {
    if (!this._channel) {
      return;
    }
    const { _contents } = this;
    const request = event.data;
    const { path } = request;

    // many successful responses default to null
    let response: any = null;

    // most requests will use a model
    let model: ServerContents.IModel;

    switch (request.method) {
      case 'readdir':
        model = await _contents.get(path, { content: true });
        response = [];
        if (model.type === 'directory' && model.content) {
          response = model.content.map((subcontent: IModel) => subcontent.name);
        }
        break;
      case 'rmdir':
        await _contents.delete(path);
        break;
      case 'rename':
        await _contents.rename(path, request.data.newPath);
        break;
      case 'getmode':
        model = await _contents.get(path);
        if (model.type === 'directory') {
          response = DIR_MODE;
        } else {
          response = FILE_MODE;
        }
        break;
      case 'lookup':
        try {
          model = await _contents.get(path);
          response = {
            ok: true,
            mode: model.type === 'directory' ? DIR_MODE : FILE_MODE,
          };
        } catch (e) {
          response = { ok: false };
        }
        break;
      case 'mknod':
        model = await _contents.newUntitled({
          path: PathExt.dirname(path),
          type: Number.parseInt(request.data.mode) === DIR_MODE ? 'directory' : 'file',
          ext: PathExt.extname(path),
        });
        await _contents.rename(model.path, path);
        break;
      case 'getattr':
        model = await _contents.get(path);

        response = {
          dev: 1,
          nlink: 1,
          uid: 0,
          gid: 0,
          rdev: 0,
          size: model.size || 0,
          blksize: BLOCK_SIZE,
          blocks: Math.ceil(model.size || 0 / BLOCK_SIZE),
          atime: model.last_modified, // TODO Get the proper atime?
          mtime: model.last_modified,
          ctime: model.created,
          timestamp: 0,
        };
        break;
      case 'get':
        model = await _contents.get(path, { content: true });

        if (model.type === 'directory') {
          break;
        }

        response = {
          content:
            model.format === 'json' ? JSON.stringify(model.content) : model.content,
          format: model.format,
        };
        break;
      case 'put':
        await _contents.save(path, {
          content:
            request.data.format === 'json'
              ? JSON.parse(request.data.data)
              : request.data.data,
          type: 'file',
          format: request.data.format as ServerContents.FileFormat,
        });
        break;
      default:
        response = null as never;
        break;
    }

    this._channel.postMessage(response);
  };

  protected _channel: BroadcastChannel | null = null;
  protected _contents: ContentsManager;
  protected _enabled = false;
}

/** A namespace for  */
export namespace BroadcastChannelWrapper {
  export interface IOptions {
    contents: ContentsManager;
  }
  export type TBroadcastResponse = any;
}
