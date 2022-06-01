import { URLExt, PageConfig } from '@jupyterlab/coreutils';

import { KernelMessage } from '@jupyterlab/services';

import { BaseKernel, IKernel } from '@jupyterlite/kernel';

import { PromiseDelegate } from '@lumino/coreutils';

import * as Comlink from "comlink";

import worker from './worker?raw';

import { PIPLITE_WHEEL } from './_pypi';

interface IWorkerKernel {

  execute(content: KernelMessage.IExecuteRequestMsg['content'], parent: any): Promise<KernelMessage.IExecuteReplyMsg['content']>;
  complete(content: KernelMessage.ICompleteRequestMsg['content'], parent: any): Promise<KernelMessage.ICompleteReplyMsg['content']>;
  inspect(content: KernelMessage.IInspectRequestMsg['content'], parent: any): Promise<KernelMessage.IInspectReplyMsg['content']>;
  isComplete(content: KernelMessage.IIsCompleteRequestMsg['content'], parent: any): Promise<KernelMessage.IIsCompleteReplyMsg['content']>;
  commInfo(content: KernelMessage.ICommInfoRequestMsg['content'], parent: any): Promise<KernelMessage.ICommInfoReplyMsg['content']>;
  commOpen(content: KernelMessage.ICommOpenMsg, parent: any): Promise<void>;
  commMsg(content: KernelMessage.ICommMsgMsg, parent: any): Promise<void>;
  commClose(content: KernelMessage.ICommCloseMsg, parent: any): Promise<void>;
  inputReply(content: KernelMessage.IInputReplyMsg['content'], parent: any): Promise<void>;

}

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
    const blob = new Blob([this.buildWorkerScript(options).join('\n')]);
    this._worker = new Worker(window.URL.createObjectURL(blob));
    this._worker.onmessage = (e) => {
      this._processWorkerMessage(e.data);
    };
    this._workerKernel = Comlink.wrap<IWorkerKernel>(this._worker);

    // this.contentsManager.fileChanged.connect(this._fileChanged.bind(this));
    this._ready.resolve();
  }

  /**
   * Build a list of literal strings to use in the worker
   *
   * Subclasses could use overload this to customize pre-loaded behavior, replace
   * the worker, or any number of other tricks.
   *
   * @param options The instantiation options for a new PyodideKernel
   */
  protected buildWorkerScript(options: PyoliteKernel.IOptions): string[] {
    const { pyodideUrl } = options;

    const indexUrl = pyodideUrl.slice(0, pyodideUrl.lastIndexOf('/') + 1);

    const pypi = URLExt.join(PageConfig.getBaseUrl(), 'build/pypi');

    const pipliteUrls = [...(options.pipliteUrls || []), URLExt.join(pypi, 'all.json')];

    const pipliteWheelUrl = URLExt.join(pypi, PIPLITE_WHEEL);

    return [
      // first we need the pyodide initialization scripts...
      `importScripts("${options.pyodideUrl}");`,
      // ...we also need the location of the index of pyodide-built js/WASM...
      `var indexURL = "${indexUrl}";`,
      // ...and the piplite wheel...
      `var _pipliteWheelUrl = "${pipliteWheelUrl}";`,
      // ...and the locations of custom wheel APIs and indices...
      `var _pipliteUrls = ${JSON.stringify(pipliteUrls)};`,
      // ...but maybe not PyPI...
      `var _disablePyPIFallback = ${JSON.stringify(!!options.disablePyPIFallback)};`,
      // ...finally, the worker... which _must_ appear last!
      worker.toString(),
    ];
  }

  /**
   * Dispose the kernel.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
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
    const result = await this._workerKernel.execute(content, this.parent);
    result.execution_count = this.executionCount;
    return result;
  }

  /**
   * Handle an complete_request message
   *
   * @param msg The parent message.
   */
  completeRequest(
    content: KernelMessage.ICompleteRequestMsg['content']
  ): Promise<KernelMessage.ICompleteReplyMsg['content']> {
    return this._workerKernel.complete(content, this.parent);
  }

  /**
   * Handle an `inspect_request` message.
   *
   * @param content - The content of the request.
   *
   * @returns A promise that resolves with the response message.
   */
  inspectRequest(
    content: KernelMessage.IInspectRequestMsg['content']
  ): Promise<KernelMessage.IInspectReplyMsg['content']> {
    return this._workerKernel.inspect(content, this.parent);
  }

  /**
   * Handle an `is_complete_request` message.
   *
   * @param content - The content of the request.
   *
   * @returns A promise that resolves with the response message.
   */
  isCompleteRequest(
    content: KernelMessage.IIsCompleteRequestMsg['content']
  ): Promise<KernelMessage.IIsCompleteReplyMsg['content']> {
    return this._workerKernel.isComplete(content, this.parent);
  }

  /**
   * Handle a `comm_info_request` message.
   *
   * @param content - The content of the request.
   *
   * @returns A promise that resolves with the response message.
   */
  commInfoRequest(
    content: KernelMessage.ICommInfoRequestMsg['content']
  ): Promise<KernelMessage.ICommInfoReplyMsg['content']> {
    return this._workerKernel.commInfo(content, this.parent);
  }

  /**
   * Send an `comm_open` message.
   *
   * @param msg - The comm_open message.
   */
  commOpen(msg: KernelMessage.ICommOpenMsg): Promise<void> {
    return this._workerKernel.commOpen(msg, this.parent);
  }

  /**
   * Send an `comm_msg` message.
   *
   * @param msg - The comm_msg message.
   */
  commMsg(msg: KernelMessage.ICommMsgMsg): Promise<void> {
    return this._workerKernel.commMsg(msg, this.parent);
  }

  /**
   * Send an `comm_close` message.
   *
   * @param close - The comm_close message.
   */
  commClose(msg: KernelMessage.ICommCloseMsg): Promise<void> {
    return this._workerKernel.commClose(msg, this.parent);
  }

  /**
   * Send an `input_reply` message.
   *
   * @param content - The content of the reply.
   */
  inputReply(content: KernelMessage.IInputReplyMsg['content']): Promise<void> {
    return this._workerKernel.inputReply(content, this.parent);
  }

  private _worker: Worker;
  private _workerKernel: Comlink.Remote<IWorkerKernel>;
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
  }
}
