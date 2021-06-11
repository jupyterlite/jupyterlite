/**
 * **WARNING! EXPERIMENTAL! VERY DANGEROUS!**
 *
 * > This is not a stable API, but there is `/exmaples/js - widgets.ipynb` which
 * > _should_ work, and exercise most of the features contained in here.
 * > There are also some (sometimes aspirational) minimal examples under
 * > under `### Examples` headings below
 *
 * ### Discussion
 *
 */
import { DefaultCommManager } from './comm_manager';
import { ICommManager, IKernel } from './tokens';
import { KernelMessage } from '@jupyterlab/services';

// self._trait_notifiers[name][type]
export type TObservation = 'change' | string;
export type TObservationMap<T> = Map<TObservation, Set<_HasTraits.IChangeCallback<T>>>;
export type TObserverMap<T> = Map<keyof T, TObservationMap<T>>;

/**
 * An unconfigurable top-level variable. _Might_ get optimized out by the compiler.
 *
 * TODO: this is very nasty, but sometimes need to see _everything_...
 * */
const DEBUG = false;

/**
 * A naive, ur-prototype of JupyterLite (T?)JS(?) trait-ful objects
 */
export class _HasTraits<T extends Record<string, any> = Record<string, any>> {
  _trait_names: (keyof T)[];
  // self._trait_values = {}
  _trait_values: T = {} as T;
  // self._trait_notifiers = {}
  _trait_notifiers: TObserverMap<T> = new Map();
  // self._trait_validators = {}
  // TODO: valdiators

  // non-canonical stuff
  private _next_change_promise: null | Promise<any> = null;
  private _next_resolve: null | ((args: _HasTraits.IChange<T>) => void) = null;
  private _next_reject: null | ((args: _HasTraits.IChange<T>) => void) = null;

  constructor(options: Partial<T>) {
    this._trait_names = [...Object.keys(options || {})] as any;
    this._trait_values = { ...this._trait_values, ...options };
    this._init_next();
  }

  /**
   * establish the promise callbacks for the next change
   *
   * TODO: this pattern is probably not right.
   */
  private _init_next(): void {
    this._next_change_promise = new Promise((resolve, reject) => {
      this._next_resolve = resolve;
      this._next_reject = reject;
    });
  }

  /** add an observer.
   *
   * ### Discussion
   *
   * The upstream implementation return `void`.
   *
   * However, it would be very compelling to have access to an observation as a
   * async iterable of changes. Perhaps there is an alternate API, or option,
   * which could allow for retrieving this...
   */
  public observe(
    handler: _HasTraits.IChangeCallback<T>,
    names: string[] | null = null,
    changeType: TObservation = 'change'
  ): void {
    // def observe(self, handler, names=All, type='change'):
    //   """Setup a handler to be called when a trait changes.
    //   This is used to setup dynamic notifications of trait changes.
    //   Parameters
    //   ----------
    //   handler : callable
    //       A callable that is called when a trait changes. Its
    //       signature should be ``handler(change)``, where ``change`` is a
    //       dictionary. The change dictionary at least holds a 'type' key.
    //       * ``type``: the type of notification.
    //       Other keys may be passed depending on the value of 'type'. In the
    //       case where type is 'change', we also have the following keys:
    //       * ``owner`` : the HasTraits instance
    //       * ``old`` : the old value of the modified trait attribute
    //       * ``new`` : the new value of the modified trait attribute
    //       * ``name`` : the name of the modified trait attribute.
    //   names : list, str, All
    //       If names is All, the handler will apply to all traits.  If a list
    //       of str, handler will apply to all names in the list.  If a
    //       str, the handler will apply just to that name.
    //   type : str, All (default: 'change')
    //       The type of notification to filter by. If equal to All, then all
    //       notifications are passed to the observe handler.
    //   """
    //   names = parse_notifier_name(names)
    //   for n in names:
    //       self._add_notifiers(handler, n, type)
    for (const name of names || this._trait_names) {
      if (!this._trait_notifiers.has(name)) {
        this._trait_notifiers.set(name, new Map());
      }
      if (!this._trait_notifiers.get(name)?.get(changeType)) {
        this._trait_notifiers.get(name)?.set(changeType, new Set());
      }
      if (
        this._trait_notifiers
          .get(name)
          ?.get(changeType)
          ?.has(handler)
      ) {
        continue;
      }
      this._trait_notifiers
        .get(name)
        ?.get(changeType)
        ?.add(handler);
      const observer = this._makeObserver(handler, name, changeType);
      const observance = (async () => {
        for await (const observation of observer) {
          DEBUG && console.log(name, changeType, observation);
        }
      })();
      DEBUG && console.log(name, changeType, handler);
      observance.catch(console.warn);
    }
  }

