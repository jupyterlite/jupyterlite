import { Contents } from '@jupyterlab/services';

import { Token } from '@lumino/coreutils';

/**
 * The token for the settings service.
 */
export const IContents = new Token<IContents>('@jupyterlite/contents:IContents');

/**
 * The interface for the contents service.
 */
export interface IContents extends Contents.IManager {}
