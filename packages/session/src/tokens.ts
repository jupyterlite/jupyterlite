import { Session } from '@jupyterlab/services';

import { Token } from '@lumino/coreutils';

/**
 * The token for the sessions service.
 */
export const ISessions = new Token<ISessions>('@jupyterlite/session:ISessions');

/**
 * The interface for the sessions services.
 */
export interface ISessions {
  /**
   * Path an existing session.
   * This can be used to rename a session.
   *
   * @param options The options to patch the session.
   */
  patch: (options: Session.IModel) => Session.IModel;

  /**
   * Start a new session.
   *
   * @param options The options to start a new session.
   */
  startNew: (options: Session.IModel) => Session.IModel;
}
