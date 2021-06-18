import { URLExt } from '@jupyterlab/coreutils';

import { KernelMessage } from '@jupyterlab/services';

import { BaseKernel, IKernel } from '@jupyterlite/kernel';

import { PromiseDelegate } from '@lumino/coreutils';

import worker from './worker?raw';

<<<<<<< HEAD
// TODO: sync this version with the npm version
import pyolite from '../py/pyolite/dist/pyolite-0.1.0a0-py3-none-any.whl';
=======
import widgetsnbextension from '../py/widgetsnbextension/dist/widgetsnbextension-3.5.0-py3-none-any.whl';
import nbformat from '../py/nbformat/dist/nbformat-4.2.0-py3-none-any.whl';
import ipykernel from '../py/ipykernel/dist/ipykernel-5.5.5-py3-none-any.whl';
import pyolite from '../py/pyolite/dist/pyolite-0.1.0-py3-none-any.whl';
>>>>>>> upstream/main

/**
 * A kernel that executes Python code with Pyodide.
 */
export class PyoliteKernel extends BaseKernel implements IKernel {
  /**
   * Instantiate a new PyodideKernel
   *
   * @param options The instantiation options for a new PyodideKernel
   */
  constructor(options: PyoliteKernel.IOptions) {
    super(options);
    const { pyodideUrl } = options;

    const widgetsnbextensionWheel = (widgetsnbextension as unknown) as string;
    const widgetsnbextensionWheelUrl = URLExt.join(
      window.location.origin,
      widgetsnbextensionWheel
    );

    const nbformatWheel = (nbformat as unknown) as string;
    const nbformatWheelUrl = URLExt.join(window.location.origin, nbformatWheel);

    const ipykernelWheel = (ipykernel as unknown) as string;
    const ipykernelWheelUrl = URLExt.join(window.location.origin, ipykernelWheel);

    const pyoliteWheel = options.pyoliteWheel ?? ((pyolite as unknown) as string);
    const pyoliteWheelUrl = URLExt.join(window.location.origin, pyoliteWheel);

    const indexUrl = pyodideUrl.slice(0, pyodideUrl.lastIndexOf('/') + 1);
    const blob = new Blob([
      [
        `importScripts("${pyodideUrl}");`,
        `var indexURL = "${indexUrl}";`,
        `var _widgetsnbextensionWheelUrl = '${widgetsnbextensionWheelUrl}';`,
        `var _nbformatWheelUrl = '${nbformatWheelUrl}';`,
        `var _ipykernelWheelUrl = '${ipykernelWheelUrl}';`,
        `var _pyoliteWheelUrl = '${pyoliteWheelUrl}';`,
        worker
      ].join('\n')
    ]);
    this._worker = new Worker(window.URL.createObjectURL(blob));
    this._worker.onmessage = e => {
      this._processWorkerMessage(e.data);
    };
    this._ready.resolve();
  }

  /**
   * Dispose the kernel.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    console.log(`Dispose worker for kernel ${this.id}`);
    this._worker.terminate();
    super.dispose();
  }

  /**
   * A promise that is fulfilled when the kernel is ready.
   */
  get ready(): Promise<void> {
    return this._ready.promise;
  }

  /**
   * Process a message coming from the pyodide web worker.
   *
   * @param msg The worker message to process.
   */
  private _processWorkerMessage(msg: any): void {
    const parentHeader = this.parentHeader;
    switch (msg.type) {
      case 'stdout': {
        const content = {
          event: 'stream',
          name: 'stdout',
          parentHeader,
          text: msg.stdout
        } as KernelMessage.IStreamMsg['content'];
        this.stream(content);
        break;
      }
      case 'stderr': {
        const { message } = msg.stderr;
        const content = {
          event: 'stream',
          name: 'stderr',
          parentHeader,
          text: message ?? msg.stderr
        } as KernelMessage.IStreamMsg['content'];
        this.stream(content);
        break;
      }
      case 'results': {
        const bundle = msg.results ?? { data: {}, metadata: {} };
        this._executeDelegate.resolve(bundle);
        break;
      }
      case 'error': {
        const { name, stack, message } = msg.error;
        const error = {
          name,
          stack,
          message
        };
        this._executeDelegate.resolve({
          ...error,
          parentHeader
        });
        break;
      }
      case 'display': {
        const bundle = msg.bundle ?? { data: {}, metadata: {} };
        this.displayData(bundle);
        break;
      }
      case 'comm_msg':
      case 'comm_open':
      case 'comm_close': {
        this.handleComm(msg.type, msg.content, msg.metadata, msg.buffers);
        break;
      }
      default:
        this._executeDelegate.resolve({
          data: {},
          metadata: {}
        });
        break;
    }
  }