  /** an observer that observes until it is disposed by `.unobserve`.
   *
   * TODO: don't just drop this on the floor. consider an async generator.
   */
  private async *_makeObserver(
    handler: _HasTraits.IChangeCallback<T>,
    name: keyof T,
    changeType: TObservation
  ) {
    const isDisposed = () => {
      return !this._trait_notifiers
        .get(name)
        ?.get(changeType)
        ?.has(handler);
    };

    let change: _HasTraits.IChange<T> | null = null;

    while (!isDisposed()) {
      yield* [[0, null]];
      try {
        change = await this._next_change_promise;
        yield* [[1, change]];
      } catch (err) {
        console.warn('error awaiting next change promise', name, changeType, err);
      }

      // check the handler _again_
      if (isDisposed()) {
        DEBUG && console.log('observer closed', name, changeType);
        break;
      }
      if (change && change.name === name) {
        try {
          await handler(change);
        } catch (err) {
          DEBUG && console.warn('error handling', name, changeType, handler, err);
        }
        yield* [[2, change]];
      }
    }
    DEBUG && console.warn('just about done here', name, changeType);
    yield* [[99, null]];
  }

  /** remove an observer. doesn't work with names yet. */
  unobserve(
    handler: _HasTraits.IChangeCallback<T>,
    names: string[] | null = null,
    changeType: TObservation = 'change'
  ): void {
    // def unobserve(self, handler, names=All, type='change'):
    //     """Remove a trait change handler.
    //     This is used to unregister handlers to trait change notifications.
    //     Parameters
    //     ----------
    //     handler : callable
    //         The callable called when a trait attribute changes.
    //     names : list, str, All (default: All)
    //         The names of the traits for which the specified handler should be
    //         uninstalled. If names is All, the specified handler is uninstalled
    //         from the list of notifiers corresponding to all changes.
    //     type : str or All (default: 'change')
    //         The type of notification to filter by. If All, the specified handler
    //         is uninstalled from the list of notifiers corresponding to all types.
    //     """
    //     names = parse_notifier_name(names)
    //     for n in names:
    //         self._remove_notifiers(handler, n, type)

    for (const name of names || this._trait_names) {
      this._trait_notifiers
        .get(name)
        ?.get(changeType)
        ?.delete(handler) &&
        DEBUG &&
        console.warn('unobserved', name, changeType);
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
    //       * ``owner`` : the HasTraits instance
    owner: _HasTraits<T>;
    //       * ``old`` : the old value of the modified trait attribute
    old: T[keyof T];
    //       * ``new`` : the new value of the modified trait attribute
    new: T[keyof T];
    //       * ``name`` : the name of the modified trait attribute.
    name: keyof T;
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
      const proxy = new Proxy<_HasTraits<T>>(__, {
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
            if (old !== new_) {
              __._emit_change({
                name: prop as keyof T,
                old,
                new: new_,
                owner: __
              });
            }
            return true;
          }
          return Reflect.set(obj, prop, value);
        }
      });
      return proxy;
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
      this.observe(this._sync);
      this._comm.on_msg(this.on_msg);
      this._comm.on_close(async msg => {
        console.warn('TODO', this._comm?.comm_id, 'should close', msg);
      });
    } else {
      console.error('Unexpected: no kernel to back comm');
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
      console.error('Unexpected: cannot send without comm', this);
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
        try {
          await this.handle_on_msg(msg);
        } catch (err) {
          console.warn('Unexpected handler error', err, msg);
        }
        break;
      default:
        console.error('Unexpected method', data.method, ':', msg);
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
      changes.push({
        name: k as keyof T,
        old,
        new: v,
        owner: this
      });
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
    console.warn('TODO: a comm was opened?', comm, msg);
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
    return (self as any).kernel;
  }

  constructor() {
    this._commManager = WidgetRegistry.getKernel().comm_manager;
    DEBUG && console.info(`managing ${_Widget.WIDGET_TARGET}`);
    this._commManager.register_target(
      _Widget.WIDGET_TARGET,
      _Widget.handle_comm_opened
    );
  }
}

