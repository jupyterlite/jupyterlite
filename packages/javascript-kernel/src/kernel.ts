import { KernelMessage } from '@jupyterlab/services';

import { BaseKernel, Kernel } from '@jupyterlite/kernel';

import { PromiseDelegate } from '@lumino/coreutils';

/**
 * A kernel that executes code in an IFrame.
 */
export class JavaScriptKernel extends BaseKernel implements Kernel.IKernel {
  /**
   * Instantiate a new JavaScriptKernel
   *
   * @param options The instantiation options for a new JavaScriptKernel
   */
  constructor(options: BaseKernel.IOptions) {
    super(options);

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
          window.parent.postMessage(msg);
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
        if (msg.event === 'stream') {
          const content = msg as KernelMessage.IStreamMsg['content'];
          this.stream(content);
        }
      });
    });
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
    const result = this._eval(code);
    // TODO: move executeResult and executeError here
    return {
      execution_count: this.executionCount,
      data: {
        'text/plain': result
      },
      metadata: {}
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
    // naive completion on window names only
    // TODO: improve and move logic to the iframe
    const vars = this._evalFunc(
      this._iframe.contentWindow,
      'Object.keys(window)'
    ) as string[];
    const { code, cursor_pos } = content;
    const words = code.slice(0, cursor_pos).match(/(\w+)$/) ?? [];
    const word = words[0] ?? '';
    const matches = vars.filter(v => v.startsWith(word));

    return {
      matches,
      cursor_start: cursor_pos - word.length,
      cursor_end: cursor_pos,
      metadata: {},
      status: 'ok'
    };
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

  private _iframe: HTMLIFrameElement;
  private _iframes: HTMLIFrameElement[] = [];
  private _evalFunc = new Function(
    'window',
    'code',
    'return window.eval(code);'
  );
}