  /**
   * Handle a kernel_info_request message
   */
  async kernelInfoRequest(): Promise<KernelMessage.IInfoReplyMsg['content']> {
    const content: KernelMessage.IInfoReply = {
      implementation: 'pyodide',
      implementation_version: '0.1.0',
      language_info: {
        codemirror_mode: {
          name: 'python',
          version: 3
        },
        file_extension: '.py',
        mimetype: 'text/x-python',
        name: 'python',
        nbconvert_exporter: 'python',
        pygments_lexer: 'ipython3',
        version: '3.8'
      },
      protocol_version: '5.3',
      status: 'ok',
      banner: 'Pyolite: A WebAssembly-powered Python kernel backed by Pyodide',
      help_links: [
        {
          text: 'Python (WASM) Kernel',
          url: 'https://pyodide.org'
        }
      ]
    };
    return content;
  }

  /**
   * Handle an `execute_request` message
   *
   * @param msg The parent message.
   */
  async executeRequest(
    content: KernelMessage.IExecuteRequestMsg['content']
  ): Promise<KernelMessage.IExecuteResultMsg['content']> {
    const result = await this._sendWorkerMessage('execute-request', content);
    if (result.name) {
      throw result;
    }
    // TODO: move executeResult and executeError here
    return {
      execution_count: this.executionCount,
      ...result
    };
  }

  /**
   * Handle an complete_request message
   *
   * @param msg The parent message.
   */
  async completeRequest(
    content: KernelMessage.ICompleteRequestMsg['content']
  ): Promise<KernelMessage.ICompleteReplyMsg['content']> {
    return await this._sendWorkerMessage('complete-request', content);
  }

  /**
   * Handle an `inspect_request` message.
   *
   * @param content - The content of the request.
   *
   * @returns A promise that resolves with the response message.
   */
  async inspectRequest(
    content: KernelMessage.IInspectRequestMsg['content']
  ): Promise<KernelMessage.IInspectReplyMsg['content']> {
    throw new Error('Not implemented');
  }

  /**
   * Handle an `is_complete_request` message.
   *
   * @param content - The content of the request.
   *
   * @returns A promise that resolves with the response message.
   */
  async isCompleteRequest(
    content: KernelMessage.IIsCompleteRequestMsg['content']
  ): Promise<KernelMessage.IIsCompleteReplyMsg['content']> {
    throw new Error('Not implemented');
  }

  /**
   * Handle a `comm_info_request` message.
   *
   * @param content - The content of the request.
   *
   * @returns A promise that resolves with the response message.
   */
  async commInfoRequest(
    content: KernelMessage.ICommInfoRequestMsg['content']
  ): Promise<KernelMessage.ICommInfoReplyMsg['content']> {
    return await this._sendWorkerMessage('comm-info-request', content);
  }

  /**
   * Send an `input_request` message.
   *
   * @param content - The content of the request.
   */
  async inputRequest(
    content: KernelMessage.IInputRequestMsg['content']
  ): Promise<void> {
    throw new Error('Not implemented');
  }

  /**
   * Send an `comm_open` message.
   *
   * @param msg - The comm_open message.
   */
  async commOpen(msg: KernelMessage.ICommOpenMsg): Promise<void> {
    return await this._sendWorkerMessage('comm-open', msg);
  }

  /**
   * Send an `comm_msg` message.
   *
   * @param msg - The comm_msg message.
   */
  async commMsg(msg: KernelMessage.ICommMsgMsg): Promise<void> {
    return await this._sendWorkerMessage('comm-msg', msg);
  }

  /**
   * Send an `comm_close` message.
   *
   * @param close - The comm_close message.
   */
  async commClose(msg: KernelMessage.ICommCloseMsg): Promise<void> {
    return await this._sendWorkerMessage('comm-close', msg);
  }

  /**
   * Send a message to the web worker
   *
   * @param type The message type to send to the worker.
   * @param data The message to send to the worker.
   */
  private async _sendWorkerMessage(type: string, data: any): Promise<any> {
    this._executeDelegate = new PromiseDelegate<any>();
    this._worker.postMessage({ type, data });
    return await this._executeDelegate.promise;
  }

  private _executeDelegate = new PromiseDelegate<any>();
  private _worker: Worker;
  private _ready = new PromiseDelegate<void>();
}

/**
 * A namespace for PyoliteKernel statics.
 */
export namespace PyoliteKernel {
  /**
   * The instantiation options for a Pyodide kernel
   */
  export interface IOptions extends IKernel.IOptions {
    /**
     * The URL to fetch Pyodide.
     */
    pyodideUrl: string;

    /**
     * The URL to fetch the Pyolite wheel.
     */
    pyoliteWheel?: string;
  }
}
