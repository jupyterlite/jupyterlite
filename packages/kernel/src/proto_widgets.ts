/**
 * WARNING! EXPERIMENTAL! VERY DANGEROUS!
 *
 * This is not a stable API, but there is `/exmaples/js - widgets.ipynb` which
 * _should_ work.
 */
import { DefaultCommManager } from './comm_manager';
import { ICommManager, IKernel } from './tokens';
import { KernelMessage } from '@jupyterlab/services';

/**
 * A naive, ur-prototype of JupyterLite (T?)JS(?) trait-ful objects
 */
export class _HasTraits<T extends Record<string, any> = Record<string, any>> {
  _trait_names: (keyof T)[];
  _trait_values: T = {} as T;
  _next_change_promise: null | Promise<any> = null;
  _next_resolve: null | ((args: _HasTraits.IChange<T>) => void) = null;
  _next_reject: null | ((args: _HasTraits.IChange<T>) => void) = null;
  _observers = new Set<_HasTraits.IChangeCallback<T>>();

  constructor(options: Partial<T>) {
    this._trait_names = [...Object.keys(options || {})] as any;
    this._trait_values = { ...this._trait_values, ...options };
    this._init_next();
  }

  /** establish the promise callbacks for the next change */
  _init_next(): void {
    this._next_change_promise = new Promise((resolve, reject) => {
      this._next_resolve = resolve;
      this._next_reject = reject;
    });
  }

  /** add an observer. doesn't work with names yet. */
  async observe(fn: _HasTraits.IChangeCallback<T>, names?: string[]): Promise<void> {
    this._observers.add(fn);
    while (this._observers.has(fn)) {
      const change = await this._next_change_promise;
      await fn(change);
    }
  }

  /** remove an observer. doesn't work with names yet. */
  async unobserve(fn: _HasTraits.IChangeCallback<T>, names?: string[]): Promise<void> {
    if (this._observers.has(fn)) {
      this._observers.delete(fn);
    }
  }

  /** actually create the change */
  _emit_change(change: _HasTraits.IChange<T>): void {
    try {
      this._next_resolve && this._next_resolve(change);
    } catch (err) {
      this._next_reject && this._next_reject(change);
    } finally {
      this._init_next();
    }
  }
}

/**
 * A namespace for naive traitlets stuff
 */
export namespace _HasTraits {
  /** a change */
  export interface IChange<T> {
    name: keyof T;
    old: T[keyof T];
    new: T[keyof T];
  }

  /** a change handler */
  export interface IChangeCallback<T> {
    (change: IChange<T>): Promise<void>;
  }

