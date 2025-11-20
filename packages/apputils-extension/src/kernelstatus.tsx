// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import type { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';

import { IToolbarWidgetRegistry, ReactWidget } from '@jupyterlab/apputils';

import type { NotebookPanel } from '@jupyterlab/notebook';

import type { ILogOutputModel } from '@jupyterlab/logconsole';
import { ILoggerRegistry } from '@jupyterlab/logconsole';

import type { Kernel } from '@jupyterlab/services';

import type { ISignal } from '@lumino/signaling';
import { Signal } from '@lumino/signaling';

import React, { useState, useEffect } from 'react';

/**
 * Track the current execution status of a kernel.
 */
export class KernelStatus {
  /**
   * Current execution status of the kernel.
   */
  get status(): Kernel.Status {
    return this._status;
  }

  /**
   * Signal emitted when the kernel status changes.
   */
  get statusChanged(): ISignal<this, Kernel.Status> {
    return this._statusChanged;
  }

  /**
   * Set the current execution status.
   *
   * @param status - The new status
   */
  setStatus(status: Kernel.Status): void {
    if (this._status === status) {
      return;
    }
    this._status = status;
    this._statusChanged.emit(status);
  }

  private _status: Kernel.Status = 'idle';
  private _statusChanged = new Signal<this, Kernel.Status>(this);
}

/**
 * A React component for displaying kernel status.
 */
function KernelStatusComponent(props: {
  model: KernelStatus;
  onClick?: () => void;
}): JSX.Element {
  const [status, setStatus] = useState<Kernel.Status>(props.model.status);

  useEffect(() => {
    const onChange = (_: any, newStatus: Kernel.Status) => {
      setStatus(newStatus);
    };

    props.model.statusChanged.connect(onChange);

    return () => {
      props.model.statusChanged.disconnect(onChange);
    };
  }, [props.model]);

  const isError = status === 'dead';
  const isIdle = status === 'idle';
  const isBusy = !isError && !isIdle;

  // Return the appropriate icon and text based on status
  return (
    <div
      className={'jp-KernelStatus'}
      onClick={props.onClick}
      style={{ cursor: 'pointer' }}
      title="Click to open kernel logs"
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
    return <KernelStatusComponent model={this._model} onClick={this._onClick} />;
  }

  private _model: KernelStatus;
  private _onClick: () => void;
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
  }
}

/**
 * A plugin that provides a kernel status model and widget.
 */
export const kernelStatusPlugin: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlite/apputils-extension:kernel-status',
  description: 'Kernel status indicator for JupyterLite',
  autoStart: true,
  optional: [IToolbarWidgetRegistry, ILoggerRegistry],
  activate: (
    app: JupyterFrontEnd,
    toolbarRegistry: IToolbarWidgetRegistry | null,
    loggerRegistry: ILoggerRegistry | null,
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

          // Update status when kernel status changes
          sessionContext.statusChanged.connect((_, status) => {
            kernelStatus.setStatus(status as Kernel.Status);
          });

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
                  kernelStatus.setStatus('dead');
                } else if (level !== 'metadata') {
                  // if new messages are logged, set the status back to busy
                  kernelStatus.setStatus('busy');
                }
              }
            });
          }

          return new KernelStatusWidget({
            model: kernelStatus,
            onClick: () => {
              commands.execute('logconsole:open');
            },
          });
        },
      );
    }
  },
};
