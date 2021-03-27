import { KernelMessage } from '@jupyterlab/services';

import { PromiseDelegate } from '@lumino/coreutils';

import { IDisposable } from '@lumino/disposable';

/**
 * A kernel that executes code in an IFrame.
 */
export class KernelIFrame implements IDisposable {
  /**
   * Instantiate a new IFrameKernel
   *
   * @param options The instantiation options for a new IFrameKernel
   */
  constructor(options: IFrameKernel.IOptions) {
    const { id, sendMessage, sessionId } = options;
    this._id = id;
    // TODO: handle session id
    this._sessionId = sessionId;
    this._sendMessage = sendMessage;

    // create the main IFrame
    this._iframe = document.createElement('iframe');
    this._iframe.style.visibility = 'hidden';
    document.body.appendChild(this._iframe);

    this._initIFrame(this._iframe).then(() => {
      // TODO: handle kernel ready
      this._evalFunc(
        this._iframe.contentWindow,
        `
        console._log = console.log;
        console._error = console.error;

        window._bubbleUp = function(msg) {
          window.parent.postMessage({
            ...msg,
            "parentHeader": window._parentHeader
          });
        }

        console.log = function() {
          const args = Array.prototype.slice.call(arguments);
          window._bubbleUp({
            "event": "stream",
            "name": "stdout",
            "text": args.join(' ') + '\\n'
          });
        };
        console.info = console.log;

        console.error = function() {
          const args = Array.prototype.slice.call(arguments);
          window._bubbleUp({
            "event": "stream",
            "name": "stderr",
            "text": args.join(' ') + '\\n'
          });
        };
        console.warn = console.error;

        window.onerror = function(message, source, lineno, colno, error) {
          console.error(message);
        }
      `
      );
      window.addEventListener('message', (e: MessageEvent) => {
        const msg = e.data;
        const parentHeader = msg.parentHeader as KernelMessage.IHeader<
          KernelMessage.MessageType
        >;
        if (msg.event === 'stream') {
          const content = msg as KernelMessage.IStreamMsg['content'];
          this._stream(parentHeader, content);
        }
      });
    });
  }

  /**
   * Whether the kernel is disposed.
   */
  get isDisposed(): boolean {
    return this._isDisposed;
  }

  /**
   * Get the kernel id
   */
  get id(): string {
    return this._id;
  }

  /**
   * Dispose the kernel.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._isDisposed = true;
  }

  /**
   * Register a new IFrame.
   *
   * @param iframe The IFrame to register.
   */
  async registerIFrame(iframe: HTMLIFrameElement): Promise<void> {
    await this._initIFrame(iframe);
    for (const cell of this._cells) {
      this._evalFunc(iframe.contentWindow, cell);
    }
    // call the preload and setup function
    this._evalFunc(
      iframe.contentWindow,
      `
      setTimeout(() => {
        if (window.preload) window.preload();
        else if (window.setup) window.setup();
        window.loop();
      }, 100);
   `
    );
    this._iframes.push(iframe);
  }

  /**
   * Handle an incoming message from the client.
   *
   * @param msg The message to handle
   */
  async handleMessage(msg: KernelMessage.IMessage): Promise<void> {
    // console.log(msg)
    this._busy(msg);

    const msgType = msg.header.msg_type;
    switch (msgType) {
      case 'kernel_info_request':
        this._kernelInfo(msg);
        break;
      case 'execute_request':
        this._executeRequest(msg);
        break;
      case 'complete_request':
        this._complete(msg);
        break;
      default:
        break;
    }

    this._idle(msg);
  }

  /**
   * Send an 'idle' status message.
   *
   * @param parent The parent message
   */
  private _idle(parent: KernelMessage.IMessage): void {
    const message = KernelMessage.createMessage<KernelMessage.IStatusMsg>({
      msgType: 'status',
      session: '',
      parentHeader: parent.header,
      channel: 'iopub',
      content: {
        execution_state: 'idle'
      }
    });
    this._sendMessage(message);
  }

