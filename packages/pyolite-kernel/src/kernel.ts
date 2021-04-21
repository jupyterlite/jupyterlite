import { PageConfig, URLExt } from '@jupyterlab/coreutils';

import { KernelMessage } from '@jupyterlab/services';

import { BaseKernel, IKernel } from '@jupyterlite/kernel';

import { PromiseDelegate } from '@lumino/coreutils';

import worker from './worker?raw';

import pyolite from '../py/dist/pyolite-0.1.0-py2.py3-none-any.whl';

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
    const pyoliteWheel = options.pyoliteWheel ?? ((pyolite as unknown) as string);
    const pyoliteWheelUrl = URLExt.join(PageConfig.getBaseUrl(), pyoliteWheel);
    const blob = new Blob([
      [
        `importScripts("${pyodideUrl}");`,
        `var _pyoliteWheelUrl = '${pyoliteWheelUrl}'`,
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
        this._executeDelegate.resolve({ data: {}, metadata: {} });
        break;
      }
      case 'stderr': {
        const { name, stack, message } = msg.stderr;
        const error = {
          name,
          stack,
          message
        };
        if (msg.error) {
          this._executeDelegate.resolve(error);
          break;
        }
        const content = {
          event: 'stream',
          name: 'stderr',
          parentHeader,
          text: message ?? msg.stderr
        } as KernelMessage.IStreamMsg['content'];
        this.stream(content);
        this._executeDelegate.resolve({ data: {}, metadata: {} });
        break;
      }
      case 'results': {
        const bundle = msg.results ?? { data: {}, metadata: {} };
        this._executeDelegate.resolve(bundle);
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
        version: '3.7'
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
    const { code } = content;
    const result = await this._eval(code);
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
    // TODO
    return {
      matches: [],
      cursor_start: 0,
      cursor_end: 0,
      metadata: {},
      status: 'ok'
    };
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
    throw new Error('Not implemented');
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
   * Send a message to the web worker
   *
   * @param msg The message to send to the worker.
   */
  private async _sendWorkerMessage(msg: any): Promise<any> {
    this._executeDelegate = new PromiseDelegate<any>();
    this._worker.postMessage(msg);
    return await this._executeDelegate.promise;
  }

  /**
   * Send code to be executed in the web worker
   *
   * @param code The code to execute.
   */
  private async _eval(code: string): Promise<any> {
    return this._sendWorkerMessage({ code });
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
