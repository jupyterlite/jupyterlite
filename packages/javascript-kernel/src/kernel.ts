import { PageConfig } from '@jupyterlab/coreutils';

import { KernelMessage } from '@jupyterlab/services';

import { BaseKernel, IKernel } from '@jupyterlite/kernel';

import { PromiseDelegate } from '@lumino/coreutils';

import { wrap } from 'comlink';

import { IRemoteJavaScriptWorkerKernel } from './tokens';

/**
 * A kernel that executes code in an IFrame.
 */
export class JavaScriptKernel extends BaseKernel implements IKernel {
  /**
   * Instantiate a new JavaScriptKernel
   *
   * @param options The instantiation options for a new JavaScriptKernel
   */
  constructor(options: JavaScriptKernel.IOptions) {
    super(options);
    this._worker = this.initWorker(options);
    this._worker.onmessage = (e) => this._processWorkerMessage(e.data);
    this.remoteKernel = this.initRemote(options);
    this._ready.resolve();
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
   * Handle a kernel_info_request message
   */
  async kernelInfoRequest(): Promise<KernelMessage.IInfoReplyMsg['content']> {
    const content: KernelMessage.IInfoReply = {
      implementation: 'JavaScript',
      implementation_version: '0.1.0',
      language_info: {
        codemirror_mode: {
          name: 'javascript',
        },
        file_extension: '.js',
        mimetype: 'text/javascript',
        name: 'javascript',
        nbconvert_exporter: 'javascript',
        pygments_lexer: 'javascript',
        version: 'es2017',
      },
      protocol_version: '5.3',
      status: 'ok',
      banner: 'A JavaScript kernel running in the browser',
      help_links: [
        {
          text: 'JavaScript Kernel',
          url: 'https://github.com/jupyterlite/jupyterlite',
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
    content: KernelMessage.IExecuteRequestMsg['content'],
  ): Promise<KernelMessage.IExecuteReplyMsg['content']> {
    const result = await this.remoteKernel.execute(content, this.parent);
    result.execution_count = this.executionCount;
    return result;
  }

  /**
   * Handle an complete_request message
   *
   * @param msg The parent message.
   */
  async completeRequest(
    content: KernelMessage.ICompleteRequestMsg['content'],
  ): Promise<KernelMessage.ICompleteReplyMsg['content']> {
    return await this.remoteKernel.complete(content, this.parent);
  }

  /**
   * Handle an `inspect_request` message.
   *
   * @param content - The content of the request.
   *
   * @returns A promise that resolves with the response message.
   */
  async inspectRequest(
    content: KernelMessage.IInspectRequestMsg['content'],
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
    content: KernelMessage.IIsCompleteRequestMsg['content'],
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
    content: KernelMessage.ICommInfoRequestMsg['content'],
  ): Promise<KernelMessage.ICommInfoReplyMsg['content']> {
    throw new Error('Not implemented');
  }

  /**
   * Send an `input_reply` message.
   *
   * @param content - The content of the reply.
   */
  inputReply(content: KernelMessage.IInputReplyMsg['content']): void {
    throw new Error('Not implemented');
  }

  /**
   * Send an `comm_open` message.
   *
   * @param msg - The comm_open message.
   */
  async commOpen(msg: KernelMessage.ICommOpenMsg): Promise<void> {
    throw new Error('Not implemented');
  }

  /**
   * Send an `comm_msg` message.
   *
   * @param msg - The comm_msg message.
   */
  async commMsg(msg: KernelMessage.ICommMsgMsg): Promise<void> {
    throw new Error('Not implemented');
  }

  /**
   * Send an `comm_close` message.
   *
   * @param close - The comm_close message.
   */
  async commClose(msg: KernelMessage.ICommCloseMsg): Promise<void> {
    throw new Error('Not implemented');
  }

  /**
   * Load the worker.
   *
   * ### Note
   *
   * Subclasses must implement this typographically almost _exactly_ for
   * webpack to find it.
   */
  protected initWorker(options: JavaScriptKernel.IOptions): Worker {
    return new Worker(new URL('./comlink.worker.js', import.meta.url), {
      type: 'module',
    });
  }

  /**
   * Initialize the remote kernel.
   *
   * @param options The options for the remote kernel.
   * @returns The initialized remote kernel.
   */
  protected initRemote(
    options: JavaScriptKernel.IOptions,
  ): IRemoteJavaScriptWorkerKernel {
    const remote: IRemoteJavaScriptWorkerKernel = wrap(this._worker);
    remote.initialize({ baseUrl: PageConfig.getBaseUrl() });
    return remote;
  }

  /**
   * Process a message coming from the JavaScript web worker.
   *
   * @param msg The worker message to process.
   */
  private _processWorkerMessage(msg: any): void {
    if (!msg.type) {
      return;
    }

    const parentHeader = msg.parentHeader || this.parentHeader;

    switch (msg.type) {
      case 'stream': {
        const bundle = msg.bundle ?? { name: 'stdout', text: '' };
        this.stream(bundle, parentHeader);
        break;
      }
      case 'input_request': {
        const bundle = msg.content ?? { prompt: '', password: false };
        this.inputRequest(bundle, parentHeader);
        break;
      }
      case 'display_data': {
        const bundle = msg.bundle ?? { data: {}, metadata: {}, transient: {} };
        this.displayData(bundle, parentHeader);
        break;
      }
      case 'update_display_data': {
        const bundle = msg.bundle ?? { data: {}, metadata: {}, transient: {} };
        this.updateDisplayData(bundle, parentHeader);
        break;
      }
      case 'clear_output': {
        const bundle = msg.bundle ?? { wait: false };
        this.clearOutput(bundle, parentHeader);
        break;
      }
      case 'execute_result': {
        const bundle = msg.bundle ?? { execution_count: 0, data: {}, metadata: {} };
        this.publishExecuteResult(bundle, parentHeader);
        break;
      }
      case 'execute_error': {
        const bundle = msg.bundle ?? { ename: '', evalue: '', traceback: [] };
        this.publishExecuteError(bundle, parentHeader);
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
          msg.parentHeader,
        );
        break;
      }
    }
  }

  protected remoteKernel: IRemoteJavaScriptWorkerKernel;

  private _worker: Worker;
  private _ready = new PromiseDelegate<void>();
}

/**
 * A namespace for JavaScriptKernel statics
 */
namespace JavaScriptKernel {
  /**
   * The instantiation options for a JavaScript kernel.
   */
  export interface IOptions extends IKernel.IOptions {}
}
