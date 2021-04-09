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
  async startNew(options: Kernels.IKernelOptions): Promise<Kernel.IModel> {
    const { id, name } = options;

    const factory = this._kernelspecs.factories.get(name);
    // bail if there is no factory associated with the requested kernel
    if (!factory) {
      return { id, name };
    }

    const startKernel = async (id: string): Promise<IKernel> => {
      const kernelId = id ?? UUID.uuid4();

      const sendMessage = (msg: KernelMessage.IMessage): void => {
        const clientId = msg.header.session;
        const socket = this._clientIds.get(clientId);
        if (!socket) {
          console.warn(
            `Trying to send message on removed socket for kernel ${kernelId}`
          );
          return;
        }
        const message = serialize(msg);
        socket.send(message);
      };

      const kernel = await factory({
        id: kernelId,
        sendMessage,
        name
      });

      await kernel.ready;
      return kernel;
    };

    const hook = (
      kernelId: string,
      clientId: string,
      socket: WebSocket
    ): void => {
      const kernel = this._kernels.get(kernelId);

      if (!kernel) {
        throw Error(`No kernel ${id}`);
      }

      this._clientIds.set(clientId, socket);

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
        this._clientIds.delete(clientId);
      });

      // cleanup connections when the kernel is disposed
      kernel.disposed.connect(() => {
        socket.close();
      });
    };

    // There is one server per kernel which handles multiple clients
    const kernelUrl = `${Kernels.WS_BASE_URL}/api/kernels/${id}/channels`;
    const runningKernel = this._kernels.get(id);
    if (runningKernel) {
      return runningKernel;
    }

    const kernel = await startKernel(id);
    this._kernels.set(id, kernel);

    const wsServer = new WebSocketServer(kernelUrl);
    wsServer.on('connection', (socket: WebSocket): void => {
      const url = new URL(socket.url);
      const clientId = url.searchParams.get('session_id') ?? '';
      hook(id, clientId, socket);
    });

    // cleanup on kernel shutdown
    kernel.disposed.connect(() => {
      wsServer.close();
      this._kernels.delete(id);
    });

    return {
      id: kernel.id,
      name: kernel.name
    };
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
    return this.startNew({ id, name });
  }

  /**
   * Shut down a kernel.
   *
   * @param id The kernel id.
   */
  async shutdown(id: string): Promise<void> {
    this._kernels.get(id)?.dispose();
  }

  private _clientIds = new ObservableMap<WebSocket>();
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
