// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { ReactWidget } from '@jupyterlab/apputils';

import type { ITranslator } from '@jupyterlab/translation';

import React from 'react';

/**
 * A widget for displaying a dialog to clear browser data
 */
export class ClearDataDialog extends ReactWidget {
  /**
   * Create a new clear data dialog
   *
   * @param options - The options for creating the dialog
   */
  constructor(options: ClearDataDialog.IClearDataDialogOptions) {
    super();
    this._translator = options.translator;
    this._availability = options.availability || {
      canClearSettings: true,
      canClearContents: true,
      canClearWorkspaces: true,
    };
    this._settingsChecked = this._availability.canClearSettings;
    this._contentsChecked = this._availability.canClearContents;
    this._workspacesChecked = this._availability.canClearWorkspaces;
    this.addClass('jp-ClearData-dialog');
  }

  /**
   * Get the current options selected by the user
   */
  getValue(): ClearDataDialog.IClearOptions {
    return {
      clearSettings: this._settingsChecked && this._availability.canClearSettings,
      clearContents: this._contentsChecked && this._availability.canClearContents,
      clearWorkspaces: this._workspacesChecked && this._availability.canClearWorkspaces,
    };
  }

  /**
   * Render the dialog content
   */
  protected render(): JSX.Element {
    return (
      <ClearDataDialogComponent
        translator={this._translator}
        settingsChecked={this._settingsChecked}
        contentsChecked={this._contentsChecked}
        workspacesChecked={this._workspacesChecked}
        availability={this._availability}
        setSettingsChecked={(checked: boolean) => {
          this._settingsChecked = checked;
          this.update();
        }}
        setContentsChecked={(checked: boolean) => {
          this._contentsChecked = checked;
          this.update();
        }}
        setWorkspacesChecked={(checked: boolean) => {
          this._workspacesChecked = checked;
          this.update();
        }}
      />
    );
  }

  private _translator: ITranslator;
  private _settingsChecked: boolean;
  private _contentsChecked: boolean;
  private _workspacesChecked: boolean;
  private _availability: ClearDataDialog.IClearAvailability;
}

/**
 * A namespace for ClearDataDialog statics
 */
export namespace ClearDataDialog {
  /**
   * Interface for the clear options
   */
  export interface IClearOptions {
    /**
     * Whether to clear settings
     */
    clearSettings: boolean;
    /**
     * Whether to clear contents
     */
    clearContents: boolean;
    /**
     * Whether to clear workspaces
     */
    clearWorkspaces: boolean;
  }

  /**
   * Interface for availability of clear options
   */
  export interface IClearAvailability {
    canClearSettings: boolean;
    canClearContents: boolean;
    canClearWorkspaces: boolean;
  }

  /**
   * Interface for ClearDataDialog constructor options
   */
  export interface IClearDataDialogOptions {
    /**
     * The translator instance
     */
    translator: ITranslator;

    /**
     * The availability of clear options
     */
    availability?: IClearAvailability;
  }
}

/**
 * Props for the ClearDataDialog component
 */
interface IClearDataDialogProps {
  translator: ITranslator;
  settingsChecked: boolean;
  contentsChecked: boolean;
  workspacesChecked: boolean;
  availability: ClearDataDialog.IClearAvailability;
  setSettingsChecked: (checked: boolean) => void;
  setContentsChecked: (checked: boolean) => void;
  setWorkspacesChecked: (checked: boolean) => void;
}

/**
 * A React component for displaying a dialog to clear browser data
 */
function ClearDataDialogComponent(props: IClearDataDialogProps): JSX.Element {
  const {
    translator,
    settingsChecked,
    contentsChecked,
    workspacesChecked,
    availability,
    setSettingsChecked,
    setContentsChecked,
    setWorkspacesChecked,
  } = props;

  const trans = translator.load('@jupyterlite');

  return (
    <div className="jp-ClearData-container">
      <div className="jp-ClearData-warning-box">
        <div className="jp-ClearData-warning-icon">⚠️</div>
        <div className="jp-ClearData-warning-text">
          <span className="jp-ClearData-warning-title">
            {trans.__('Warning: Data Loss Risk')}
          </span>
          <p>
            {trans.__(
              'Clearing browser data will permanently remove data stored in your browser. ' +
                'This operation cannot be undone and may result in loss of:',
            )}
          </p>
          <ul>
            <li>{trans.__('User settings and preferences')}</li>
            <li>{trans.__('Notebooks and files stored in the browser')}</li>
            <li>{trans.__('Workspace layouts and panel arrangements')}</li>
            <li>{trans.__('Unsaved work and changes')}</li>
          </ul>
        </div>
      </div>

      <div
        className={`jp-ClearData-option ${
          !availability.canClearSettings ? 'jp-mod-disabled' : ''
        }`}
      >
        <input
          id="jp-ClearData-settings"
          type="checkbox"
          checked={settingsChecked}
          onChange={(e) => setSettingsChecked(e.target.checked)}
          disabled={!availability.canClearSettings}
        />
        <label
          htmlFor="jp-ClearData-settings"
          className={!availability.canClearSettings ? 'jp-mod-disabled' : ''}
        >
          {trans.__('Settings and preferences')}
          {!availability.canClearSettings && (
            <span className="jp-ClearData-unavailable">
              {' '}
              {trans.__('(unavailable)')}
            </span>
          )}
        </label>
      </div>

      <div
        className={`jp-ClearData-option ${
          !availability.canClearContents ? 'jp-mod-disabled' : ''
        }`}
      >
        <input
          id="jp-ClearData-contents"
          type="checkbox"
          checked={contentsChecked}
          onChange={(e) => setContentsChecked(e.target.checked)}
          disabled={!availability.canClearContents}
        />
        <label
          htmlFor="jp-ClearData-contents"
          className={!availability.canClearContents ? 'jp-mod-disabled' : ''}
        >
          {trans.__('Files and notebooks')}
          {!availability.canClearContents && (
            <span className="jp-ClearData-unavailable">
              {' '}
              {trans.__('(unavailable)')}
            </span>
          )}
        </label>
      </div>

      <div
        className={`jp-ClearData-option ${
          !availability.canClearWorkspaces ? 'jp-mod-disabled' : ''
        }`}
      >
        <input
          id="jp-ClearData-workspaces"
          type="checkbox"
          checked={workspacesChecked}
          onChange={(e) => setWorkspacesChecked(e.target.checked)}
          disabled={!availability.canClearWorkspaces}
        />
        <label
          htmlFor="jp-ClearData-workspaces"
          className={!availability.canClearWorkspaces ? 'jp-mod-disabled' : ''}
        >
          {trans.__('Workspace layouts')}
          {!availability.canClearWorkspaces && (
            <span className="jp-ClearData-unavailable">
              {' '}
              {trans.__('(unavailable)')}
            </span>
          )}
        </label>
      </div>

      <div className="jp-ClearData-reload-notice">
        {trans.__('This will reload the page after clearing the selected data.')}
      </div>
    </div>
  );
}
