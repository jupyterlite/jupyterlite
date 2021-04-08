import { ObservableMap } from '@jupyterlab/observables';

import { Kernel, KernelMessage } from '@jupyterlab/services';

import {
  deserialize,
  serialize
} from '@jupyterlab/services/lib/kernel/serialize';

import { UUID } from '@lumino/coreutils';

import { Server as WebSocketServer, WebSocket } from 'mock-socket';

import { IKernel, IKernels, IKernelSpecs } from './tokens';

/**
 * A class to handle requests to /api/kernels
 */
export class Kernels implements IKernels {
  /**
   * Construct a new Kernels
   *
   * @param options The instantiation options
   */
  constructor(options: Kernels.IOptions) {
    const { kernelspecs } = options;
    this._kernelspecs = kernelspecs;
  }

  /**
   * Start a new kernel.
   *
   * @param options The kernel start options.
   */
  startNew(options: Kernels.IKernelOptions): Kernel.IModel {
    const { id, name } = options;

    const factory = this._kernelspecs.factories.get(name);
    // bail if there is no factory associated with the requested kernel
    if (!factory) {
      return { id, name };
    }

    const startKernel = async (id: string): Promise<void> => {
      const socket = this._sockets.get(id);
      if (!socket) {
        throw Error(`No socket for kernel ${id}`);
      }
      const sendMessage = (msg: KernelMessage.IMessage): void => {
        const message = serialize(msg);
        socket.send(message);
      };

      const kernelId = id ?? UUID.uuid4();
      const kernel = await factory({
        id: kernelId,
        sendMessage,
        sessionId: id,
        name
      });
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
    };

    const kernelUrl = `${Kernels.WS_BASE_URL}/api/kernels/${id}/channels`;
    let wsServer: WebSocketServer;
    if (this._servers.has(id)) {
      wsServer = this._servers.get(id)!;
    } else {
      wsServer = new WebSocketServer(kernelUrl);
      this._servers.set(id, wsServer);
    }

    // TODO: handle multiple connections to the same kernel?
    wsServer.on(
      'connection',
      async (socket: WebSocket): Promise<void> => {
        if (this._sockets.has(id)) {
          return;
        }
        this._sockets.set(id, socket);
        return startKernel(id);
      }
    );

    const model = {
      id,
      name: name ?? ''
    };

    return model;
  }

  /**
   * Restart a kernel.
   *
   * @param kernelId The kernel id.
   */
  async restart(kernelId: string): Promise<Kernel.IModel> {
    const kernel = this._kernels.get(kernelId);
    if (!kernel) {
      throw Error(`Kernel ${kernelId} does not exist`);
    }
    const { id, name } = kernel;
    kernel.dispose();
    this._sockets.get(id)?.close();
    this._sockets.delete(id);
    return this.startNew({ id, name });
  }

  /**
   * Shut down a kernel.
   *
   * @param id The kernel id.
   */
  async shutdown(id: string): Promise<void> {
    this._kernels.get(id)?.dispose();
    this._sockets.get(id)?.close();
    this._sockets.delete(id);
    this._servers.delete(id);
  }

  private _servers = new ObservableMap<WebSocketServer>();
  private _sockets = new ObservableMap<WebSocket>();
  private _kernels = new ObservableMap<IKernel>();
  private _kernelspecs: IKernelSpecs;
}

/**
 * A namespace for Kernels statics.
 */
export namespace Kernels {
  /**
   * Options to create a new Kernels.
   */
  export interface IOptions {
    /**
     * The kernel specs service.
     */
    kernelspecs: IKernelSpecs;
  }

  /**
   * Options to start a new kernel.
   */
  export interface IKernelOptions {
    /**
     * The kernel id.
     */
    id: string;

    /**
     * The kernel name.
     */
    name: string;
  }

  /**
   * The base url for the Kernels manager
   */
  export const WS_BASE_URL = `${
    window.location.protocol === 'https:' ? 'wss' : 'ws'
  }://${window.location.host}`;
}