/** a naive FloatSlider
 *
 * ### Examples
 * ```js
 * let { FloatSlider } = kernel.widgets
 * x = FloatSlider({description: "$x$", min: -Math.PI, value: 1, max: Math.PI})
 * x.display()
 *
 * Object.entries({sin: Math.sin, cos: Math.cos, tan: Math.tan}).map(([k, fn])=> {
 *     self[k] = FloatSlider({ description: '$\\' + k + '{x}$', min: -1, max: 1})
 *     x.observe(async (change) => self[k].value = fn(change.new))
 *     self[k].display()
 * })
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
 * ### Examples
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
    this.observe(this._on_index, ['index']);
  }
  /**
   * A catch-all observer for the semi-private select behavior
   *
   */
  protected _on_index = async (change: _HasTraits.IChange<ISelect>): Promise<void> => {
    if (change.name !== 'index') {
      console.error(
        'Received unexpected change to',
        change.name,
        ':',
        change.new,
        change
      );
      return;
    }
    const oldValue = this._trait_values['value'];
    this._trait_values['value'] = this._trait_values['options'][change.new];
    this._emit_change({
      name: 'value',
      old: oldValue,
      new: this._trait_values['value'],
      owner: this
    });
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

/** utilities */

export type TLinkItem<T> = [_HasTraits<T>, keyof T];

/**
 * A `link` with the same API as traitlets
 *
 * ### Examples
 * ```js
 * let { link } = kernel.widgets
 * let { Select } = kernel.widgets
 * options = ["apple", "banana"]
 * let [it1, it2] = ["one", "another"].map((d) => Select({rows: 1, description: d, options, _options_labels: options}))
 * self.it1 = it1
 * self.it2 = it2
 * link([it1, "index"], [it2, "index"])
 * it1.display()
 * it2.display()
 * ```
 */
export function link<T, U>(first: TLinkItem<T>, other: TLinkItem<U>): void {
  const [firstHasTraits, firstName] = first;
  const [otherHasTraits, otherName] = other;
  firstHasTraits.observe(
    async (change: _HasTraits.IChange<T>) => {
      const old = (otherHasTraits as any)[otherName];
      if (old !== change.new) {
        (otherHasTraits as any)[otherName] = change.new;
      }
    },
    [firstName as string]
  );
  otherHasTraits.observe(
    async (change: _HasTraits.IChange<U>) => {
      const old = (firstHasTraits as any)[firstName];
      if (old !== change.new) {
        (firstHasTraits as any)[firstName] = change.new;
      }
    },
    [otherName as string]
  );
}

export interface ITranform {
  (newValue: any): any;
}

export interface IDLink<T, U> {
  source: TLinkItem<T>;
  target: TLinkItem<U>;
  // TODO: this could be greatly improved
  transform?: ITranform;
}

const DLINK_NOOP = async (x: any): Promise<any> => x;

class _directional_link<T, U> {
  source: TLinkItem<T>;
  target: TLinkItem<U>;
  transform: null | ITranform;
  // """Link the trait of a source object with traits of target objects.
  // Parameters
  // ----------
  // source : (object, attribute name) pair
  // target : (object, attribute name) pair
  // transform: callable (optional)
  //     Data transformation between source and target.
  // Examples
  // --------
  // >>> c = directional_link((src, "value"), (tgt, "value"))
  // >>> src.value = 5  # updates target objects
  // >>> tgt.value = 6  # does not update source object
  // """
  // updating = False

  constructor(source: TLinkItem<T>, target: TLinkItem<U>, transform?: ITranform) {
    // def __init__(self, source, target, transform=None):
    //     self.source, self.target = source, target
    this.source = source;
    this.target = target;
    //     self._transform = transform if transform else lambda x: x
    this.transform = transform || null;
    //     _validate_link(source, target)
    // TODO: validate link
    //     self.link()
    this.link();
  }

  link() {
    // def link(self):
    //     try:
    //         setattr(self.target[0], self.target[1],
    //                 self._transform(getattr(self.source[0], self.source[1])))
    const [source, sourceName] = this.source;
    const [target, targetName] = this.target;
    try {
      ((target as any) as U)[targetName] = (this.transform || DLINK_NOOP)(
        ((source as any) as T)[sourceName]
      );
    } catch (err) {
      console.warn(
        'unexpected failure in link from',
        this.source,
        'to',
        this.target,
        err
      );
    } finally {
      //     finally:
      //         self.source[0].observe(self._update, names=self.source[1])
      source.observe(this.update, [sourceName as string]);
    }
  }

  update = async (change: any): Promise<void> => {
    ((this.target[0] as any) as U)[this.target[1]] = await (
      this.transform || DLINK_NOOP
    )(change.new);
  };

  unlink() {
    // def unlink(self):
    //     self.source[0].unobserve(self._update, names=self.source[1])
    this.source[0].unobserve(this.update, [this.source[1] as string]);
  }
}

/**
 * A wrapper for the underlying `_directional_link`
 *
 * The python call semantics are not exactly the same...
 */
function directional_link<T, U>(
  source: TLinkItem<T>,
  target: TLinkItem<U>,
  transform?: ITranform
): _directional_link<T, U> {
  return new _directional_link(source, target, transform);
}

/**
 * A pragmatic shortcut for `directional_link`
 *
 * ### Examples
 * ```js
 * let { dlink, FloatSlider } = kernel.widgets;
 * src = FloatSlider()
 * tgt = FloatSlider()
 * c = dlink([src, 'value'], [tgt, 'value'])
 * src.display()
 * tgt.display()
 *
 * src.value = 5  // updates target objects
 * tgt.value = 6  // does not update source object
 *
 * c.unlink()
 * c = dlink([src, 'value'], [tgt, 'value'], (x) => 2 * x)
 * ```
 *
 * ### Advanced Examples
 * ```
 * c.unlink()
 * let { FloatSlider, dlink } = kernel.widgets;
 * tgt.description = "$$t = sin_x \\cdot cos_x$$"
 * tx = () => sin_x.value * cos_x.value
 * self.c = dlink([sin_x, 'value'], [tgt, 'value'], tx)
 * self.d = dlink([cos_x, 'value'], [tgt, 'value'], tx)
 * x.display()
 * sin_x.display()
 * cos_x.display()
 * tgt.display()
 * ```
 */
export const dlink = directional_link;

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
