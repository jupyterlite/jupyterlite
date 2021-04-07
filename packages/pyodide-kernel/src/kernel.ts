import { KernelMessage } from '@jupyterlab/services';

import { BaseKernel, IKernel } from '@jupyterlite/kernel';

import { PromiseDelegate } from '@lumino/coreutils';

/**
 * A kernel that executes Python code with Pyodide.
 */
export class PyodideKernel extends BaseKernel implements IKernel {
  /**
   * Instantiate a new PyodideKernel
   *
   * @param options The instantiation options for a new PyodideKernel
   */
  constructor(options: IKernel.IOptions) {
    super(options);
    const blob = new Blob([Private.WORKER_SCRIPT]);
    this._worker = new Worker(window.URL.createObjectURL(blob));
    this._worker.onmessage = e => {
      this._processWorkerMessage(e.data);
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
    super.dispose();
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
        let dataObj: any = {
          'text/plain': msg.result
        };
        if (msg.renderHtml) {
          dataObj = {
            'text/html': msg.result
          };
        }
        this._executeDelegate.resolve({
          data: {
            ...dataObj
          },
          metadata: {}
        });
        break;
      }
      default:
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
      banner: 'Pyodide: A WebAssembly-powered Python kernel',
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
    this._executeDelegate = new PromiseDelegate<any>();
    this._eval(code);
    const result = await this._executeDelegate.promise;
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
   * Execute code in the kernel IFrame.
   *
   * @param code The code to execute.
   */
  private _eval(code: string): void {
    this._worker.postMessage({
      code
    });
  }

  private _executeDelegate = new PromiseDelegate<any>();
  private _worker: Worker;
}

namespace Private {
  // TODO: move most of the inner logic to a separate Python file
  // that would be loaded on startup by Pyodide
  export const WORKER_SCRIPT = `
    importScripts("https://pyodide-cdn2.iodide.io/v0.15.0/full/pyodide.js");
    addEventListener("message", ({ data }) => {
      languagePluginLoader.then(() => {
          pyodide.loadPackage([]).then(() => {
          const keys = Object.keys(data);
          for (let key of keys) {
              if (key !== "code") {
                self[key] = data[key];
              }
          }
          console.log("Inside worker", data);
          pyodide.runPython(
            "import io, code, sys; sys.stdout = io.StringIO(); sys.stderr = io.StringIO()"
          )
          let msgType = 'results';
          let renderHtml = false;
          pyodide
              .runPythonAsync(data.code, (ev) => {
                console.log(ev);
              })
              .then((results) => {
                let stdo = pyodide.runPython("sys.stdout.getvalue()")
                if (stdo !== "") {
                  msgType = 'stdout';
                }
                let stde = pyodide.runPython("sys.stderr.getvalue()")
                if (stde !== "") {
                  msgType = 'stderr';
                }
                // hack to support rendering of pandas dataframes.
                if (typeof results === 'function' && pyodide._module.PyProxy.isPyProxy(results)) {
                  try {
                    results = results._repr_html_();
                    renderHtml = true;
                  } catch {
                    results = String(results)
                  }
                }
                postMessage({ result: results, parentHeader: data.parentHeader, stdout: stdo, stderr: stde,
                              type: msgType, msg: data.message, renderHtml: renderHtml });
              })
              .catch((error) => {
                  msgType = 'stderr';
                  postMessage({ stderr: error, type: msgType, msg: data.message });
              });
          }).catch(error => {
            msgType = 'stderr';
            postMessage({ error: true, stderr: error, type: msgType, msg: data.message });
          });
      });
    });
  `;
}
