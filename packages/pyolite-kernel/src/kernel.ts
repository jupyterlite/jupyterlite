import { PromiseDelegate } from '@lumino/coreutils';

import { URLExt, PageConfig } from '@jupyterlab/coreutils';
import { KernelMessage } from '@jupyterlab/services';

import { BaseKernel, IKernel } from '@jupyterlite/kernel';

import { wrap } from 'comlink';

import { IPyoliteWorkerKernel, IRemotePyoliteWorkerKernel } from './tokens';

import { PIPLITE_WHEEL } from './_pypi';

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
    this._worker = this.initWorker(options);
    this._worker.onmessage = (e) => this._processWorkerMessage(e.data);
    this._remoteKernel = wrap(this._worker);
    this.initRemote(options);
  }

  /**
   * Load the worker.
   *
   * ### Note
   *
   * Subclasses must implement this typographically almost _exactly_ for
   * webpack to find it.
   */
  protected initWorker(options: PyoliteKernel.IOptions): Worker {
    return new Worker(new URL('./comlink.worker.js', import.meta.url), {
      type: 'module',
    });
  }

  protected async initRemote(options: PyoliteKernel.IOptions): Promise<void> {
    const remoteOptions = this.initRemoteOptions(options);
    await this._remoteKernel.initialize(remoteOptions);
    this._ready.resolve();
  }

  protected initRemoteOptions(
    options: PyoliteKernel.IOptions
  ): IPyoliteWorkerKernel.IOptions {
    const { pyodideUrl } = options;

    const indexUrl = pyodideUrl.slice(0, pyodideUrl.lastIndexOf('/') + 1);

    const baseUrl = PageConfig.getBaseUrl();

    const pypi = URLExt.join(baseUrl, 'build/pypi');

    const pipliteUrls = [...(options.pipliteUrls || []), URLExt.join(pypi, 'all.json')];

    const pipliteWheelUrl = URLExt.join(pypi, PIPLITE_WHEEL);

    const disablePyPIFallback = !!options.disablePyPIFallback;

    return {
      baseUrl,
      pyodideUrl,
      indexUrl,
      pipliteWheelUrl,
      pipliteUrls,
      disablePyPIFallback,
      location: this.location,
      mountDrive: options.mountDrive,
    };
  }

  /**
   * Dispose the kernel.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._worker.terminate();
    (this._worker as any) = null;
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
    if (!msg.type) {
      return;
    }

    switch (msg.type) {
      case 'stream': {
        const bundle = msg.bundle ?? { name: 'stdout', text: '' };
        this.stream(bundle, msg.parentHeader);
        break;
      }
      case 'input_request': {
        const bundle = msg.content ?? { prompt: '', password: false };
        this.inputRequest(bundle, msg.parentHeader);
        break;
      }
      case 'display_data': {
        const bundle = msg.bundle ?? { data: {}, metadata: {}, transient: {} };
        this.displayData(bundle, msg.parentHeader);
        break;
      }
      case 'update_display_data': {
        const bundle = msg.bundle ?? { data: {}, metadata: {}, transient: {} };
        this.updateDisplayData(bundle, msg.parentHeader);
        break;
      }
      case 'clear_output': {
        const bundle = msg.bundle ?? { wait: false };
        this.clearOutput(bundle, msg.parentHeader);
        break;
      }
      case 'execute_result': {
        const bundle = msg.bundle ?? { execution_count: 0, data: {}, metadata: {} };
        this.publishExecuteResult(bundle, msg.parentHeader);
        break;
      }
      case 'execute_error': {
        const bundle = msg.bundle ?? { ename: '', evalue: '', traceback: [] };
        this.publishExecuteError(bundle, msg.parentHeader);
        break;
      }
      case 'comm_msg':
      case 'comm_open':
      case 'comm_close': {
        this.handleComm(
          msg.type,
          msg.content,
          msg.metadata,
          msg.buffers,
          msg.parentHeader
        );
        break;
      }
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
          version: 3,
        },
        file_extension: '.py',
        mimetype: 'text/x-python',
        name: 'python',
        nbconvert_exporter: 'python',
        pygments_lexer: 'ipython3',
        version: '3.8',
      },
      protocol_version: '5.3',
      status: 'ok',
      banner: 'Pyolite: A WebAssembly-powered Python kernel backed by Pyodide',
      help_links: [
        {
          text: 'Python (WASM) Kernel',
          url: 'https://pyodide.org',
        },
      ],
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
  ): Promise<KernelMessage.IExecuteReplyMsg['content']> {
    await this.ready;
    const result = await this._remoteKernel.execute(content, this.parent);
    result.execution_count = this.executionCount;
    return result;
  }

  /**
   * Handle an complete_request message
   *
   * @param msg The parent message.
   */
  async completeRequest(
    content: KernelMessage.ICompleteRequestMsg['content']
  ): Promise<KernelMessage.ICompleteReplyMsg['content']> {
    return await this._remoteKernel.complete(content, this.parent);
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
    return await this._remoteKernel.inspect(content, this.parent);
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
    return await this._remoteKernel.isComplete(content, this.parent);
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
    return await this._remoteKernel.commInfo(content, this.parent);
  }

  /**
   * Send an `comm_open` message.
   *
   * @param msg - The comm_open message.
   */
  async commOpen(msg: KernelMessage.ICommOpenMsg): Promise<void> {
    return await this._remoteKernel.commOpen(msg, this.parent);
  }

  /**
   * Send an `comm_msg` message.
   *
   * @param msg - The comm_msg message.
   */
  async commMsg(msg: KernelMessage.ICommMsgMsg): Promise<void> {
    return await this._remoteKernel.commMsg(msg, this.parent);
  }

  /**
   * Send an `comm_close` message.
   *
   * @param close - The comm_close message.
   */
  async commClose(msg: KernelMessage.ICommCloseMsg): Promise<void> {
    return await this._remoteKernel.commClose(msg, this.parent);
  }

  /**
   * Send an `input_reply` message.
   *
   * @param content - The content of the reply.
   */
  async inputReply(content: KernelMessage.IInputReplyMsg['content']): Promise<void> {
    return await this._remoteKernel.inputReply(content, this.parent);
  }

  private _worker: Worker;
  private _remoteKernel: IRemotePyoliteWorkerKernel;
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
     * The URLs from which to attempt PyPI API requests
     */
    pipliteUrls: string[];

    /**
     * Do not try pypi.org if `piplite.install` fails against local URLs
     */
    disablePyPIFallback: boolean;

    /**
     * Whether or not to mount the Emscripten drive
     */
    mountDrive: boolean;
  }
}