  /**
   * Send a 'busy' status message.
   *
   * @param parent The parent message.
   */
  private _busy(parent: KernelMessage.IMessage): void {
    const message = KernelMessage.createMessage<KernelMessage.IStatusMsg>({
      msgType: 'status',
      session: '',
      parentHeader: parent.header,
      channel: 'iopub',
      content: {
        execution_state: 'busy'
      }
    });
    this._sendMessage(message);
  }

  /**
   * Handle a kernel_info_request message
   *
   * @param parent The parent message.
   */
  private _kernelInfo(parent: KernelMessage.IMessage): void {
    const content: KernelMessage.IInfoReply = {
      implementation: 'JavaScript',
      implementation_version: '0.1.0',
      language_info: {
        codemirror_mode: {
          name: 'javascript'
        },
        file_extension: '.js',
        mimetype: 'text/javascript',
        name: 'javascript',
        nbconvert_exporter: 'javascript',
        pygments_lexer: 'javascript',
        version: 'es2017'
      },
      protocol_version: '5.3',
      status: 'ok',
      banner: 'A JavaScript kernel running in the browser',
      help_links: [
        {
          text: 'JavaScript Kernel',
          url: 'https://github.com/jtpio/jupyterlite'
        }
      ]
    };

    const message = KernelMessage.createMessage<KernelMessage.IInfoReplyMsg>({
      msgType: 'kernel_info_reply',
      channel: 'shell',
      session: this._sessionId,
      content
    });

    this._sendMessage(message);
  }

  /**
   * Handle an `execute_request` message
   *
   * @param msg The parent message.
   */
  private _executeRequest(msg: KernelMessage.IMessage): void {
    const parent = msg as KernelMessage.IExecuteRequestMsg;
    this._execution_count++;

    // store previous parent header
    this._evalFunc(
      this._iframe.contentWindow,
      `window._parentHeader = ${JSON.stringify(parent.header)};`
    );

    this._executeInput(parent);
    this._execute(parent);
  }

  /**
   * Send an `execute_input` message.
   *
   * @param msg The parent message.
   */
  private _executeInput(msg: KernelMessage.IMessage): void {
    const parent = msg as KernelMessage.IExecuteInputMsg;
    const code = parent.content.code;
    const message = KernelMessage.createMessage<KernelMessage.IExecuteInputMsg>(
      {
        msgType: 'execute_input',
        parentHeader: parent.header,
        channel: 'iopub',
        session: this._sessionId,
        content: {
          code,
          execution_count: this._execution_count
        }
      }
    );
    this._sendMessage(message);
  }

  /**
   * Execute the code.
   *
   * @param msg The parent message.
   */
  private _execute(msg: KernelMessage.IMessage): void {
    const parent = msg as KernelMessage.IExecuteRequestMsg;
    const code = parent.content.code;
    try {
      const result = this._eval(code);
      this._executeResult(parent, {
        data: {
          'text/plain': result
        },
        metadata: {}
      });
      this._execute_reply(parent, {
        execution_count: this._execution_count,
        status: 'ok',
        user_expressions: {},
        payload: []
      });
    } catch (e) {
      const { name, stack, message } = e;
      const error = {
        ename: name,
        evalue: message,
        traceback: [stack]
      };
      this._error(parent, error);
      this._execute_reply(parent, {
        execution_count: this._execution_count,
        status: 'error',
        ...error
      });
    }
  }

  /**
   * Send an `execute_result` message.
   *
   * @param msg The parent message.
   * @param content The execut result content.
   */
  private _executeResult(
    msg: KernelMessage.IMessage,
    content: Pick<
      KernelMessage.IExecuteResultMsg['content'],
      'data' | 'metadata'
    >
  ): void {
    const message = KernelMessage.createMessage<
      KernelMessage.IExecuteResultMsg
    >({
      msgType: 'execute_result',
      parentHeader: msg.header,
      channel: 'iopub',
      session: this._sessionId,
      content: {
        ...content,
        execution_count: this._execution_count
      }
    });
    this._sendMessage(message);
  }

  /**
   * Send an `error` message.
   *
   * @param msg The parent message.
   * @param content The content for the execution error response.
   */
  private _error(
    msg: KernelMessage.IMessage,
    content: KernelMessage.IErrorMsg['content']
  ): void {
    const message = KernelMessage.createMessage<KernelMessage.IErrorMsg>({
      msgType: 'error',
      parentHeader: msg.header,
      channel: 'iopub',
      session: this._sessionId,
      content
    });
    this._sendMessage(message);
  }

