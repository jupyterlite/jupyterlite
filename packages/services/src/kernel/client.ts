import { PageConfig, URLExt } from '@jupyterlab/coreutils';

import type { IObservableMap } from '@jupyterlab/observables';
import { ObservableMap } from '@jupyterlab/observables';

import type { Kernel } from '@jupyterlab/services';
import { KernelAPI, KernelMessage, ServerConnection } from '@jupyterlab/services';

import { deserialize, serialize } from '@jupyterlab/services/lib/kernel/serialize';

import { supportedKernelWebSocketProtocols } from '@jupyterlab/services/lib/kernel/messages';

import { PromiseDelegate, UUID } from '@lumino/coreutils';

import type { ISignal } from '@lumino/signaling';
import { Signal } from '@lumino/signaling';

import { Mutex } from 'async-mutex';

import type { Client as WebSocketClient } from 'mock-socket';
import { Server as WebSocketServer } from 'mock-socket';

import type { IKernel, IKernelSpecs } from './tokens';
import { FALLBACK_KERNEL } from './tokens';

/**
 * Use the default kernel wire protocol.
 */
const KERNEL_WEBSOCKET_PROTOCOL =
  supportedKernelWebSocketProtocols.v1KernelWebsocketJupyterOrg;

/**
 * A class to handle requests to /api/kernels
 */
export class LiteKernelClient implements Kernel.IKernelAPIClient {
  /**
   * Construct a new Kernels
   *
   * @param options The instantiation options
   */
  constructor(options: LiteKernelClient.IOptions) {
    const { kernelSpecs } = options;
    this._kernelspecs = kernelSpecs;
    this._serverSettings = options.serverSettings ?? ServerConnection.makeSettings();
    // Forward the changed signal from _kernels
    this._kernels.changed.connect((_, args) => {
      this._changed.emit(args);
    });
  }

  /**
   * The server settings for the kernel client.
   */
  get serverSettings() {
    return this._serverSettings;
  }

  /**
   * Signal emitted when the kernels map changes
   */
  get changed(): ISignal<this, IObservableMap.IChangedArgs<IKernel>> {
    return this._changed;
  }

