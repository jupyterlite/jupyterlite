import { ObservableMap } from '@jupyterlab/observables';

import { Kernel, KernelMessage } from '@jupyterlab/services';

import {
  deserialize,
  serialize
} from '@jupyterlab/services/lib/kernel/serialize';

import { Server as WebSocketServer } from 'mock-socket';

import { KernelIFrame } from './kernel';

/**
 * A class to handle requests to /api/kernels
 */
export class Kernels {
  /**
   * Start a new kernel.
   *
   * @param options The kernel start options.
   */
  startNew(options: Kernels.IStartOptions): Kernel.IModel {
    const { id, name } = options;
    const kernelUrl = `${Kernels.WS_BASE_URL}/api/kernels/${id}/channels`;
    const wsServer = new WebSocketServer(kernelUrl);

    // TODO: handle multiple connections to the same kernel
    wsServer.on('connection', socket => {
      // handle new kernel
      const sendMessage = (msg: KernelMessage.IMessage): void => {
        const message = serialize(msg);
        socket.send(message);
      };

      const kernel = new KernelIFrame({ id, sendMessage, sessionId: id });
      this._kernels.set(id, kernel);

      socket.on(
        'message',
        (message: string | ArrayBuffer | Blob | ArrayBufferView) => {
          let msg;
          if (message instanceof ArrayBuffer) {
            message = new Uint8Array(message).buffer;
            msg = deserialize(message);
          } else if (typeof message === 'string') {
            msg = deserialize(message);
          } else {
            return;
          }
          kernel.handleMessage(msg);
        }
      );

      socket.on('close', () => {
        kernel.dispose();
        this._kernels.delete(id);
      });
    });

    const model = {
      id,
      name: name ?? ''
    };

    console.log('kernels', this._kernels);

    return model;
  }

  private _kernels = new ObservableMap<KernelIFrame>();
}

/**
 * A namespace for Kernels statics.
 */
export namespace Kernels {
  /**
   * Options to start a new options.
   */
  export interface IStartOptions {
    /**
     * The kernel id.
     */
    id: string;

    /**
     * The kernel name.
     */
    name?: string;
  }

  /**
   * The base url for the Kernels manager
   */
  export const WS_BASE_URL = `${
    window.location.protocol === 'https:' ? 'wss' : 'ws'
  }://${window.location.host}`;
}
