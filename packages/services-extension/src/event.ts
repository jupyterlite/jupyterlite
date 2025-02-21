// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { Event, ServerConnection } from '@jupyterlab/services';

import { Signal, Stream } from '@lumino/signaling';

/**
 * A local event manager service.
 *
 * #### Notes
 * Schema IDs are not verified and all client-emitted events emit.
 */
export class LocalEventManager implements Event.IManager {
  /**
   * Construct a new event manager.
   */
  constructor(options: { serverSettings?: ServerConnection.ISettings }) {
    this._serverSettings = options.serverSettings ?? ServerConnection.makeSettings();
    this._stream = new Stream(this);
  }

  /**
   * Dispose of the resources used by the manager.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._isDisposed = true;
    Signal.clearData(this);
    this._stream.stop();
  }

  /**
   * Whether the manager is disposed.
   */
  get isDisposed(): boolean {
    return this._isDisposed;
  }

  /**
   * The stream of events.
   */
  get stream() {
    return this._stream;
  }

  /**
   * The server settings.
   */
  get serverSettings(): ServerConnection.ISettings {
    return this._serverSettings;
  }

  /**
   * Emit an event for all listeners.
   */
  async emit({ data, schema_id }: Event.Request): Promise<void> {
    this._stream.emit({ ...data, schema_id });
  }

  private _isDisposed = false;
  private _serverSettings: ServerConnection.ISettings;
  private _stream: Stream<this, Event.Emission>;
}
