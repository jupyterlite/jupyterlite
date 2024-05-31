// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { Contents as ServerContents } from '@jupyterlab/services';

import { TDriveRequest, DRIVE_API_PATH, TDriveMethod } from './drivefs';

import { IBroadcastChannelWrapper } from './tokens';
import { IDriveContentsProcessor, DriveContentsProcessor } from './drivecontents';

/** A broadcaster for the ServiceWorker */
export class BroadcastChannelWrapper implements IBroadcastChannelWrapper {
  public isDisposed = false;

  constructor(options: BroadcastChannelWrapper.IOptions) {
    this._contents = options.contents;
    this._driveContentsProcessor = new DriveContentsProcessor({
      contentsManager: this._contents,
    });
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
  protected _onMessage = async <T extends TDriveMethod>(
    event: MessageEvent<TDriveRequest<T>>,
  ): Promise<void> => {
    if (!this._channel) {
      return;
    }

    const request = event.data;
    const receiver = request?.receiver;
    if (receiver !== 'broadcast.ts') {
      // Message is not meant for us
      return;
    }

    const response = await this._driveContentsProcessor.processDriveRequest(request);

    this._channel.postMessage(response);
  };

  protected _channel: BroadcastChannel | null = null;
  protected _contents: ServerContents.IManager;
  protected _driveContentsProcessor: IDriveContentsProcessor;
  protected _enabled = false;
}

/** A namespace for  */
export namespace BroadcastChannelWrapper {
  export interface IOptions {
    contents: ServerContents.IManager;
  }
  export type TBroadcastResponse = any;
}