  /**
   * Set up get/set proxies
   *
   * TODO: probably a decorator?
   */
  export function _traitMeta<T>(
    _Klass: new (options: T) => _HasTraits<T>
  ): (options: T) => _HasTraits<T> {
    return (options: T): _HasTraits<T> => {
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

/**
 * A naive base widget class
 */
export class _Widget<T> extends _HasTraits<T> {
  static _kernel: IKernel | null = null;
  private _comm: ICommManager.IComm | null = null;

  constructor(options: T) {
    super({ ...options, ..._Widget.defaults() });
    this.open();
  }

  /**
   * Force a display of the widget over raw headers.
   *
   * TODO: Improve, decide on JupyterLite conventions for display, e.g.
   *       - the pragmatic `_ipython_display_`,
   *       - the `_repr_*` family
   */
  display(): void {
    if (!_Widget._kernel) {
      return;
    }

    const content: KernelMessage.IDisplayDataMsg['content'] = {
      data: {
        'text/plain': `${JSON.stringify(this._trait_values, null, 2)}`,
        'application/vnd.jupyter.widget-view+json': {
          version: _Widget.WIDGET_VERSION,
          version_major: _Widget.WIDGET_VERSION_MAJOR,
          version_minor: _Widget.WIDGET_VERSION_MINOR,
          model_id: `${this._comm?.comm_id}`
        }
      },
      metadata: {}
    };
    (_Widget._kernel as any).displayData(content);
  }

  /** open a new comm */
  open(): void {
    const kernel = _Widget._kernel as IKernel;

    if (kernel) {
      this._comm = (kernel.comm_manager as DefaultCommManager).make_comm({
        target_name: _Widget.WIDGET_TARGET,
        ...this.makeMessage()
      });
      this.observe(this._sync).catch(console.error);
      this._comm.on_msg(this.on_msg);
      this._comm.on_close(async msg => {
        console.log(this._comm?.comm_id, 'should close', msg);
      });
    } else {
      console.warn('no kernel to back comm');
    }
  }

  /**
   * Some boilerplate for making (bad) messages
   *
   * TODO: fix hard coded things? extract from python?
   */
  makeMessage(): Record<string, any> {
    return {
      data: { state: this._trait_values },
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
    const msg = this.makeMessage();
    this._comm.send({ ...msg.data, method: 'update' }, msg.metadata);
  };

  /** a naive change batcher.
   *
   * TODO: investigate Debouncer/Throttler, or even ConflatableMessage patterns
   */
  protected on_msg = async (msg: KernelMessage.ICommMsgMsg): Promise<void> => {
    const { data } = msg.content;
    switch (data.method) {
      case 'update':
        await this.handle_on_msg(msg);
        break;
      default:
        console.warn('oh noes', data.method, msg);
        break;
    }
  };

  protected async handle_on_msg(msg: KernelMessage.ICommMsgMsg): Promise<void> {
    const { data } = msg.content;
    const state: T = (data.state as any) as T;
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
  }

  /** the default traits
   *
   * TODO: this is probably wrong,
   */
  static defaults(): any {
    return {
      _dom_classes: [],
      _model_module: _Widget.WIDGET_CONTROLS_PACKAGE,
      _model_module_version: _Widget.WIDGET_CONTROLS_VERSION,
      _view_count: null,
      _view_module: _Widget.WIDGET_CONTROLS_PACKAGE,
      _view_module_version: _Widget.WIDGET_CONTROLS_VERSION
    };
  }

  /**
   * Handle a request for a new comm from the client
   *
   * TODO: untested
   */
  static async handle_comm_opened(
    comm: ICommManager.IComm,
    msg: KernelMessage.ICommOpenMsg
  ): Promise<void> {
    console.log('TODO: a comm was opened?', comm, msg);
  }
}

/** a namespace for widget specs */
export namespace _Widget {
  /** the widget comm target */
  export const WIDGET_TARGET = 'jupyter.widget';
  export const WIDGET_VERSION_MAJOR = 2;
  export const WIDGET_VERSION_MINOR = 0;
  export const WIDGET_VERSION = `${WIDGET_VERSION_MAJOR}.${WIDGET_VERSION_MINOR}`;
  export const WIDGET_CONTROLS_VERSION = '1.5.0';
  export const WIDGET_CONTROLS_PACKAGE = '@jupyter-widgets/controls';
}

export const Widget = _HasTraits._traitMeta<any>(_Widget);

/**
 * A naive registry for all the widget types.
 *
 * Not so important... yet, but _does_ wire up target from the client,
 * but this is not tested yet.
 */
class WidgetRegistry {
  _commManager: ICommManager;

  static getInstance(): WidgetRegistry {
    return Private.widgetRegistry
      ? Private.widgetRegistry
      : (Private.widgetRegistry = new WidgetRegistry());
  }

  static getKernel(): IKernel {
    return (window as any).kernel;
  }

  constructor() {
    this._commManager = WidgetRegistry.getKernel().comm_manager;
    console.info(`managing ${_Widget.WIDGET_TARGET}`);
    this._commManager.register_target(
      _Widget.WIDGET_TARGET,
      _Widget.handle_comm_opened
    );
  }
}

/** a naive FloatSlider
 *
 * ```js
 * let { FloatSlider } = kernel.widgets
 * x = FloatSlider({description: "x", min: -1, value: 1, max: 1})
 * x.display()
 */
export class _FloatSlider extends _Widget<IFloatSlider> {
  constructor(options: IFloatSlider) {
    super({ ..._FloatSlider.defaults(), ...options });
  }

  static defaults(): IFloatSlider {
    return { ...super.defaults(), ...FLOAT_SLIDER_DEFAULTS };
  }
}

/** Some copy-pasted default values
 *
 * TODO: it _must_ be possible to do this _en masse_:
 * - load up each of the widgets for defaults
 * - infer a JSON schema from the traitlets
 * - export the widget.package.schema.json
 * - then either
 *   - go the ts way
 *     - generate .d.ts types
 *     - generate concrete .ts types
 *   - go the js way
 *     - dynamically build evented classes based directly on json schema
 */
const FLOAT_SLIDER_DEFAULTS: IFloatSlider = {
  _dom_classes: [],
  _model_module: _Widget.WIDGET_CONTROLS_PACKAGE,
  _model_module_version: _Widget.WIDGET_CONTROLS_VERSION,
  _model_name: 'FloatSliderModel',
  _view_count: null,
  _view_module: _Widget.WIDGET_CONTROLS_PACKAGE,
  _view_module_version: _Widget.WIDGET_CONTROLS_VERSION,
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
  tooltip: ''
};

/** the concrete observable FloatSlider */
export const FloatSlider = _HasTraits._traitMeta<IFloatSlider>(_FloatSlider);

/** a naive Select
 *
 * ```js
 * let { Select } = kernel.widgets
 * options = ["apple", "banana"]
 * self.it = it = Select({rows: 1, description: "it", options, _options_labels: options})
 * it.display()
 * ```
 */
export class _Select extends _Widget<ISelect> {
  constructor(options: ISelect) {
    super({ ..._Select.defaults(), ...options });
    this.observe(this._on_change).catch(console.error);
  }
  /**
   * A catch-all observer for the semi-private select behavior
   *
   * TODO: make the `names` part of `observe` work
   */
  protected _on_change = async (change: _HasTraits.IChange<ISelect>): Promise<void> => {
    let oldValue: any;

    switch (change.name) {
      case 'index':
        oldValue = this._trait_values['value'];
        this._trait_values['value'] = this._trait_values['options'][change.new];
        this._emit_change({
          name: 'value',
          old: oldValue,
          new: this._trait_values['value']
        });
        break;
      default:
        break;
    }
  };

  static defaults(): ISelect {
    return { ...super.defaults(), ...SELECT_DEFAULTS };
  }
}

/** the concrete observable Select */
export const Select = _HasTraits._traitMeta<ISelect>(_Select);

/** some hand-made defaults */
const SELECT_DEFAULTS: ISelect = {
  _dom_classes: [],
  _model_module: _Widget.WIDGET_CONTROLS_PACKAGE,
  _model_module_version: _Widget.WIDGET_CONTROLS_VERSION,
  _model_name: 'SelectModel',
  _options_labels: ['1', '2'],
  _view_count: null,
  _view_module: _Widget.WIDGET_CONTROLS_PACKAGE,
  _view_module_version: _Widget.WIDGET_CONTROLS_VERSION,
  _view_name: 'SelectView',
  options: [],
  label: '',
  value: 0,
  tabbable: true,
  tooltip: '',
  layout: null,
  description: '',
  description_tooltip: null,
  disabled: false,
  index: 0,
  rows: 5
};

/** a description of widget traits */
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
  // keys: string[];
}

/** a description of DOM widget traits */
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

/** a description of described widget traits */
export interface IDescriptionWidget extends IWidget {
  description: string;
  description_tooltip: string | null;
}

/** a description of float widget traits */
export interface IFloat extends IWidget {
  value: number;
}

/** a description of bounded float widget traits */
export interface IBoundedFloat extends IFloat {
  min: number;
  max: number;
}

/** a description of float slider */
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

export interface ISelection extends IDOMWidget, IDescriptionWidget {
  // value = Any(None, help="Selected value", allow_none=True)
  value: any | null;
  // label = Unicode(None, help="Selected label", allow_none=True)
  label: string | null;
  // index = Int(None, help="Selected index", allow_none=True).tag(sync=True)
  index: number | null;
  // options = Any((),
  // help="""Iterable of values or (label, value) pairs that the user can select.
  // The labels are the strings that will be displayed in the UI, representing the
  // actual Python choices, and should be unique.
  // """)
  options: any[] | [string, any][];
  // # This being read-only means that it cannot be changed by the user.
  // _options_labels = TypedTuple(trait=Unicode(), read_only=True, help="The labels for the options.").tag(sync=True)
  _options_labels: string[];
  // disabled = Bool(help="Enable or disable user changes").tag(sync=True)
  disabled: boolean;
}

export interface ISelect extends ISelection {
  // _view_name = Unicode('SelectView').tag(sync=True)
  // _model_name = Unicode('SelectModel').tag(sync=True)
  // rows = Int(5, help="The number of rows to display.").tag(sync=True)
  rows: number;
}

/** A namespace for the widgetregistry singleton */
namespace Private {
  export let widgetRegistry: WidgetRegistry;
}
