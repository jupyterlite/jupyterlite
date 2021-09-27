import { KernelMessage } from '@jupyterlab/services';
import { IKernel } from '@jupyterlite/kernel';
import { ISignal, Signal } from '@lumino/signaling';

import { PromiseDelegate } from '@lumino/coreutils';

import XeusWorker from 'worker-loader!./worker';
//import worker from './worker?raw';

export class XeusServerKernel implements IKernel {
  /**
   * Instantiate a new XeusServerKernel
   *
   * @param options The instantiation options for a new XeusServerKernel
   */

  xeus_interpreter: any;
  constructor(options: XeusServerKernel.IOptions) {
    const { id, name, sendMessage } = options;
    this._id = id;
    this._name = name;
    this._sendMessage = sendMessage;

    const package_path = 'xeus_lua_kernel.js';
    this._worker = new XeusWorker();
    this._worker.onmessage = e => {
      this._processWorkerMessage(e.data);
    };
    this._worker.postMessage({
      msg: {
        header: { msg_type: '__import__' },
        content: { package_path: package_path }
      }
    });
  }
  async handleMessage(msg: KernelMessage.IMessage): Promise<void> {
    this._parent = msg;
    this._parentHeader = msg.header;
    await this._sendMessageToWorker(msg);
  }

  private async _sendMessageToWorker(msg: any): Promise<void> {
    if (msg.header.msg_type !== 'input_reply') {
      this._executeDelegate = new PromiseDelegate<void>();
    }
    this._worker.postMessage({ msg, parent: this.parent });
    if (msg.header.msg_type !== 'input_reply') {
      return await this._executeDelegate.promise;
    }
  }

  /**
   * Get the last parent header
   */
  get parentHeader(): KernelMessage.IHeader<KernelMessage.MessageType> | undefined {
    return this._parentHeader;
  }

  /**
   * Get the last parent message (mimick ipykernel's get_parent)
   */
  get parent(): KernelMessage.IMessage | undefined {
    return this._parent;
  }

  /**
   * Process a message coming from the pyodide web worker.
   *
   * @param msg The worker message to process.
   */
  private _processWorkerMessage(msg: any): void {
    if (msg.type === 'special_input_request') {
      const message = KernelMessage.createMessage<KernelMessage.IInputRequestMsg>({
        channel: 'stdin',
        msgType: 'input_request',
        session: this._parentHeader?.session ?? '',
        parentHeader: this._parentHeader,
        content: msg.content ?? { prompt: '', password: false }
      });
      this._sendMessage(message);
    } else {
      msg.header.session = this._parentHeader?.session ?? '';
      msg.session = this._parentHeader?.session ?? '';
      this._sendMessage(msg);
    }

    // resolve promise
    if (msg.type === 'status' && msg.content.execution_state === 'idle') {
      this._executeDelegate.resolve();
    }
  }

  /**
   * A promise that is fulfilled when the kernel is ready.
   */
  get ready(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Return whether the kernel is disposed.
   */
  get isDisposed(): boolean {
    return this._isDisposed;
  }

  /**
   * A signal emitted when the kernel is disposed.
   */
  get disposed(): ISignal<this, void> {
    return this._disposed;
  }

  /**
   * Dispose the kernel.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._isDisposed = true;
    this._disposed.emit(void 0);
  }

  /**
   * Get the kernel id
   */
  get id(): string {
    return this._id;
  }

  /**
   * Get the name of the kernel
   */
  get name(): string {
    return this._name;
  }

  private _id: string;
  private _name: string;
  private _isDisposed = false;
  private _disposed = new Signal<this, void>(this);
  private _worker: Worker;
  private _sendMessage: IKernel.SendMessage;
  private _executeDelegate = new PromiseDelegate<void>();
  private _parentHeader:
    | KernelMessage.IHeader<KernelMessage.MessageType>
    | undefined = undefined;
  private _parent: KernelMessage.IMessage | undefined = undefined;
}

/**
 * A namespace for XeusServerKernel statics.
 */
export namespace XeusServerKernel {
  /**
   * The instantiation options for a Pyodide kernel
   */
  export interface IOptions extends IKernel.IOptions {}
}
