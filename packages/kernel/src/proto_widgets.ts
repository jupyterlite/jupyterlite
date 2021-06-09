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
  _observers = new Set<_HasTraits.IChangeCallback<T>>();

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

  /** add an observer. doesn't work with names yet. */
  async observe(fn: _HasTraits.IChangeCallback<T>, names?: string[]) {
    this._observers.add(fn);
    while (this._observers.has(fn)) {
      const change = await this._next_change_promise;
      await fn(change);
    }
  }

  /** remove an observer. doesn't work with names yet. */
  async unobserve(fn: _HasTraits.IChangeCallback<T>, names?: string[]) {
    if (this._observers.has(fn)) {
      this._observers.delete(fn);
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

    if (kernel) {
      this._comm = (kernel.comm_manager as DefaultCommManager).make_comm({
        target_name: _Widget.WIDGET_TARGET,
        ...this.makeMessage()
      });
      this.observe(this._sync);
      this._comm.on_msg(this.on_msg);
      this._comm.on_close(async msg => {
        console.log(this._comm?.comm_id, 'should close', msg);
      });
    }
  }

  makeMessage(keys: string[] = []) {
    const state: T = {} as T;
    for (const k of keys || Object.keys(this._trait_values)) {
      state[k as keyof T] = this._trait_values[k as keyof T];
    }
    return {
      data: { state },
      metadata: {
        version: '2.0',
        version_major: 2,
        version_minor: 0,
        model_id: `${this._comm?.comm_id}`
      }
    };
  }

  /**
   * sync data back to the client
   */
  protected _sync = async (change: _HasTraits.IChange<T>): Promise<void> => {
    if (!this._comm) {
      console.warn('cannot send without comm', this);
      return;
    }
    const msg = this.makeMessage([change.name as string]);
    this._comm.send({ ...msg.data, method: 'update' }, msg.metadata);
  };

  protected on_msg = async (msg: any) => {
    const { data } = msg.content;
    switch (data.method) {
      case 'update':
        const state: T = data.state;
        const changes = [];
        for (const [k, v] of Object.entries(state)) {
          const old = this._trait_values[k as keyof T];
          if (old === v) {
            continue;
          }
          (this._trait_values as any)[k] = v as any;
          changes.push({ name: k as keyof T, old, new: v });
        }
        for (const change of changes) {
          this._emit_change(change);
        }
        break;
      default:
        console.warn('oh noes', data.method, msg);
        break;
    }
  };

  static defaults() {
    return {
      _dom_classes: [],
      _model_module: '@jupyter-widgets/controls',
      _model_module_version: '1.5.0',
      _view_count: null,
      _view_module_version: '1.5.0'
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

const FLOAT_SLIDER_DEFAULTS: IFloatSlider = {
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
  value: 0.0,
  tabbable: true,
  tooltip: '',
  keys: ['value']
};

export class _FloatSlider extends _Widget<IFloatSlider> {
  constructor(options: IFloatSlider) {
    options = { ...FLOAT_SLIDER_DEFAULTS, ...options };
    super(options);
  }
}

export const FloatSlider = _HasTraits._traitMeta<IFloatSlider>(_FloatSlider);

export interface IWidget {
  // _model_name = Unicode('WidgetModel',
  //     help="Name of the model.", read_only=True).tag(sync=True)
  _model_name: string;
  // _model_module = Unicode('@jupyter-widgets/base',
  //     help="The namespace for the model.", read_only=True).tag(sync=True)
  _model_module: string;
  // _model_module_version = Unicode(__jupyter_widgets_base_version__,
  //     help="A semver requirement for namespace version containing the model.", read_only=True).tag(sync=True)
  _model_module_version: string;
  // _view_name = Unicode(None, allow_none=True,
  //     help="Name of the view.").tag(sync=True)
  _view_name: string;
  // _view_module = Unicode(None, allow_none=True,
  //     help="The namespace for the view.").tag(sync=True)
  _view_module: string;
  // _view_module_version = Unicode('',
  //     help="A semver requirement for the namespace version containing the view.").tag(sync=True)
  _view_module_version: string;
  // _view_count = Int(None, allow_none=True,
  //     help="EXPERIMENTAL: The number of views of the model displayed in the frontend. This attribute is experimental and may change or be removed in the future. None signifies that views will not be tracked. Set this to 0 to start tracking view creation/deletion.").tag(sync=True)
  _view_count: number | null;
  // comm = Instance('ipykernel.comm.Comm', allow_none=True)
  // keys = List(help="The traits which are synced.")
  keys: string[];
}

export interface IDOMWidget extends IWidget {
  // _dom_classes = TypedTuple(trait=Unicode(), help="CSS classes applied to widget DOM element").tag(sync=True)
  _dom_classes: string[];
  // tabbable = Bool(help="Is widget tabbable?", allow_none=True, default_value=None).tag(sync=True)
  tabbable: boolean;
  // tooltip = Unicode(None, allow_none=True, help="A tooltip caption.").tag(sync=True)
  tooltip: string;
  // layout = InstanceDict(Layout).tag(sync=True, **widget_serialization)
  layout: any;
}

export interface IDescriptionWidget extends IWidget {
  description: string;
  description_tooltip: string | null;
}

export interface IFloat extends IWidget {
  value: number;
}

export interface IBoundedFloat extends IFloat {
  min: number;
  max: number;
}

export interface IFloatSlider extends IDOMWidget, IDescriptionWidget, IBoundedFloat {
  // step = CFloat(0.1, allow_none=True, help="Minimum step to increment the value").tag(sync=True)
  step: number | null;
  // orientation = CaselessStrEnum(values=['horizontal', 'vertical'],
  //     default_value='horizontal', help="Vertical or horizontal.").tag(sync=True)
  orientation: 'horizontal' | 'vertical';
  // readout = Bool(True, help="Display the current value of the slider next to it.").tag(sync=True)
  readout: boolean;
  // readout_format = NumberFormat(
  //     '.2f', help="Format for the readout").tag(sync=True)
  readout_format: string;
  // continuous_update = Bool(True, help="Update the value of the widget as the user is holding the slider.").tag(sync=True)
  continuous_update: boolean;
  // disabled = Bool(False, help="Enable or disable user changes").tag(sync=True)
  disabled: boolean;
  // style = InstanceDict(SliderStyle).tag(sync=True, **widget_serialization)
  style: any;
}
