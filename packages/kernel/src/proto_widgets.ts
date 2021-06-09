import { DefaultCommManager } from './comm_manager';
import { ICommManager, IKernel } from './tokens';
import { KernelMessage } from '@jupyterlab/services';

/**
 * An ur-prototype of JupyterLite (T?)JS(?) kernel widgets
 */
export class _HasTraits<T extends Record<string, any> = Record<string, any>> {
  _trait_names: (keyof T)[];
  // TODO: make generic
  _trait_values: T = {} as T;
  _next_change_promise: null | Promise<any> = null;
  // TODO: these would be Partial<T>
  _next_resolve: null | ((args: any) => any) = null;
  _next_reject: null | ((args: any) => any) = null;

  constructor(options: Partial<T>) {
    this._trait_names = [...Object.keys(options || {})] as any;
    this._trait_values = { ...this._trait_values, ...options };
    this._init_next();
  }
  _init_next() {
    this._next_change_promise = new Promise((resolve, reject) => {
      this._next_resolve = resolve;
      this._next_reject = reject;
    });
  }

  async observe(fn: _HasTraits.IChangeCallback<T>, names?: string[]) {
    while (true) {
      const change = await this._next_change_promise;
      fn(change);
    }
  }

  _emit_change(change: _HasTraits.IChange<T>) {
    this._next_resolve && this._next_resolve(change);
    this._init_next();
  }
}

export namespace _HasTraits {
  export interface IChange<T> {
    name: keyof T;
    old: T[keyof T];
    new: T[keyof T];
  }
  export interface IChangeCallback<T> {
    (change: IChange<T>): Promise<void>;
  }
  /**
   * Set up get/set proxies
   *
   * TODO: probably a decorator?
   */
  export function _traitMeta<T>(_Klass: new (options: T) => _HasTraits<T>) {
    return (options: T) => {
      const __ = new _Klass(options);
      return new Proxy<_HasTraits<T>>(__, {
        get: function(target: any, prop: string | symbol, receiver: any) {
          if (__._trait_names.indexOf(prop as keyof T) !== -1) {
            return (__._trait_values as T)[prop as keyof T];
          }
          return Reflect.get(target, prop, receiver);
        },
        set: function(obj: any, prop: string | symbol, value: any) {
          if (__._trait_names.indexOf(prop as keyof T) !== -1) {
            const old = __._trait_values[prop as keyof T];
            const new_ = (__._trait_values[prop as keyof T] = value);
            __._emit_change({ name: prop as keyof T, old, new: new_ });
            return new_;
          }
          return Reflect.set(obj, prop, value);
        }
      });
    };
  }
}

export class _Widget<T> extends _HasTraits<T> {
  static _kernel: IKernel | null = null;
  private _comm: ICommManager.IComm | null = null;

  constructor(options: T) {
    super({ ...options, ..._Widget.defaults() });
    this.open();
  }

  display() {
    if (!_Widget._kernel) {
      return;
    }

    const content: KernelMessage.IDisplayDataMsg['content'] = {
      data: {
        'text/plain': `${JSON.stringify(this._trait_values, null, 2)}`,
        'application/vnd.jupyter.widget-view+json': {
          version: '2.0',
          version_major: 2,
          version_minor: 0,
          model_id: `${this._comm?.comm_id}`
        }
      },
      metadata: {}
    };
    (_Widget._kernel as any).displayData(content);
  }

  open() {
    const kernel = _Widget._kernel as IKernel;

    const makeData = () => {
      return {
        data: {
          state: this._trait_values
        },
        metadata: {
          version: '2.0',
          version_major: 2,
          version_minor: 0,
          model_id: `${this._comm?.comm_id}`
        }
      };
    };

    if (kernel) {
      this._comm = (kernel.comm_manager as DefaultCommManager).make_comm({
        target_name: _Widget.WIDGET_TARGET,
        ...makeData()
      });
      this.observe(async () => {
        this._comm && this._comm.send(makeData());
      });
      this._comm.on_msg(async msg => {
        console.log(this._comm?.comm_id, 'got a message', msg);
      });
      this._comm.on_close(async msg => {
        console.log(this._comm?.comm_id, 'should close', msg);
      });
    }
  }

  static defaults() {
    return {
      _dom_classes: [],
      _model_module: '@jupyter-widgets/controls',
      _model_module_version: '1.5.0',
      _model_name: 'FloatSliderModel',
      _view_count: null,
      _view_module: '@jupyter-widgets/controls',
      _view_module_version: '1.5.0',
      _view_name: 'FloatSliderView',
      continuous_update: true,
      description: '',
      description_tooltip: null,
      disabled: false,
      layout: null,
      max: 100.0,
      min: 0.0,
      orientation: 'horizontal',
      readout: true,
      readout_format: '.2f',
      step: 0.1,
      style: null,
      value: 42.0
    };
  }

  static async handle_comm_opened(comm: ICommManager.IComm, msg: any): Promise<void> {
    console.log('TODO: a comm was opened?', comm, msg);
  }
}

export namespace _Widget {
  export const WIDGET_TARGET = 'jupyter.widget';
}

export const Widget = _HasTraits._traitMeta<any>(_Widget);

class WidgetRegistry {
  _commManager: ICommManager;

  static getInstance() {
    return Private.widgetRegistry
      ? Private.widgetRegistry
      : (Private.widgetRegistry = new WidgetRegistry());
  }

  static getKernel(): IKernel {
    return (window as any).kernel;
  }

  constructor() {
    this._commManager = WidgetRegistry.getKernel().comm_manager;
    console.log(`managing ${_Widget.WIDGET_TARGET}`);
    this._commManager.register_target(
      _Widget.WIDGET_TARGET,
      _Widget.handle_comm_opened
    );
  }
}

namespace Private {
  export let widgetRegistry: WidgetRegistry;
}

// self.WidgetRegistry = WidgetRegistry;

// class _FloatSlider extends _Widget {
//   constructor(options) {
//     options = { ..._FloatSlider.defaults(), ...options };
//     super(options);
//   }
// }
// _FloatSlider.defaults = () => {
//   return {
//     _model_module: '@jupyter-widgets/base',
//     _model_module_version: '1.2.0',
//     _model_name: 'LayoutModel',
//     _view_count: null,
//     _view_module: '@jupyter-widgets/base',
//     _view_module_version: '1.2.0',
//     _view_name: 'LayoutView',
//     align_content: null,
//     align_items: null,
//     align_self: null,
//     border: null,
//     bottom: null,
//     display: null,
//     flex: null,
//     flex_flow: null,
//     grid_area: null,
//     grid_auto_columns: null,
//     grid_auto_flow: null,
//     grid_auto_rows: null,
//     grid_column: null,
//     grid_gap: null,
//     grid_row: null,
//     grid_template_areas: null,
//     grid_template_columns: null,
//     grid_template_rows: null,
//     height: null,
//     justify_content: null,
//     justify_items: null,
//     left: null,
//     margin: null,
//     max_height: null,
//     max_width: null,
//     min_height: null,
//     min_width: null,
//     object_fit: null,
//     object_position: null,
//     order: null,
//     overflow: null,
//     overflow_x: null,
//     overflow_y: null,
//     padding: null,
//     right: null,
//     top: null,
//     visibility: null,
//     width: null
//   };
// };

// // self._FloatSlider = _FloatSlider;
// // self.FloatSlider = _traitMeta(_FloatSlider);

// // x = FloatSlider({value: 10});
// // x.value