  /**
   * Send an `execute_reply` message.
   *
   * @param msg The parent message.
   * @param content The content for the execute reply.
   */
  private _execute_reply(
    msg: KernelMessage.IMessage,
    content: KernelMessage.IExecuteReplyMsg['content']
  ): void {
    const parent = msg as KernelMessage.IExecuteRequestMsg;
    const message = KernelMessage.createMessage<KernelMessage.IExecuteReplyMsg>(
      {
        msgType: 'execute_reply',
        channel: 'shell',
        parentHeader: parent.header,
        session: this._sessionId,
        content
      }
    );
    this._sendMessage(message);
  }

  /**
   * Handle a stream event from the kernel
   *
   * @param parentHeader The parent header.
   * @param content The stream content.
   */
  private _stream(
    parentHeader: KernelMessage.IHeader<KernelMessage.MessageType>,
    content: KernelMessage.IStreamMsg['content']
  ): void {
    const message = KernelMessage.createMessage<KernelMessage.IStreamMsg>({
      channel: 'iopub',
      msgType: 'stream',
      session: this._sessionId,
      parentHeader,
      content
    });
    this._sendMessage(message);
  }

  /**
   * Handle an complete_request message
   *
   * @param msg The parent message.
   */
  private _complete(msg: KernelMessage.IMessage): void {
    const parent = msg as KernelMessage.ICompleteRequestMsg;

    // naive completion on window names only
    // TODO: improve and move logic to the iframe
    const vars = this._evalFunc(
      this._iframe.contentWindow,
      'Object.keys(window)'
    ) as string[];
    const { code, cursor_pos } = parent.content;
    const words = code.slice(0, cursor_pos).match(/(\w+)$/) ?? [];
    const word = words[0] ?? '';
    const matches = vars.filter(v => v.startsWith(word));

    const message = KernelMessage.createMessage<
      KernelMessage.ICompleteReplyMsg
    >({
      msgType: 'complete_reply',
      parentHeader: parent.header,
      channel: 'shell',
      session: this._sessionId,
      content: {
        matches,
        cursor_start: cursor_pos - word.length,
        cursor_end: cursor_pos,
        metadata: {},
        status: 'ok'
      }
    });

    this._sendMessage(message);
  }

  /**
   * Execute code in the kernel IFrame.
   *
   * @param code The code to execute.
   */
  private _eval(code: string): string {
    // TODO: handle magics
    if (code.startsWith('%show')) {
      return '';
    }
    this._cells.push(code);
    for (const frame of this._iframes) {
      if (frame?.contentWindow) {
        this._evalFunc(frame.contentWindow, code);
      }
    }
    return this._evalFunc(this._iframe.contentWindow, code);
  }

  /**
   * Create a new IFrame
   *
   * @param iframe The IFrame to initialize.
   */
  private async _initIFrame(
    iframe: HTMLIFrameElement
  ): Promise<HTMLIFrameElement | undefined> {
    const delegate = new PromiseDelegate<void>();
    if (!iframe.contentWindow) {
      delegate.reject('IFrame not ready');
      return;
    }
    // TODO: init
    delegate.resolve();
    await delegate.promise;
    return iframe;
  }

  private _id: string;
  private _iframe: HTMLIFrameElement;
  private _iframes: HTMLIFrameElement[] = [];
  private _cells: string[] = [];
  private _evalFunc = new Function(
    'window',
    'code',
    'return window.eval(code);'
  );
  private _execution_count = 0;
  private _sessionId: string;
  private _isDisposed = false;
  private _sendMessage: (msg: KernelMessage.IMessage) => void;
}

/**
 * A namespace for IFrameKernel statics.
 */
export namespace IFrameKernel {
  /**
   * The instantiation options for an IFrameKernel.
   */
  export interface IOptions {
    /**
     * The kernel id.
     */
    id: string;

    /**
     * The session id.
     */
    sessionId: string;

    /**
     * The method to send messages back to the server.
     */
    sendMessage: (msg: KernelMessage.IMessage) => void;
  }
}
