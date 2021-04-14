import { KernelMessage } from '@jupyterlab/services';

import { IKernel } from '@jupyterlite/kernel';

import { JavaScriptKernel } from '@jupyterlite/javascript-kernel';

import { PromiseDelegate } from '@lumino/coreutils';

const BOOTSTRAP = `
import('https://cdn.jsdelivr.net/npm/p5@1.3.1/lib/p5.js').then(() => {
  // create the p5 global instance
  new p5();
  var body = document.body;
  body.style.margin = 0;
  body.style.padding = 0;
  body.style.overflow = "hidden";
});
`;

/**
 * A kernel that executes code in an IFrame.
 */
export class P5Kernel extends JavaScriptKernel implements IKernel {
  /**
   * Instantiate a new P5Kernel.
   *
   * @param options The instantiation options for a new P5Kernel.
   */
  constructor(options: IKernel.IOptions) {
    super(options);
    // wait for the parent IFrame to be ready
    super.ready.then(() => {
      this._eval(BOOTSTRAP);
      this._p5Ready.resolve();
    });
  }

  /**
   * A promise that is fulfilled when the kernel is ready.
   */
  get ready(): Promise<void> {
    return this._p5Ready.promise;
  }

  /**
   * Handle a kernel_info_request message
   */
  async kernelInfoRequest(): Promise<KernelMessage.IInfoReplyMsg['content']> {
    const content: KernelMessage.IInfoReply = {
      implementation: 'p5.js',
      implementation_version: '0.1.0',
      language_info: {
        codemirror_mode: {
          name: 'javascript'
        },
        file_extension: '.js',
        mimetype: 'text/javascript',
        name: 'p5js',
        nbconvert_exporter: 'javascript',
        pygments_lexer: 'javascript',
        version: 'es2017'
      },
      protocol_version: '5.3',
      status: 'ok',
      banner: 'A p5.js kernel',
      help_links: [
        {
          text: 'p5.js Kernel',
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

  private _p5Ready = new PromiseDelegate<void>();
}
