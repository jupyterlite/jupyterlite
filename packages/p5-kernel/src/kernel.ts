import { KernelMessage } from '@jupyterlab/services';

import { IKernel } from '@jupyterlite/kernel';

import { JavaScriptKernel } from '@jupyterlite/javascript-kernel';

import { PromiseDelegate } from '@lumino/coreutils';

/**
 * The mimetype for mime bundle results
 */
const MIME_TYPE = 'text/html-sandboxed';

/**
 * A kernel that executes code in an IFrame.
 */
export class P5Kernel extends JavaScriptKernel implements IKernel {
  /**
   * Instantiate a new P5Kernel.
   *
   * @param options The instantiation options for a new P5Kernel.
   */
  constructor(options: P5Kernel.IOptions) {
    super(options);
    const { p5Url } = options;
    this._bootstrap = `
      import('${p5Url}').then(() => {
        // create the p5 global instance
        window.__globalP5 = new p5();
        return Promise.resolve();
      })
    `;
    // wait for the parent IFrame to be ready
    super.ready.then(() => {
      this._eval(this._bootstrap);
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
          url: 'https://github.com/jupyterlite/jupyterlite'
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
  ): Promise<KernelMessage.IExecuteReplyMsg['content']> {
    const { code } = content;
    if (code.startsWith('%')) {
      const res = await this._magics(code);
      if (res) {
        this.publishExecuteResult(res);

        return {
          status: 'ok',
          execution_count: this.executionCount,
          user_expressions: {}
        };
      }
    }

    const res = super.executeRequest(content);
    this._inputs.push(code);

    return res;
  }

  /**
   * Handle magics coming from execute requests.
   *
   * @param code The code block to handle.
   */
  private async _magics(
    code: string
  ): Promise<KernelMessage.IExecuteResultMsg['content'] | undefined> {
    if (code.startsWith('%show')) {
      const input = this._inputs.map(c => `window.eval(\`${c}\`);`).join('\n');
      const script = `
        ${this._bootstrap}.then(() => {
          ${input}
          window.__globalP5._start();
        })
      `;

      // add metadata
      const re = /^%show(?: (.+)\s+(.+))?\s*$/;
      const matches = code.match(re);
      const width = matches?.[1] ?? undefined;
      const height = matches?.[2] ?? undefined;
      return {
        execution_count: this.executionCount,
        data: {
          [MIME_TYPE]: [
            '<body style="overflow: hidden;">',
            `<script>${script}</script>`,
            '</body>'
          ].join('\n')
        },
        metadata: {
          [MIME_TYPE]: {
            width,
            height
          }
        }
      };
    }
  }

  private _bootstrap = '';
  private _inputs: string[] = [];
  private _p5Ready = new PromiseDelegate<void>();
}

/**
 * A namespace for P5Kernel statics.
 */
export namespace P5Kernel {
  /**
   * The instantiation options for a P5Kernel
   */
  export interface IOptions extends IKernel.IOptions {
    /**
     * The URL to fetch p5.js
     */
    p5Url: string;
  }
}
