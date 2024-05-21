// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { JupyterFrontEnd } from '@jupyterlab/application';

import { DocumentRegistry } from '@jupyterlab/docregistry';

import { find } from '@lumino/algorithm';

import { Token } from '@lumino/coreutils';

import { ISignal, Signal } from '@lumino/signaling';

import { FocusTracker, Panel, Widget, PanelLayout } from '@lumino/widgets';

/**
 * The single widget application shell token.
 */
export const ISingleWidgetShell = new Token<ISingleWidgetShell>(
  '@jupyterlite/application:ISingleWidgetShell',
);

/**
 * The single widget application shell interface.
 */
export interface ISingleWidgetShell extends SingleWidgetShell {}

/**
 * The application shell.
 */
export class SingleWidgetShell extends Widget implements JupyterFrontEnd.IShell {
  constructor() {
    super();
    this.id = 'main';

    const rootLayout = new PanelLayout();
    this._main = new Panel();
    this._main.id = 'single-widget-panel';
    rootLayout.addWidget(this._main);
    this.layout = rootLayout;
  }

  /**
   * A signal emitted when the current widget changes.
   */
  get currentChanged(): ISignal<ISingleWidgetShell, FocusTracker.IChangedArgs<Widget>> {
    return this._currentChanged;
  }

  /**
   * The current widget in the shell's main area.
   */
  get currentWidget(): Widget | null {
    return this._main.widgets[0] ?? null;
  }

  /**
   * Activate a widget in its area.
   */
  activateById(id: string): void {
    const widget = find(this.widgets('main'), (w) => w.id === id);
    if (widget) {
      widget.activate();
    }
  }

  /**
   * Add a widget to the application shell.
   *
   * @param widget - The widget being added.
   *
   * @param area - Optional region in the shell into which the widget should
   * be added.
   *
   * @param options - Optional open options.
   *
   */
  add(
    widget: Widget,
    area?: Shell.Area,
    options?: DocumentRegistry.IOpenOptions,
  ): void {
    if (area === 'main' || area === undefined) {
      if (this._main.widgets.length > 0) {
        // do not add the widget if there is already one
        return;
      }
      const previousWidget = this.currentWidget;
      this._main.addWidget(widget);
      this._main.update();
      this._currentChanged.emit({
        newValue: widget,
        oldValue: previousWidget,
      });
    }
  }

  /**
   * Return the list of widgets for the given area.
   *
   * @param area The area
   */
  *widgets(area: Shell.Area): IterableIterator<Widget> {
    switch (area ?? 'main') {
      case 'main':
        yield* this._main.widgets;
        break;
      default:
        throw new Error(`Invalid area: ${area}`);
    }
  }

  private _main: Panel;
  private _currentChanged = new Signal<this, FocusTracker.IChangedArgs<Widget>>(this);
}

/**
 * A namespace for Shell statics
 */
export namespace Shell {
  /**
   * The areas of the application shell where widgets can reside.
   */
  export type Area = 'main';
}
