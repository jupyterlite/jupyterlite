// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import type { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';

import type { ISessionContext } from '@jupyterlab/apputils';
import { IToolbarWidgetRegistry, ReactWidget } from '@jupyterlab/apputils';

import type { NotebookPanel } from '@jupyterlab/notebook';

import type { ILogOutputModel } from '@jupyterlab/logconsole';
import { ILoggerRegistry } from '@jupyterlab/logconsole';

import type { ISignal } from '@lumino/signaling';
import { Signal } from '@lumino/signaling';

import React, { useState, useEffect } from 'react';
import { ITranslator, nullTranslator } from '@jupyterlab/translation';

/**
 * Track the current execution status of a kernel.
 */
export class KernelStatus {
  /**
   * Current display status of the kernel.
   */
  get status(): ISessionContext.KernelDisplayStatus {
    return this._status;
  }

  /**
   * Whether the session currently has no kernel (e.g. after a shutdown).
   *
   * This is tracked separately from the status because a session reports the
   * 'unknown' status both while a kernel is starting up (a kernel is present
   * but has not reported its status yet) and when there is no kernel at all.
   */
  get hasNoKernel(): boolean {
    return this._hasNoKernel;
  }

  /**
   * Signal emitted when the status or kernel presence changes.
   */
  get changed(): ISignal<this, void> {
    return this._changed;
  }

  /**
   * Set the current display status and whether a kernel is present.
   */
  setStatus(status: ISessionContext.KernelDisplayStatus, hasNoKernel: boolean): void {
    if (this._status === status && this._hasNoKernel === hasNoKernel) {
      return;
    }
    this._status = status;
    this._hasNoKernel = hasNoKernel;
    this._changed.emit();
  }

  private _status: ISessionContext.KernelDisplayStatus = 'unknown';
  private _hasNoKernel = true;
  private _changed = new Signal<this, void>(this);
}

/**
 * A React component for displaying kernel status.
 */
function KernelStatusComponent(props: {
  model: KernelStatus;
  onClick?: () => void;
  translator: ITranslator;
}): JSX.Element {
  const [, forceUpdate] = useState({});
  const trans = props.translator.load('jupyterlite');
  useEffect(() => {
    const onChange = () => {
      forceUpdate({});
    };

    props.model.changed.connect(onChange);

    return () => {
      props.model.changed.disconnect(onChange);
    };
  }, [props.model]);

  const status = props.model.status;
  const isError = status === 'dead';
  const isIdle = status === 'idle';
  // Show the loading spinner while a kernel is present (or starting up) and not
  // yet idle or dead. When there is no kernel (e.g. after a shutdown) show
  // nothing: the display status is also 'unknown' in that case, so it cannot be
  // distinguished by the status alone, hence relying on `hasNoKernel`.
  const isBusy = !props.model.hasNoKernel && !isError && !isIdle;

  // Return the appropriate icon and text based on status
  return (
    <div
      className={'jp-KernelStatus'}
      onClick={props.onClick}
      style={{ cursor: 'pointer' }}
      title={trans.__('Click to open kernel logs')}
    >
      <div className="jp-KernelStatus-icon-container">
        {isBusy && (
          <div className="jp-KernelStatus-spinner">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle
                className="jp-KernelStatus-spinner-track"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="jp-KernelStatus-spinner-path"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        )}

        {isIdle && (
          <div className="jp-KernelStatus-success">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M8 12L11 15L16 9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}

        {isError && (
          <div className="jp-KernelStatus-error">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M15 9L9 15M9 9L15 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * A widget displaying the kernel status.
 */
export class KernelStatusWidget extends ReactWidget {
  /**
   * Construct a new kernel status widget.
   */
  constructor(options: KernelStatusWidget.IOptions) {
    super();
    this._model = options.model;
    this._onClick = options.onClick || (() => {});
    this._translator = options.translator || nullTranslator;
    this.addClass('jp-KernelStatus-widget');
    this.addClass('jp-mod-highlighted');

    // Make the widget clickable
    this.node.style.cursor = 'pointer';
  }

  /**
   * The kernel status model used by the widget.
   */
  get model(): KernelStatus {
    return this._model;
  }

  /**
   * Render the kernel status widget.
   */
  protected render(): JSX.Element {
    return (
      <KernelStatusComponent
        model={this._model}
        onClick={this._onClick}
        translator={this._translator}
      />
    );
  }

  private _model: KernelStatus;
  private _onClick: () => void;
  private _translator: ITranslator = nullTranslator;
}

/**
 * A namespace for KernelStatusWidget statics.
 */
export namespace KernelStatusWidget {
  /**
   * Options for creating a KernelStatusWidget.
   */
  export interface IOptions {
    /**
     * The kernel status model to use.
     */
    model: KernelStatus;

    /**
     * The click handler for the widget.
     */
    onClick?: () => void;

    /**
     * The application language translator.
     */
    translator: ITranslator | null;
  }
}

/**
 * A plugin that provides a kernel status model and widget.
 */
export const kernelStatusPlugin: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlite/apputils-extension:kernel-status',
  description: 'Kernel status indicator for JupyterLite',
  autoStart: true,
  optional: [IToolbarWidgetRegistry, ILoggerRegistry, ITranslator],
  activate: (
    app: JupyterFrontEnd,
    toolbarRegistry: IToolbarWidgetRegistry | null,
    loggerRegistry: ILoggerRegistry | null,
    translator: ITranslator | null,
  ): void => {
    const { commands } = app;

    // Register the widget with the toolbar registry
    if (toolbarRegistry) {
      // Add the kernel status widget to the notebook toolbar
      toolbarRegistry.addFactory<NotebookPanel>(
        'Notebook',
        'kernelStatus',
        (panel: NotebookPanel) => {
          // Create the kernel status model
          const kernelStatus = new KernelStatus();

          const sessionContext = panel.sessionContext;

          // Reflect the session's display status together with whether a kernel
          // is present. The display status is recomputed on any signal that can
          // affect it (mirroring the execution indicator), and `hasNoKernel`
          // tells a starting kernel (spinner) apart from no kernel (no spinner),
          // since both report the 'unknown' status.
          const updateStatus = () => {
            kernelStatus.setStatus(
              sessionContext.kernelDisplayStatus,
              sessionContext.hasNoKernel,
            );
          };
          sessionContext.statusChanged.connect(updateStatus);
          sessionContext.connectionStatusChanged.connect(updateStatus);
          sessionContext.kernelChanged.connect(updateStatus);
          updateStatus();

          if (loggerRegistry) {
            const path = panel.context.path;
            const logger = loggerRegistry.getLogger(path);
            logger?.contentChanged.connect((_, args) => {
              const length = logger.outputAreaModel.length;
              if (args === 'append' && length > 0) {
                // get the latest message
                const latestMessage = logger.outputAreaModel.get(
                  length - 1,
                ) as ILogOutputModel;
                const level = latestMessage.level;
                // rely on kernels properly reporting a critical state
                if (level === 'critical') {
                  kernelStatus.setStatus('dead', sessionContext.hasNoKernel);
                } else if (level !== 'metadata') {
                  // if new messages are logged, set the status back to busy
                  kernelStatus.setStatus('busy', sessionContext.hasNoKernel);
                }
              }
            });
          }

          return new KernelStatusWidget({
            model: kernelStatus,
            onClick: () => {
              commands.execute('logconsole:open');
            },
            translator,
          });
        },
      );
    }
  },
};
