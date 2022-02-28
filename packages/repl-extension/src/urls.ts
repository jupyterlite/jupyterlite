import { ConsolePanel } from '@jupyterlab/console';
import { TranslationBundle } from '@jupyterlab/translation';
import {
  IParamAPISchema,
  IParamSchema,
  IReplApi,
  IReplUrlOptions,
  IReplEvents,
  ICreateConsoleCommandArgs,
} from './tokens';
import { PromiseDelegate } from '@lumino/coreutils';

export class ReplApi implements IReplApi {
  constructor(options: ReplAPI.IOptions) {
    this.title = options.title || 'REPL URL Params';
    this.description = options.description || 'The accepted API options for the REPL';
    this.trans = options.trans;
  }

  addUrlParam(param: string, options: IReplUrlOptions): void {
    if (this.params.has(param)) {
      throw new Error(this.trans.__(`%1 already registered`, param));
    }
    this.params.set(param, options);
  }

  async getUrlSchema(): Promise<IParamAPISchema> {
    const properties: Record<string, IParamSchema> = {};

    for (let [key, options] of this.params.entries()) {
      const schema = await options.schema();
      properties[key] = {
        ...schema,
        title: this.trans.__(schema.title),
        description: this.trans.__(schema.description),
      };
    }

    return {
      title: this.trans.__(this.title),
      description: this.trans.__(this.description),
      type: 'object',
      properties,
    };
  }

  rankCompare(...params: [string, IReplUrlOptions][]) {
    const [k0, opt0] = params[0];
    const [k1, opt1] = params[1];
    return (opt0.rank || 0) - (opt1.rank || 0) || k0.localeCompare(k1);
  }

  get sortedParams() {
    const params = [...this.params.entries()];
    params.sort(this.rankCompare);
    return params;
  }

  protected async forEachParam<T extends keyof IReplEvents, U extends any>(
    memo: U,
    event: T,
    handler: (memo: U, eventHandler: IReplUrlOptions[T]) => U,
    handleError: (key: string, err: unknown) => string
  ): Promise<U> {
    for (const [key, options] of this.sortedParams) {
      const eventHandler = options[event];
      if (eventHandler != null) {
        try {
          memo = await handler(memo, eventHandler);
        } catch (err) {
          console.error(handleError(key, err));
        }
      }
    }

    return memo;
  }

  async createConsoleArgs(
    params: URLSearchParams,
    args: ICreateConsoleCommandArgs
  ): Promise<ICreateConsoleCommandArgs> {
    const delegate = new PromiseDelegate<ICreateConsoleCommandArgs>();

    const argPromise = this.forEachParam<
      'createConsoleArgs',
      Promise<ICreateConsoleCommandArgs>
    >(
      delegate.promise,
      'createConsoleArgs',
      async (memoArgs, handler) => {
        let memoValue = await memoArgs;
        memoValue = handler ? await handler(params, memoValue) : memoValue;
        return memoValue;
      },
      (key, err) => {
        return this.trans.__('%1 failed to update create console args: %2', key, err);
      }
    );

    delegate.resolve(args);

    const resultArgs = await argPromise;
    return resultArgs;
  }

  async consoleCreated(params: URLSearchParams, widget: ConsolePanel): Promise<void> {
    await this.forEachParam<'consoleCreated', void>(
      void 0,
      'consoleCreated',
      async (memo, handler) => {
        handler ? await handler(params, widget) : void 0;
        return memo;
      },
      (key, err) => {
        return this.trans.__('%1 failed to update console: %2', key, err);
      }
    );
  }

  /**
   * The currrently-registered params.
   */
  protected params = new Map<string, IReplUrlOptions>();

  /**
   * Title of the API.
   */
  protected title: string;

  /**
   * Description of the API.
   */
  protected description: string;

  /**
   * Helper for internationalization features.
   */
  protected trans: TranslationBundle;
}

export namespace ReplAPI {
  export interface IOptions {
    trans: TranslationBundle;
    title?: string;
    description?: string;
  }
}
