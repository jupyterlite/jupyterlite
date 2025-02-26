import { Session } from '@jupyterlab/services';

import { Token } from '@lumino/coreutils';

/**
 * The token for the sessions service.
 */
export const ISessionStore = new Token<ISessionStore>(
  '@jupyterlite/session:ISessionStore',
);

/**
 * The interface for the sessions services.
 */
export interface ISessionStore {
  /**
   * Get a session by id.
   *
   * @param id The id of the session.
   */
  get(id: string): Promise<Session.IModel>;

  /**
   * List the running sessions
   */
  list(): Promise<Session.IModel[]>;

  /**
   * Path an existing session.
   * This can be used to rename a session.
   *
   * @param options The options to patch the session.
   */
  patch: (options: Partial<Session.IModel>) => Promise<Session.IModel>;

  /**
   * Start a new session.
   *
   * @param options The options to start a new session.
   */
  startNew: (options: Session.ISessionOptions) => Promise<Session.IModel>;

  /**
   * Shut down a session.
   *
   * @param id The id of the session to shut down.
   */
  shutdown: (id: string) => Promise<void>;

  /**
   * Shut down all sessions.
   */
  shutdownAll: () => Promise<void>;
}
