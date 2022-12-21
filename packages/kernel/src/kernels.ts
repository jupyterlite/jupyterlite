import { ObservableMap } from '@jupyterlab/observables';

import { Kernel, KernelMessage } from '@jupyterlab/services';

import { deserialize, serialize } from '@jupyterlab/services/lib/kernel/serialize';

import { UUID } from '@lumino/coreutils';

import { Server as WebSocketServer, Client as WebSocketClient } from 'mock-socket';

import { IKernel, IKernels, IKernelSpecs } from './tokens';

import { Mutex } from 'async-mutex';

import { PageConfig } from '@jupyterlab/coreutils';

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
    const { id, name, location } = options;

    const factory = this._kernelspecs.factories.get(name);
    // bail if there is no factory associated with the requested kernel
    if (!factory) {
      return { id, name };
    }

    // create a synchronization mechanism to allow only one message
    // to be processed at a time
    const mutex = new Mutex();

    // hook a new client to a kernel
    const hook = (
      kernelId: string,
      clientId: string,
      socket: WebSocketClient
    ): void => {
      const kernel = this._kernels.get(kernelId);

      if (!kernel) {
        throw Error(`No kernel ${kernelId}`);
      }

      this._clients.set(clientId, socket);
      this._kernelClients.get(kernelId)?.add(clientId);

      const processMsg = async (msg: KernelMessage.IMessage) => {
        await mutex.runExclusive(async () => {
          await kernel.ready;
          await kernel.handleMessage(msg);
        });
      };

      socket.on(
        'message',
        async (message: string | ArrayBuffer | Blob | ArrayBufferView) => {
          let msg;
          if (message instanceof ArrayBuffer) {
            message = new Uint8Array(message).buffer;
            msg = deserialize(message);
          } else if (typeof message === 'string') {
            msg = deserialize(message);
          } else {
            return;
          }

          // TODO Find a better solution for this?
          // input-reply is asynchronous, must not be processed like other messages
          if (msg.header.msg_type === 'input_reply') {
            kernel.handleMessage(msg);
          } else {
            void processMsg(msg);
          }
        }
      );

      const removeClient = () => {
        this._clients.delete(clientId);
        this._kernelClients.get(kernelId)?.delete(clientId);
      };

      kernel.disposed.connect(removeClient);

      // TODO: check whether this is called
      // https://github.com/thoov/mock-socket/issues/298
      // https://github.com/jupyterlab/jupyterlab/blob/6bc884a7a8ed73c615ce72ba097bdb790482b5bf/packages/services/src/kernel/default.ts#L1245
      socket.onclose = removeClient;
    };

    // ensure kernel id
    const kernelId = id ?? UUID.uuid4();

    // There is one server per kernel which handles multiple clients
    const kernelUrl = `${Kernels.WS_BASE_URL}api/kernels/${kernelId}/channels`;
    const runningKernel = this._kernels.get(kernelId);
    if (runningKernel) {
      return {
        id: runningKernel.id,
        name: runningKernel.name,
      };
    }

    // start the kernel
    const sendMessage = (msg: KernelMessage.IMessage): void => {
      const clientId = msg.header.session;
      const socket = this._clients.get(clientId);
      if (!socket) {
        console.warn(`Trying to send message on removed socket for kernel ${kernelId}`);
        return;
      }

      const message = serialize(msg);
      // process iopub messages
      if (msg.channel === 'iopub') {
        const clients = this._kernelClients.get(kernelId);
        clients?.forEach((id) => {
          this._clients.get(id)?.send(message);
        });
        return;
      }
      socket.send(message);
    };

    const kernel = await factory({
      id: kernelId,
      sendMessage,
      name,
      location,
    });

    this._kernels.set(kernelId, kernel);
    this._kernelClients.set(kernelId, new Set<string>());

    // create the websocket server for the kernel
    const wsServer = new WebSocketServer(kernelUrl);
    wsServer.on('connection', (socket: WebSocketClient): void => {
      const url = new URL(socket.url);
      const clientId = url.searchParams.get('session_id') ?? '';
      hook(kernelId, clientId, socket);
    });

    // clean up closed connection
    wsServer.on('close', (): void => {
      this._clients.keys().forEach((clientId) => {
        const socket = this._clients.get(clientId);
        if (socket?.readyState === WebSocket.CLOSED) {
          this._clients.delete(clientId);
          this._kernelClients.get(kernelId)?.delete(clientId);
        }
      });
    });

    // cleanup on kernel shutdown
    kernel.disposed.connect(() => {
      wsServer.close();
      this._kernels.delete(kernelId);
      this._kernelClients.delete(kernelId);
    });

    return {
      id: kernel.id,
      name: kernel.name,
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
    const { id, name, location } = kernel;
    kernel.dispose();
    return this.startNew({ id, name, location });
  }

  /**
   * Shut down a kernel.
   *
   * @param id The kernel id.
   */
  async shutdown(id: string): Promise<void> {
    this._kernels.delete(id)?.dispose();
  }

  private _kernels = new ObservableMap<IKernel>();
  private _clients = new ObservableMap<WebSocketClient>();
  private _kernelClients = new ObservableMap<Set<string>>();
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

    /**
     * The location in the virtual filesystem from which the kernel was started.
     */
    location: string;
  }

  /**
   * The base url for the Kernels manager
   */
  export const WS_BASE_URL = PageConfig.getBaseUrl().replace(/^http/, 'ws');
}
