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
import { JupyterFrontEnd } from '@jupyterlab/application';

/**
 * A class for managing the extensible events in the REPL app startup lifecycle.
 */
export class ReplApi implements IReplApi {
  constructor(options: ReplApi.IOptions) {
    this.title = options.title || 'REPL URL Params';
    this.description = options.description || 'The accepted API options for the REPL';
    this.trans = options.trans;
    this.defaultParams = options.defaultParams;
  }

  /**
   * Register a new param that can modify various lifecycle stages.
   */
  addUrlParam(param: string, options: IReplUrlOptions): void {
    if (this.params.has(param)) {
      throw new Error(this.trans.__('%1 already registered', param));
    }
    this.params.set(param, options);
  }

  /**
   * Return the current URL schema.
   */
  async getUrlSchema(): Promise<IParamAPISchema> {
    const properties: Record<string, IParamSchema> = {};

    for (const [key, options] of this.params.entries()) {
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

  /**
   * Parameter-based actions to run after the app is loaded, along with all plugins.
   */
  async afterAppStarted(app: JupyterFrontEnd, params?: URLSearchParams): Promise<void> {
    const delegate = new PromiseDelegate<JupyterFrontEnd>();

    const startedPromise = this.forEachParam<
      'afterAppStarted',
      Promise<JupyterFrontEnd>
    >(
      delegate.promise,
      'afterAppStarted',
      async (memo, handler) => {
        handler ? await handler(app, params || this.defaultParams) : void 0;
        return memo;
      },
      (key, err) => {
        return this.trans.__('%1 failed to update app: %2', key, err);
      }
    );

    delegate.resolve(app);

    await startedPromise;
  }

  /**
   * Parameter-based modifications to the initiail arguments for the console.
   */
  async beforeConsoleCreated(
    args: ICreateConsoleCommandArgs,
    params?: URLSearchParams
  ): Promise<ICreateConsoleCommandArgs> {
    const delegate = new PromiseDelegate<ICreateConsoleCommandArgs>();

    const argPromise = this.forEachParam<
      'beforeConsoleCreated',
      Promise<ICreateConsoleCommandArgs>
    >(
      delegate.promise,
      'beforeConsoleCreated',
      async (memoArgs, handler) => {
        let memoValue = await memoArgs;
        memoValue = handler
          ? await handler(memoValue, params || this.defaultParams)
          : memoValue;
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

  /**
   * Parameter-based actions to run after the console is ready for user interaction.
   */
  async afterConsoleCreated(
    widget: ConsolePanel,
    params?: URLSearchParams
  ): Promise<void> {
    await this.forEachParam<'afterConsoleCreated', void>(
      void 0,
      'afterConsoleCreated',
      async (memo, handler) => {
        handler ? await handler(widget, params || this.defaultParams) : void 0;
        return memo;
      },
      (key, err) => {
        return this.trans.__('%1 failed to update console: %2', key, err);
      }
    );
  }

  /**
   * Sort map entries based on rank and then name
   */
  protected rankCompare(...params: [string, IReplUrlOptions][]) {
    const [k0, opt0] = params[0];
    const [k1, opt1] = params[1];
    return (opt0.rank || 0) - (opt1.rank || 0) || k0.localeCompare(k1);
  }

  /**
   * A convenience getter for the params, sorted by rank and then name.
   */
  protected get sortedParams() {
    const params = [...this.params.entries()];
    params.sort(this.rankCompare);
    return params;
  }

  /**
   * Reduce-like helper for handling hooks, etc.
   */
  protected async forEachParam<T extends keyof IReplEvents, U>(
    memo: U,
    event: T,
    handler: (memo: U, eventHandler: IReplUrlOptions[T]) => U,
    handleError: (key: string, err: unknown) => string
  ): Promise<U> {
    for (const [key, options] of this.sortedParams) {
      const eventHandler = options[event];
      if (eventHandler) {
        try {
          memo = await handler(memo, eventHandler);
        } catch (err) {
          console.error(handleError(key, err));
        }
      }
    }

    return memo;
  }

  /**
   * The URL params at the time the API was created.
   */
  defaultParams: URLSearchParams;

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

export namespace ReplApi {
  export interface IOptions {
    trans: TranslationBundle;
    title?: string;
    description?: string;
    defaultParams: URLSearchParams;
  }
}
