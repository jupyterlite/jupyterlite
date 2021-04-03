import { Token } from '@lumino/coreutils';

import { Session } from '@jupyterlab/services';

/**
 * The token for the sessions service.
 */
export const ISessions = new Token<ISessions>('@jupyterlite/session:ISessions');

export interface ISessions {
  patch: (options: Session.IModel) => Session.IModel;
  startNew: (options: Session.IModel) => Session.IModel;
}
