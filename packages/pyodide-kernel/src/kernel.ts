import { KernelMessage } from '@jupyterlab/services';

import { BaseKernel, IKernel } from '@jupyterlite/kernel';

import { PromiseDelegate } from '@lumino/coreutils';

/**
 * A kernel that executes code in an IFrame.
 */
export class PyodideKernel extends BaseKernel implements IKernel {
  /**
   * Instantiate a new PyodideKernel
   *
   * @param options The instantiation options for a new JavaScriptKernel
   */
  constructor(options: IKernel.IOptions) {
    super(options);

    // create the main IFrame
    this._iframe = document.createElement('iframe');
    this._iframe.style.visibility = 'hidden';
    document.body.appendChild(this._iframe);

    this._initIFrame(this._iframe).then(() => {
      // TODO: handle kernel ready
      window.addEventListener('message', (e: MessageEvent) => {
        console.log('iFrame message: ', e);
        const msg = e.data;
        this._processWorkerMessage(msg);
      });
    });
  }

  private _processWorkerMessage(msg: any): void {
    const parentHeader = msg.parentHeader as KernelMessage.IHeader<
      KernelMessage.MessageType
    >;
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
        const { name, stack, message } = msg.stderr;
        const error = {
          ename: name,
          evalue: message,
          traceback: [stack]
        };
        this._error(msg, error);
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
        version: '3.8'
      },
      protocol_version: '5.3',
      status: 'ok',
      banner: 'A WebAssembly-powered Python kernel',
      help_links: [
        {
          text: 'Pyhthon (WASM) Kernel',
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
    content: KernelMessage.IExecuteRequestMsg['content'],
    // TODO: remove?
    msg?: KernelMessage.IMessage
  ): Promise<KernelMessage.IExecuteResultMsg['content']> {
    const { code } = content;
    // store previous parent header
    this._jsFunc(
      this._iframe.contentWindow,
      `window._parentHeader = ${JSON.stringify(msg?.header ?? '')};`
    );

    this._executeDelegate = new PromiseDelegate<any>();
    this._eval(code);
    const result = await this._executeDelegate.promise;
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
   * Send a `history_request` message.
   *
   * @param content - The content of the request.
   *
   * @returns A promise that resolves with the response message.
   */
  async historyRequest(
    content: KernelMessage.IHistoryRequestMsg['content']
  ): Promise<KernelMessage.IHistoryReplyMsg['content']> {
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
    this._evalFunc(this._iframe.contentWindow, code);
  }

  /**
   * Create a new IFrame
   *
   * @param iframe The IFrame to initialize.
   */
  private async _initIFrame(
    iframe: HTMLIFrameElement
  ): Promise<HTMLIFrameElement | undefined> {
    console.log('Initialized iFrame.');
    const delegate = new PromiseDelegate<void>();
    if (!iframe.contentWindow) {
      delegate.reject('IFrame not ready');
      return;
    }
    const doc = iframe.contentWindow.document;

    const workerScript = doc.createElement('script');
    workerScript.type = 'javascript/worker';
    workerScript.id = 'worker1';
    workerScript.textContent = `
    importScripts("https://pyodide-cdn2.iodide.io/v0.15.0/full/pyodide.js");
    addEventListener("message", ({ data }) => {
      languagePluginLoader.then(() => {
          pyodide.loadPackage([]).then(() => {
          const keys = Object.keys(data);
          for (let key of keys) {
              if (key !== "python") {
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
              .runPythonAsync(data.python, (ev) => {
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
            postMessage({ stderr: error, type: msgType, msg: data.message });
          });
      });
    });
    `;

    doc.head.appendChild(workerScript);
    const initScript = doc.createElement('script');
    initScript.textContent = `
    console.log("Webworker script injected successfully");
    const blob = new Blob([document.querySelector('#worker1').textContent]);
    window.worker = new Worker(window.URL.createObjectURL(blob));
    window._bubbleUp = function(msg) {
      window.parent.postMessage({
        ...msg,
        "parentHeader": window._parentHeader
      });
    }
    // Forwarding messages from the WebWorker up to the iframe.
    window.worker.onmessage = e => {
      window._bubbleUp({
        ...e.data,
      });
    }
    `;
    doc.head.appendChild(initScript);

    delegate.resolve();
    await delegate.promise;
    return iframe;
  }

  private _iframe: HTMLIFrameElement;
  private _jsFunc = new Function('window', 'code', 'return window.eval(code);');
  private _evalFunc = new Function(
    'window',
    'code',
    'msg',
    'return window.worker.postMessage({ python:code, parentHeader:window._parentHeader, message: msg });'
  );
  private _executeDelegate = new PromiseDelegate<any>();
}