  /**
   * Start a new kernel.
   *
   * @param options The kernel start options.
   */
  async startNew(options: LiteKernelClient.IKernelOptions): Promise<Kernel.IModel> {
    const { id, name, location } = options;

    const kernelName = name ?? FALLBACK_KERNEL;
    const factory = this._kernelspecs.factories.get(kernelName);
    // bail if there is no factory associated with the requested kernel
    if (!factory) {
      throw Error(`No factory for kernel ${kernelName}`);
    }

    // create a synchronization mechanism to allow only one message
    // to be processed at a time
    const mutex = new Mutex();

    // hook a new client to a kernel
    const hook = (
      kernelId: string,
      clientId: string,
      socket: WebSocketClient,
    ): void => {
      const kernel = this._kernels.get(kernelId);

      if (!kernel) {
        throw Error(`No kernel ${kernelId}`);
      }

      this._clients.set(clientId, socket);
      this._mutexMap.set(kernelId, mutex);
      this._kernelClients.get(kernelId)?.add(clientId);

      const processMsg = async (msg: KernelMessage.IMessage) => {
        try {
          await mutex.runExclusive(async () => {
            await kernel.ready;
            await kernel.handleMessage(msg);
          });
        } catch (error) {
          if (
            error instanceof Error &&
            error.message.includes('request for lock canceled')
          ) {
            // expected to throw when mutex.cancel() is called below on cell execution error or on interrupt
            const cancelReason = this._cancelReason.get(mutex);
            if (
              (cancelReason === 'interrupt' ||
                cancelReason === 'interrupt-subsequent') &&
              msg.header.msg_type === 'execute_request'
            ) {
              if (cancelReason === 'interrupt') {
                // Change cancel reason so that only one cell includes the error.
                // Needs to go before await for mutex.
                this._cancelReason.set(mutex, 'interrupt-subsequent');
              }
              await mutex.waitForUnlock();
              // Send interrupt error to all clients
              const content: KernelMessage.IReplyErrorContent = {
                status: 'error',
                ename: 'Kernel Interrupt',
                evalue: 'Interrupted',
                traceback: [],
              };
              const sendMessage = this._kernelSends.get(kernelId);
              if (sendMessage === undefined) {
                console.warn('Did not find kernel send method');
                return;
              }
              if (cancelReason === 'interrupt') {
                sendMessage(
                  KernelMessage.createMessage<KernelMessage.IErrorMsg>({
                    channel: 'iopub',
                    session: clientId,
                    parentHeader: msg.header,
                    msgType: 'error',
                    content,
                  }),
                );
              }
              sendMessage(
                KernelMessage.createMessage<KernelMessage.IExecuteReplyMsg>({
                  channel: 'shell',
                  session: clientId,
                  parentHeader: (msg as KernelMessage.IExecuteRequestMsg).header,
                  msgType: 'execute_reply',
                  content: {
                    ...content,
                    execution_count: 0,
                  },
                  metadata: {
                    cause: 'interrupt',
                  },
                }),
              );
              sendMessage(
                KernelMessage.createMessage<KernelMessage.IStatusMsg>({
                  channel: 'iopub',
                  session: clientId,
                  parentHeader: msg.header,
                  msgType: 'status',
                  content: {
                    execution_state: 'idle',
                  },
                }),
              );
            }
          } else {
            throw error;
          }
        }
      };

      socket.on(
        'message',
        async (message: string | ArrayBuffer | Blob | ArrayBufferView) => {
          let msg;
          if (message instanceof ArrayBuffer) {
            message = new Uint8Array(message).buffer;
            msg = deserialize(message, KERNEL_WEBSOCKET_PROTOCOL);
          } else if (typeof message === 'string') {
            const encoder = new TextEncoder();
            const encodedData = encoder.encode(message);
            msg = deserialize(encodedData.buffer, KERNEL_WEBSOCKET_PROTOCOL);
          } else {
            return;
          }

          if (msg.header.msg_type === 'input_reply') {
            if (this._stdinPromise !== undefined) {
              // Stdin handled by Service Worker.
              this._stdinPromise.resolve(msg as KernelMessage.IInputReplyMsg);
            } else {
              // Stdin handled by SharedArrayBuffer which is like conventional message
              // passing to kernel except we cannot use processMsg as the mutex is
              // already held.
              void kernel.handleMessage(msg);
            }
          } else {
            void processMsg(msg);
          }
        },
      );

      const removeClient = () => {
        this._clients.delete(clientId);
        this._kernelClients.get(kernelId)?.delete(clientId);
      };

      kernel.disposed.connect(removeClient);
      socket.onclose = removeClient;
    };

    // ensure kernel id
    const kernelId = id ?? UUID.uuid4();

    // There is one server per kernel which handles multiple clients
    const kernelUrl = URLExt.join(
      LiteKernelClient.WS_BASE_URL,
      KernelAPI.KERNEL_SERVICE_URL,
      encodeURIComponent(kernelId),
      'channels',
    );
    const runningKernel = this._kernels.get(kernelId);
    if (runningKernel) {
      return {
        id: runningKernel.id,
        name: runningKernel.name,
      };
    }

    // start the kernel
    const sendMessage = (msg: KernelMessage.IMessage): void => {
      const clientId =
        msg.channel === 'stdin' ? msg.parent_header.session : msg.header.session;
      const socket = this._clients.get(clientId);
      if (!socket) {
        console.warn(`Trying to send message on removed socket for kernel ${kernelId}`);
        return;
      }

      const message = serialize(msg, KERNEL_WEBSOCKET_PROTOCOL);
      // process iopub messages
      if (msg.channel === 'iopub') {
        const clients = this._kernelClients.get(kernelId);
        clients?.forEach((id) => {
          this._clients.get(id)?.send(message);
        });
        return;
      }
      // cancel the execution of other cells if there is an execute error
      // to match the JupyterLab behavior
      if (msg.header.msg_type === 'execute_reply') {
        const executeReplyMsg = msg as KernelMessage.IExecuteReplyMsg;
        if (
          executeReplyMsg.content.status === 'error' &&
          executeReplyMsg.metadata.cause !== 'interrupt'
        ) {
          this._cancelReason.set(mutex, 'error');
          mutex.cancel();
        }
      }
      socket.send(message);
    };

    const kernel = await factory({
      id: kernelId,
      sendMessage,
      name: kernelName,
      location: location ?? '',
    });

    this._kernels.set(kernelId, kernel);
    this._kernelClients.set(kernelId, new Set<string>());
    this._kernelSends.set(kernelId, sendMessage);

    // create the websocket server for the kernel
    const wsServer = new WebSocketServer(kernelUrl, {
      mock: false,
      selectProtocol: () => KERNEL_WEBSOCKET_PROTOCOL,
    });
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
      this._mutexMap.delete(kernelId);
      this._kernelSends.delete(kernelId);
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
  async restart(kernelId: string): Promise<void> {
    const kernel = this._kernels.get(kernelId);
    if (!kernel) {
      throw Error(`Kernel ${kernelId} does not exist`);
    }
    const { id, name, location } = kernel;
    kernel.dispose();
    await this.startNew({ id, name, location });
  }

  /**
   * Interrupt a kernel.
   */
  async interrupt(kernelId: string): Promise<void> {
    const kernel = this._kernels.get(kernelId);
    if (!kernel) {
      throw Error(`Kernel ${kernelId} does not exist`);
    }

    // Wait for kernel to be ready
    await kernel.ready;

    // Cancel execution of following cells
    const mutex = this._mutexMap.get(kernelId);
    if (!mutex) {
      console.warn('No mutex to cancel');
      return;
    }
    this._cancelReason.set(mutex, 'interrupt');
    mutex.cancel();
  }

  /**
   * List the running kernels.
   */
  async listRunning(): Promise<Kernel.IModel[]> {
    return [...this._kernels.values()].map((kernel) => ({
      id: kernel.id,
      name: kernel.name,
    }));
  }

  /**
   * Shut down a kernel.
   *
   * @param id The kernel id.
   */
  async shutdown(id: string): Promise<void> {
    this._kernels.delete(id)?.dispose();
    this._kernelClients.delete(id);
    this._kernelSends.delete(id);
  }

  /**
   * Shut down all kernels.
   */
  async shutdownAll(): Promise<void> {
    this._kernels.keys().forEach((id) => {
      this.shutdown(id);
    });
  }

  /**
   * Get a kernel by id
   */
  async getModel(id: string): Promise<IKernel | undefined> {
    return this._kernels.get(id);
  }

  /**
   * Handle stdin request received from Service Worker.
   */
  async handleStdin(
    inputRequest: KernelMessage.IInputRequestMsg,
  ): Promise<KernelMessage.IInputReplyMsg> {
    this._stdinPromise = new PromiseDelegate<KernelMessage.IInputReplyMsg>();

    const clientId = inputRequest.parent_header.session;
    const kernelId = this._getClientKernel(clientId);
    if (kernelId !== undefined) {
      const sendMessage = this._kernelSends.get(kernelId);
      if (sendMessage !== undefined) {
        sendMessage(inputRequest);
      }
    }

    // Promise is resolved by input reply message.
    return this._stdinPromise.promise;
  }

  /**
   * Get a kernel id corresponding to a client id.
   */
  private _getClientKernel(clientId: string): string | undefined {
    // Walk the _kernelClients to find a match.
    return this._kernelClients
      .keys()
      .find((kernelId) => this._kernelClients.get(kernelId)!.has(clientId));
  }

  private _kernels = new ObservableMap<IKernel>();
  private _clients = new ObservableMap<WebSocketClient>();
  private _mutexMap = new Map<string, Mutex>();
  private _kernelClients = new ObservableMap<Set<string>>();
  private _kernelspecs: IKernelSpecs;
  private _serverSettings: ServerConnection.ISettings;
  private _changed = new Signal<this, IObservableMap.IChangedArgs<IKernel>>(this);
  private _stdinPromise?: PromiseDelegate<KernelMessage.IInputReplyMsg>;
  private _kernelSends = new ObservableMap<(msg: KernelMessage.IMessage) => void>();
  private _cancelReason = new WeakMap<
    Mutex,
    'interrupt' | 'interrupt-subsequent' | 'error'
  >();
}

/**
 * A namespace for Kernels statics.
 */
export namespace LiteKernelClient {
  /**
   * Options to create a new Kernels.
   */
  export interface IOptions {
    /**
     * The kernel specs service.
     */
    kernelSpecs: IKernelSpecs;

    /**
     * Server settings for the kernel client.
     */
    serverSettings?: ServerConnection.ISettings;
  }

  /**
   * Options to start a new kernel.
   */
  export interface IKernelOptions {
    /**
     * The kernel id.
     */
    id?: string;

    /**
     * The kernel name.
     */
    name?: string;

    /**
     * The location in the virtual filesystem from which the kernel was started.
     */
    location?: string;
  }

  /**
   * The base url for the Kernels manager
   */
  export const WS_BASE_URL = PageConfig.getBaseUrl().replace(/^http/, 'ws');
}
