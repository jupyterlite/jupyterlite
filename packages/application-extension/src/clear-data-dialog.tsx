// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { ReactWidget } from '@jupyterlab/apputils';

import { ITranslator } from '@jupyterlab/translation';

import React from 'react';

/**
 * Interface for the clear options
 */
export interface IClearOptions {
  clearSettings: boolean;
  clearContents: boolean;
}

/**
 * Interface for availability of clear options
 */
export interface IClearAvailability {
  canClearSettings: boolean;
  canClearContents: boolean;
}

/**
 * Props for the ClearDataDialog component
 */
interface IClearDataDialogProps {
  translator: ITranslator;
  settingsChecked: boolean;
  contentsChecked: boolean;
  availability: IClearAvailability;
  setSettingsChecked: (checked: boolean) => void;
  setContentsChecked: (checked: boolean) => void;
}

/**
 * A React component for displaying a dialog to clear browser data
 */
function ClearDataDialogComponent(props: IClearDataDialogProps): JSX.Element {
  const {
    translator,
    settingsChecked,
    contentsChecked,
    availability,
    setSettingsChecked,
    setContentsChecked,
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

      <div className="jp-ClearData-reload-notice">
        {trans.__('This will reload the page after clearing the selected data.')}
      </div>
    </div>
  );
}

/**
 * A widget for displaying a dialog to clear browser data
 */
export class ClearDataDialog extends ReactWidget {
  /**
   * Create a new clear data dialog
   *
   * @param translator - The translator instance
   * @param availability - The availability of clear options
   */
  constructor(
    translator: ITranslator,
    availability: IClearAvailability = {
      canClearSettings: true,
      canClearContents: true,
    },
  ) {
    super();
    this._translator = translator;
    this._settingsChecked = availability.canClearSettings;
    this._contentsChecked = availability.canClearContents;
    this._availability = availability;
    this.addClass('jp-ClearData-dialog');
  }

  /**
   * Get the current options selected by the user
   */
  getValue(): IClearOptions {
    return {
      clearSettings: this._settingsChecked && this._availability.canClearSettings,
      clearContents: this._contentsChecked && this._availability.canClearContents,
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
        availability={this._availability}
        setSettingsChecked={(checked: boolean) => {
          this._settingsChecked = checked;
          this.update();
        }}
        setContentsChecked={(checked: boolean) => {
          this._contentsChecked = checked;
          this.update();
        }}
      />
    );
  }

  private _translator: ITranslator;
  private _settingsChecked: boolean;
  private _contentsChecked: boolean;
  private _availability: IClearAvailability;
}
