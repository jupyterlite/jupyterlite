import { IJavaScriptWorkerKernel } from './tokens';

export class JavaScriptRemoteKernel {
  /**
   * Initialize the remote kernel.
   *
   * @param options The options for the kernel.
   */
  async initialize(options: IJavaScriptWorkerKernel.IOptions) {
    console.log = function (...args) {
      const bundle = {
        name: 'stdout',
        text: args.join(' ') + '\n',
      };
      postMessage({
        type: 'stream',
        bundle,
      });
    };
    console.info = console.log;

    console.error = function (...args) {
      const bundle = {
        name: 'stderr',
        text: args.join(' ') + '\n',
      };
      postMessage({
        type: 'stream',
        bundle,
      });
    };
    console.warn = console.error;

    self.onerror = function (message, source, lineno, colno, error) {
      console.error(message);
    };
  }

  /**
   * Execute code in the worker kernel.
   */
  async execute(content: any, parent: any) {
    const { code } = content;
    try {
      const result = self.eval(code);
      this._executionCount++;

      const bundle = {
        data: {
          'text/plain': result,
        },
        metadata: {},
        execution_count: this._executionCount,
      };
      postMessage({
        bundle,
        type: 'execute_result',
      });

      return {
        status: 'ok',
        user_expressions: {},
      };
    } catch (e) {
      const { name, stack, message } = e as any as Error;
      const bundle = {
        ename: name,
        evalue: message,
        traceback: [`${stack}`],
      };

      postMessage({
        bundle,
        type: 'execute_error',
      });

      return {
        status: 'error',
        ename: name,
        evalue: message,
        traceback: [`${stack}`],
      };
    }
  }

  /**
   * Handle the complete message
   */
  async complete(content: any, parent: any) {
    // naive completion on window names only
    // TODO: improve and move logic to the iframe
    const vars = Object.getOwnPropertyNames(self);
    const { code, cursor_pos } = content;
    const words = code.slice(0, cursor_pos).match(/(\w+)$/) ?? [];
    const word = words[0] ?? '';
    const matches = vars.filter((v) => v.startsWith(word));

    return {
      matches,
      cursor_start: cursor_pos - word.length,
      cursor_end: cursor_pos,
      metadata: {},
      status: 'ok',
    };
  }

  private _executionCount = 0;
}
