import { Token } from '@lumino/coreutils';
import { ISessionContext } from '@jupyterlab/apputils';
import { ConsolePanel } from '@jupyterlab/console';
import { ReadonlyJSONObject } from '@lumino/coreutils';

/**
 * The token for the REPL API service.
 */
export const IReplApi = new Token<IReplApi>('@jupyterlite/repl:IReplAPI');

/**
 * An extensible API for the REPL app
 */
export interface IReplApi extends IReplEvents {
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
}

/**
 * REPL lifecyle events that could be modified by a UrL param.
 */
export interface IReplEvents {
  /**
   * Modify the console creation options, such as by `kernel`
   */
  createConsoleArgs(
    params: URLSearchParams,
    args: ICreateConsoleCommandArgs
  ): Promise<ICreateConsoleCommandArgs>;

  /**
   * Modify the console created.
   */
  consoleCreated(params: URLSearchParams, widget: ConsolePanel): Promise<void>;
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
