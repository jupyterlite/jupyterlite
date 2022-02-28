import { Token } from '@lumino/coreutils';
import { ISessionContext } from '@jupyterlab/apputils';
import { ConsolePanel } from '@jupyterlab/console';
import { ReadonlyJSONObject } from '@lumino/coreutils';
import { JupyterFrontEnd } from '@jupyterlab/application';

/**
 * The token for the REPL API service.
 */
export const IReplUrlParams = new Token<IReplUrlParams>(
  '@jupyterlite/repl:IReplUrlParams'
);

/**
 * An extensible API for the REPL app
 */
export interface IReplUrlParams extends IReplEvents {
  /**
   *
   * @param param the GET parameter to expose
   * @param schema a JSON Schema describing the params
   * @param options events and options to be modified by the parameter
   */
  addUrlParam(param: string, options: IReplUrlOptions): void;

  /**
   * Retrieve the current JSON Schema for the URL params
   */
  getUrlSchema(): Promise<IParamAPISchema>;

  /**
   * The URL params at the time the API was created.
   */
  defaultParams: URLSearchParams;
}

/**
 * REPL lifecyle events that could be modified by a UrL param.
 */
export interface IReplEvents {
  /**
   * Modify the app after it has fully started.
   */
  afterAppStarted(app: JupyterFrontEnd, params?: URLSearchParams): Promise<void>;

  /**
   * Modify the console creation options, such as by `kernel`
   */
  beforeConsoleCreated(
    args: ICreateConsoleCommandArgs,
    params?: URLSearchParams
  ): Promise<ICreateConsoleCommandArgs>;

  /**
   * Modify the console after it's added to the tracker.
   */
  afterConsoleCreated(widget: ConsolePanel, params?: URLSearchParams): Promise<void>;
}

/**
 * Options for a single URL param
 */
export interface IReplUrlOptions extends Partial<IReplEvents> {
  /**
   * Modify the console creation options, such as by `kernel`
   */
  schema(): Promise<IParamSchema>;

  /**
   * Order in which to evaluate params, with a name tiebreaker.
   */
  rank?: number;
}

/**
 * The args accepted by the `console:create` JupyterLab command.
 */
export interface ICreateConsoleCommandArgs {
  cwd?: string;
  basePath?: string;
  kernelPreference?: ISessionContext.IKernelPreference;
}

/**
 * The schema for a single arg. If a string, duplicate param values will be discarded.
 */
export interface IParamSchema extends ReadonlyJSONObject {
  title: string;
  description: string;
  [key: string]: any;
}

/**
 * The schema for the overall API.
 */
export interface IParamAPISchema extends ReadonlyJSONObject {
  type: 'object';
  title: string;
  description: string;
  properties: { [key: string]: IParamSchema };
}
