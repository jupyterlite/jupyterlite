/***************************************************************************************************
 * THIS FILE IS AUTO-GENERATED FROM *    See `/scripts/schema-widgets.ipynb`, which also generates
 ********  ipywidgets 7.6.3  ********    `_schema_widgets.d.ts` and `_schema_widgets.json`.
 *
 * @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html
 * @see https://github.com/jtpio/jupyterlite/pull/141
 ***************************************************************************************************/
import * as PROTO from './_schema_widgets';
import * as SCHEMA from './_schema_widgets.json';
import { _HasTraits, _Widget } from './proto_widgets';
export let ALL = {} as Record<string, any>;

export namespace ipywidgets_widgets_domwidget {
  /** a type for the traits of DOMWidget*/
  export type TAnyDOMWidget = PROTO.DOMWidgetPublic | PROTO.DOMWidgetProtected;

  /** a naive DOMWidget 

    Widget that can be inserted into the DOM

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#DOMWidget
    */
  export class _DOMWidget extends _Widget<TAnyDOMWidget> {
    constructor(options: TAnyDOMWidget) {
      super({ ..._DOMWidget.defaults(), ...options });
    }

    static defaults(): TAnyDOMWidget {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicDOMWidget.default,
        ...SCHEMA.IProtectedDOMWidget.default
      };
    }
  }

  /** the concrete observable DOMWidget */
  export const DOMWidget = _HasTraits._traitMeta<TAnyDOMWidget>(_DOMWidget);

  if (!ALL['DOMWidget']) {
    ALL['DOMWidget'] = DOMWidget;
  } else {
    console.log('DOMWidget is already hoisted', ALL['DOMWidget']);
  }

  // ---
} // end of ['ipywidgets', 'widgets', 'domwidget']

export namespace ipywidgets_widgets_widget {
  // ---
} // end of ['ipywidgets', 'widgets', 'widget']

export namespace ipywidgets_widgets_widget_bool {
  /** a type for the traits of _Bool*/
  export type TAny_Bool = PROTO._BoolPublic | PROTO._BoolProtected;

  /** a naive _Bool 

    A base class for creating widgets that represent booleans.

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#_Bool
    */
  export class __Bool extends _Widget<TAny_Bool> {
    constructor(options: TAny_Bool) {
      super({ ...__Bool.defaults(), ...options });
    }

    static defaults(): TAny_Bool {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublic_Bool.default,
        ...SCHEMA.IProtected_Bool.default
      };
    }
  }

  /** the concrete observable _Bool */
  export const _Bool = _HasTraits._traitMeta<TAny_Bool>(__Bool);

  if (!ALL['_Bool']) {
    ALL['_Bool'] = _Bool;
  } else {
    console.log('_Bool is already hoisted', ALL['_Bool']);
  }

  // ---

  /** a type for the traits of Valid*/
  export type TAnyValid = PROTO.ValidPublic | PROTO.ValidProtected;

  /** a naive Valid 

    Displays a boolean `value` in the form of a green check (True / valid)
    or a red cross (False / invalid).

    Parameters
    ----------
    value: {True,False}
        value of the Valid widget
    

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#Valid
    */
  export class _Valid extends _Widget<TAnyValid> {
    constructor(options: TAnyValid) {
      super({ ..._Valid.defaults(), ...options });
    }

    static defaults(): TAnyValid {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicValid.default,
        ...SCHEMA.IProtectedValid.default
      };
    }
  }

  /** the concrete observable Valid */
  export const Valid = _HasTraits._traitMeta<TAnyValid>(_Valid);

  if (!ALL['Valid']) {
    ALL['Valid'] = Valid;
  } else {
    console.log('Valid is already hoisted', ALL['Valid']);
  }

  // ---

  /** a type for the traits of Checkbox*/
  export type TAnyCheckbox = PROTO.CheckboxPublic | PROTO.CheckboxProtected;

  /** a naive Checkbox 

    Displays a boolean `value` in the form of a checkbox.

    Parameters
    ----------
    value : {True,False}
        value of the checkbox: True-checked, False-unchecked
    description : str
	    description displayed next to the checkbox
    indent : {True,False}
        indent the control to align with other controls with a description. The style.description_width attribute controls this width for consistence with other controls.
    

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#Checkbox
    */
  export class _Checkbox extends _Widget<TAnyCheckbox> {
    constructor(options: TAnyCheckbox) {
      super({ ..._Checkbox.defaults(), ...options });
    }

    static defaults(): TAnyCheckbox {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicCheckbox.default,
        ...SCHEMA.IProtectedCheckbox.default
      };
    }
  }

  /** the concrete observable Checkbox */
  export const Checkbox = _HasTraits._traitMeta<TAnyCheckbox>(_Checkbox);

  if (!ALL['Checkbox']) {
    ALL['Checkbox'] = Checkbox;
  } else {
    console.log('Checkbox is already hoisted', ALL['Checkbox']);
  }

  // ---

  /** a type for the traits of ToggleButton*/
  export type TAnyToggleButton = PROTO.ToggleButtonPublic | PROTO.ToggleButtonProtected;

  /** a naive ToggleButton 

    Displays a boolean `value` in the form of a toggle button.

    Parameters
    ----------
    value : {True,False}
        value of the toggle button: True-pressed, False-unpressed
    description : str
	      description displayed next to the button
    tooltip: str
        tooltip caption of the toggle button
    icon: str
        font-awesome icon name
    

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#ToggleButton
    */
  export class _ToggleButton extends _Widget<TAnyToggleButton> {
    constructor(options: TAnyToggleButton) {
      super({ ..._ToggleButton.defaults(), ...options });
    }

    static defaults(): TAnyToggleButton {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicToggleButton.default,
        ...SCHEMA.IProtectedToggleButton.default
      };
    }
  }

  /** the concrete observable ToggleButton */
  export const ToggleButton = _HasTraits._traitMeta<TAnyToggleButton>(_ToggleButton);

  if (!ALL['ToggleButton']) {
    ALL['ToggleButton'] = ToggleButton;
  } else {
    console.log('ToggleButton is already hoisted', ALL['ToggleButton']);
  }

  // ---
} // end of ['ipywidgets', 'widgets', 'widget_bool']

export namespace ipywidgets_widgets_widget_box {
  /** a type for the traits of GridBox*/
  export type TAnyGridBox = PROTO.GridBoxPublic | PROTO.GridBoxProtected;

  /** a naive GridBox 

     Displays multiple widgets in rows and columns using the grid box model.

    Parameters
    ----------
    {box_params}

    Examples
    --------
    >>> import ipywidgets as widgets
    >>> title_widget = widgets.HTML('<em>Grid Box Example</em>')
    >>> slider = widgets.IntSlider()
    >>> button1 = widgets.Button(description='1')
    >>> button2 = widgets.Button(description='2')
    >>> # Create a grid with two columns, splitting space equally
    >>> layout = widgets.Layout(grid_template_columns='1fr 1fr')
    >>> widgets.GridBox([title_widget, slider, button1, button2], layout=layout)
    

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#GridBox
    */
  export class _GridBox extends _Widget<TAnyGridBox> {
    constructor(options: TAnyGridBox) {
      super({ ..._GridBox.defaults(), ...options });
    }

    static defaults(): TAnyGridBox {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicGridBox.default,
        ...SCHEMA.IProtectedGridBox.default
      };
    }
  }

  /** the concrete observable GridBox */
  export const GridBox = _HasTraits._traitMeta<TAnyGridBox>(_GridBox);

  if (!ALL['GridBox']) {
    ALL['GridBox'] = GridBox;
  } else {
    console.log('GridBox is already hoisted', ALL['GridBox']);
  }

  // ---

  /** a type for the traits of Box*/
  export type TAnyBox = PROTO.BoxPublic | PROTO.BoxProtected;

  /** a naive Box 

     Displays multiple widgets in a group.

    The widgets are laid out horizontally.

    Parameters
    ----------
    children: iterable of Widget instances
        list of widgets to display

    box_style: str
        one of 'success', 'info', 'warning' or 'danger', or ''.
        Applies a predefined style to the box. Defaults to '',
        which applies no pre-defined style.

    Examples
    --------
    >>> import ipywidgets as widgets
    >>> title_widget = widgets.HTML('<em>Box Example</em>')
    >>> slider = widgets.IntSlider()
    >>> widgets.Box([title_widget, slider])
    

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#Box
    */
  export class _Box extends _Widget<TAnyBox> {
    constructor(options: TAnyBox) {
      super({ ..._Box.defaults(), ...options });
    }

    static defaults(): TAnyBox {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicBox.default,
        ...SCHEMA.IProtectedBox.default
      };
    }
  }

  /** the concrete observable Box */
  export const Box = _HasTraits._traitMeta<TAnyBox>(_Box);

  if (!ALL['Box']) {
    ALL['Box'] = Box;
  } else {
    console.log('Box is already hoisted', ALL['Box']);
  }

  // ---

  /** a type for the traits of VBox*/
  export type TAnyVBox = PROTO.VBoxPublic | PROTO.VBoxProtected;

  /** a naive VBox 

     Displays multiple widgets vertically using the flexible box model.

    Parameters
    ----------
    children: iterable of Widget instances
        list of widgets to display

    box_style: str
        one of 'success', 'info', 'warning' or 'danger', or ''.
        Applies a predefined style to the box. Defaults to '',
        which applies no pre-defined style.

    Examples
    --------
    >>> import ipywidgets as widgets
    >>> title_widget = widgets.HTML('<em>Vertical Box Example</em>')
    >>> slider = widgets.IntSlider()
    >>> widgets.VBox([title_widget, slider])
    

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#VBox
    */
  export class _VBox extends _Widget<TAnyVBox> {
    constructor(options: TAnyVBox) {
      super({ ..._VBox.defaults(), ...options });
    }

    static defaults(): TAnyVBox {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicVBox.default,
        ...SCHEMA.IProtectedVBox.default
      };
    }
  }

  /** the concrete observable VBox */
  export const VBox = _HasTraits._traitMeta<TAnyVBox>(_VBox);

  if (!ALL['VBox']) {
    ALL['VBox'] = VBox;
  } else {
    console.log('VBox is already hoisted', ALL['VBox']);
  }

  // ---

  /** a type for the traits of HBox*/
  export type TAnyHBox = PROTO.HBoxPublic | PROTO.HBoxProtected;

  /** a naive HBox 

     Displays multiple widgets horizontally using the flexible box model.

    Parameters
    ----------
    children: iterable of Widget instances
        list of widgets to display

    box_style: str
        one of 'success', 'info', 'warning' or 'danger', or ''.
        Applies a predefined style to the box. Defaults to '',
        which applies no pre-defined style.

    Examples
    --------
    >>> import ipywidgets as widgets
    >>> title_widget = widgets.HTML('<em>Horizontal Box Example</em>')
    >>> slider = widgets.IntSlider()
    >>> widgets.HBox([title_widget, slider])
    

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#HBox
    */
  export class _HBox extends _Widget<TAnyHBox> {
    constructor(options: TAnyHBox) {
      super({ ..._HBox.defaults(), ...options });
    }

    static defaults(): TAnyHBox {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicHBox.default,
        ...SCHEMA.IProtectedHBox.default
      };
    }
  }

  /** the concrete observable HBox */
  export const HBox = _HasTraits._traitMeta<TAnyHBox>(_HBox);

  if (!ALL['HBox']) {
    ALL['HBox'] = HBox;
  } else {
    console.log('HBox is already hoisted', ALL['HBox']);
  }

  // ---
} // end of ['ipywidgets', 'widgets', 'widget_box']

export namespace ipywidgets_widgets_widget_button {
  /** a type for the traits of ButtonStyle*/
  export type TAnyButtonStyle = PROTO.ButtonStylePublic | PROTO.ButtonStyleProtected;

  /** a naive ButtonStyle 

    Button style widget.

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#ButtonStyle
    */
  export class _ButtonStyle extends _Widget<TAnyButtonStyle> {
    constructor(options: TAnyButtonStyle) {
      super({ ..._ButtonStyle.defaults(), ...options });
    }

    static defaults(): TAnyButtonStyle {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicButtonStyle.default,
        ...SCHEMA.IProtectedButtonStyle.default
      };
    }
  }

  /** the concrete observable ButtonStyle */
  export const ButtonStyle = _HasTraits._traitMeta<TAnyButtonStyle>(_ButtonStyle);

  if (!ALL['ButtonStyle']) {
    ALL['ButtonStyle'] = ButtonStyle;
  } else {
    console.log('ButtonStyle is already hoisted', ALL['ButtonStyle']);
  }

  // ---

  /** a type for the traits of Button*/
  export type TAnyButton = PROTO.ButtonPublic | PROTO.ButtonProtected;

  /** a naive Button 

    Button widget.

    This widget has an `on_click` method that allows you to listen for the
    user clicking on the button.  The click event itself is stateless.

    Parameters
    ----------
    description: str
       description displayed next to the button
    tooltip: str
       tooltip caption of the toggle button
    icon: str
       font-awesome icon name
    disabled: bool
       whether user interaction is enabled
    

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#Button
    */
  export class _Button extends _Widget<TAnyButton> {
    constructor(options: TAnyButton) {
      super({ ..._Button.defaults(), ...options });
    }

    static defaults(): TAnyButton {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicButton.default,
        ...SCHEMA.IProtectedButton.default
      };
    }
  }

  /** the concrete observable Button */
  export const Button = _HasTraits._traitMeta<TAnyButton>(_Button);

  if (!ALL['Button']) {
    ALL['Button'] = Button;
  } else {
    console.log('Button is already hoisted', ALL['Button']);
  }

  // ---
} // end of ['ipywidgets', 'widgets', 'widget_button']

export namespace ipywidgets_widgets_widget_color {
  /** a type for the traits of ColorPicker*/
  export type TAnyColorPicker = PROTO.ColorPickerPublic | PROTO.ColorPickerProtected;

  /** a naive ColorPicker 

    None

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#ColorPicker
    */
  export class _ColorPicker extends _Widget<TAnyColorPicker> {
    constructor(options: TAnyColorPicker) {
      super({ ..._ColorPicker.defaults(), ...options });
    }

    static defaults(): TAnyColorPicker {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicColorPicker.default,
        ...SCHEMA.IProtectedColorPicker.default
      };
    }
  }

  /** the concrete observable ColorPicker */
  export const ColorPicker = _HasTraits._traitMeta<TAnyColorPicker>(_ColorPicker);

  if (!ALL['ColorPicker']) {
    ALL['ColorPicker'] = ColorPicker;
  } else {
    console.log('ColorPicker is already hoisted', ALL['ColorPicker']);
  }

  // ---
} // end of ['ipywidgets', 'widgets', 'widget_color']

export namespace ipywidgets_widgets_widget_controller {
  /** a type for the traits of Controller*/
  export type TAnyController = PROTO.ControllerPublic | PROTO.ControllerProtected;

  /** a naive Controller 

    Represents a game controller.

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#Controller
    */
  export class _Controller extends _Widget<TAnyController> {
    constructor(options: TAnyController) {
      super({ ..._Controller.defaults(), ...options });
    }

    static defaults(): TAnyController {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicController.default,
        ...SCHEMA.IProtectedController.default
      };
    }
  }

  /** the concrete observable Controller */
  export const Controller = _HasTraits._traitMeta<TAnyController>(_Controller);

  if (!ALL['Controller']) {
    ALL['Controller'] = Controller;
  } else {
    console.log('Controller is already hoisted', ALL['Controller']);
  }

  // ---

  /** a type for the traits of Axis*/
  export type TAnyAxis = PROTO.AxisPublic | PROTO.AxisProtected;

  /** a naive Axis 

    Represents a gamepad or joystick axis.

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#Axis
    */
  export class _Axis extends _Widget<TAnyAxis> {
    constructor(options: TAnyAxis) {
      super({ ..._Axis.defaults(), ...options });
    }

    static defaults(): TAnyAxis {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicAxis.default,
        ...SCHEMA.IProtectedAxis.default
      };
    }
  }

  /** the concrete observable Axis */
  export const Axis = _HasTraits._traitMeta<TAnyAxis>(_Axis);

  if (!ALL['Axis']) {
    ALL['Axis'] = Axis;
  } else {
    console.log('Axis is already hoisted', ALL['Axis']);
  }

  // ---

  /** a type for the traits of Button*/
  export type TAnyButton = PROTO.ButtonPublic | PROTO.ButtonProtected;

  /** a naive Button 

    Represents a gamepad or joystick button.

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#Button
    */
  export class _Button extends _Widget<TAnyButton> {
    constructor(options: TAnyButton) {
      super({ ..._Button.defaults(), ...options });
    }

    static defaults(): TAnyButton {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicButton.default,
        ...SCHEMA.IProtectedButton.default
      };
    }
  }

  /** the concrete observable Button */
  export const Button = _HasTraits._traitMeta<TAnyButton>(_Button);

  if (!ALL['Button']) {
    ALL['Button'] = Button;
  } else {
    console.log('Button is already hoisted', ALL['Button']);
  }

  // ---
} // end of ['ipywidgets', 'widgets', 'widget_controller']

export namespace ipywidgets_widgets_widget_core {
  /** a type for the traits of CoreWidget*/
  export type TAnyCoreWidget = PROTO.CoreWidgetPublic | PROTO.CoreWidgetProtected;

  /** a naive CoreWidget 

    None

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#CoreWidget
    */
  export class _CoreWidget extends _Widget<TAnyCoreWidget> {
    constructor(options: TAnyCoreWidget) {
      super({ ..._CoreWidget.defaults(), ...options });
    }

    static defaults(): TAnyCoreWidget {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicCoreWidget.default,
        ...SCHEMA.IProtectedCoreWidget.default
      };
    }
  }

  /** the concrete observable CoreWidget */
  export const CoreWidget = _HasTraits._traitMeta<TAnyCoreWidget>(_CoreWidget);

  if (!ALL['CoreWidget']) {
    ALL['CoreWidget'] = CoreWidget;
  } else {
    console.log('CoreWidget is already hoisted', ALL['CoreWidget']);
  }

  // ---
} // end of ['ipywidgets', 'widgets', 'widget_core']

export namespace ipywidgets_widgets_widget_description {
  /** a type for the traits of DescriptionStyle*/
  export type TAnyDescriptionStyle =
    | PROTO.DescriptionStylePublic
    | PROTO.DescriptionStyleProtected;

  /** a naive DescriptionStyle 

    Description style widget.

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#DescriptionStyle
    */
  export class _DescriptionStyle extends _Widget<TAnyDescriptionStyle> {
    constructor(options: TAnyDescriptionStyle) {
      super({ ..._DescriptionStyle.defaults(), ...options });
    }

    static defaults(): TAnyDescriptionStyle {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicDescriptionStyle.default,
        ...SCHEMA.IProtectedDescriptionStyle.default
      };
    }
  }

  /** the concrete observable DescriptionStyle */
  export const DescriptionStyle = _HasTraits._traitMeta<TAnyDescriptionStyle>(
    _DescriptionStyle
  );

  if (!ALL['DescriptionStyle']) {
    ALL['DescriptionStyle'] = DescriptionStyle;
  } else {
    console.log('DescriptionStyle is already hoisted', ALL['DescriptionStyle']);
  }

  // ---

  /** a type for the traits of DescriptionWidget*/
  export type TAnyDescriptionWidget =
    | PROTO.DescriptionWidgetPublic
    | PROTO.DescriptionWidgetProtected;

  /** a naive DescriptionWidget 

    Widget that has a description label to the side.

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#DescriptionWidget
    */
  export class _DescriptionWidget extends _Widget<TAnyDescriptionWidget> {
    constructor(options: TAnyDescriptionWidget) {
      super({ ..._DescriptionWidget.defaults(), ...options });
    }

    static defaults(): TAnyDescriptionWidget {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicDescriptionWidget.default,
        ...SCHEMA.IProtectedDescriptionWidget.default
      };
    }
  }

  /** the concrete observable DescriptionWidget */
  export const DescriptionWidget = _HasTraits._traitMeta<TAnyDescriptionWidget>(
    _DescriptionWidget
  );

  if (!ALL['DescriptionWidget']) {
    ALL['DescriptionWidget'] = DescriptionWidget;
  } else {
    console.log('DescriptionWidget is already hoisted', ALL['DescriptionWidget']);
  }

  // ---
} // end of ['ipywidgets', 'widgets', 'widget_description']

export namespace ipywidgets_widgets_widget_float {
  /** a type for the traits of _BoundedLogFloat*/
  export type TAny_BoundedLogFloat =
    | PROTO._BoundedLogFloatPublic
    | PROTO._BoundedLogFloatProtected;

  /** a naive _BoundedLogFloat 

    None

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#_BoundedLogFloat
    */
  export class __BoundedLogFloat extends _Widget<TAny_BoundedLogFloat> {
    constructor(options: TAny_BoundedLogFloat) {
      super({ ...__BoundedLogFloat.defaults(), ...options });
    }

    static defaults(): TAny_BoundedLogFloat {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublic_BoundedLogFloat.default,
        ...SCHEMA.IProtected_BoundedLogFloat.default
      };
    }
  }

  /** the concrete observable _BoundedLogFloat */
  export const _BoundedLogFloat = _HasTraits._traitMeta<TAny_BoundedLogFloat>(
    __BoundedLogFloat
  );

  if (!ALL['_BoundedLogFloat']) {
    ALL['_BoundedLogFloat'] = _BoundedLogFloat;
  } else {
    console.log('_BoundedLogFloat is already hoisted', ALL['_BoundedLogFloat']);
  }

  // ---

  /** a type for the traits of FloatRangeSlider*/
  export type TAnyFloatRangeSlider =
    | PROTO.FloatRangeSliderPublic
    | PROTO.FloatRangeSliderProtected;

  /** a naive FloatRangeSlider 

     Slider/trackbar that represents a pair of floats bounded by minimum and maximum value.

    Parameters
    ----------
    value : float tuple
        range of the slider displayed
    min : float
        minimal position of the slider
    max : float
        maximal position of the slider
    step : float
        step of the trackbar
    description : str
        name of the slider
    orientation : {'horizontal', 'vertical'}
        default is 'horizontal'
    readout : {True, False}
        default is True, display the current value of the slider next to it
    readout_format : str
        default is '.2f', specifier for the format function used to represent
        slider value for human consumption, modeled after Python 3's format
        specification mini-language (PEP 3101).
    

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#FloatRangeSlider
    */
  export class _FloatRangeSlider extends _Widget<TAnyFloatRangeSlider> {
    constructor(options: TAnyFloatRangeSlider) {
      super({ ..._FloatRangeSlider.defaults(), ...options });
    }

    static defaults(): TAnyFloatRangeSlider {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicFloatRangeSlider.default,
        ...SCHEMA.IProtectedFloatRangeSlider.default
      };
    }
  }

  /** the concrete observable FloatRangeSlider */
  export const FloatRangeSlider = _HasTraits._traitMeta<TAnyFloatRangeSlider>(
    _FloatRangeSlider
  );

  if (!ALL['FloatRangeSlider']) {
    ALL['FloatRangeSlider'] = FloatRangeSlider;
  } else {
    console.log('FloatRangeSlider is already hoisted', ALL['FloatRangeSlider']);
  }

  // ---

  /** a type for the traits of FloatLogSlider*/
  export type TAnyFloatLogSlider =
    | PROTO.FloatLogSliderPublic
    | PROTO.FloatLogSliderProtected;

  /** a naive FloatLogSlider 

     Slider/trackbar of logarithmic floating values with the specified range.

    Parameters
    ----------
    value : float
        position of the slider
    base : float
        base of the logarithmic scale. Default is 10
    min : float
        minimal position of the slider in log scale, i.e., actual minimum is base ** min
    max : float
        maximal position of the slider in log scale, i.e., actual maximum is base ** max
    step : float
        step of the trackbar, denotes steps for the exponent, not the actual value
    description : str
        name of the slider
    orientation : {'horizontal', 'vertical'}
        default is 'horizontal', orientation of the slider
    readout : {True, False}
        default is True, display the current value of the slider next to it
    readout_format : str
        default is '.3g', specifier for the format function used to represent
        slider value for human consumption, modeled after Python 3's format
        specification mini-language (PEP 3101).
    

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#FloatLogSlider
    */
  export class _FloatLogSlider extends _Widget<TAnyFloatLogSlider> {
    constructor(options: TAnyFloatLogSlider) {
      super({ ..._FloatLogSlider.defaults(), ...options });
    }

    static defaults(): TAnyFloatLogSlider {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicFloatLogSlider.default,
        ...SCHEMA.IProtectedFloatLogSlider.default
      };
    }
  }

  /** the concrete observable FloatLogSlider */
  export const FloatLogSlider = _HasTraits._traitMeta<TAnyFloatLogSlider>(
    _FloatLogSlider
  );

  if (!ALL['FloatLogSlider']) {
    ALL['FloatLogSlider'] = FloatLogSlider;
  } else {
    console.log('FloatLogSlider is already hoisted', ALL['FloatLogSlider']);
  }

  // ---

  /** a type for the traits of FloatText*/
  export type TAnyFloatText = PROTO.FloatTextPublic | PROTO.FloatTextProtected;

  /** a naive FloatText 

     Displays a float value within a textbox. For a textbox in
    which the value must be within a specific range, use BoundedFloatText.

    Parameters
    ----------
    value : float
        value displayed
    step : float
        step of the increment (if None, any step is allowed)
    description : str
        description displayed next to the text box
    

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#FloatText
    */
  export class _FloatText extends _Widget<TAnyFloatText> {
    constructor(options: TAnyFloatText) {
      super({ ..._FloatText.defaults(), ...options });
    }

    static defaults(): TAnyFloatText {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicFloatText.default,
        ...SCHEMA.IProtectedFloatText.default
      };
    }
  }

  /** the concrete observable FloatText */
  export const FloatText = _HasTraits._traitMeta<TAnyFloatText>(_FloatText);

  if (!ALL['FloatText']) {
    ALL['FloatText'] = FloatText;
  } else {
    console.log('FloatText is already hoisted', ALL['FloatText']);
  }

  // ---

  /** a type for the traits of BoundedFloatText*/
  export type TAnyBoundedFloatText =
    | PROTO.BoundedFloatTextPublic
    | PROTO.BoundedFloatTextProtected;

  /** a naive BoundedFloatText 

     Displays a float value within a textbox. Value must be within the range specified.

    For a textbox in which the value doesn't need to be within a specific range, use FloatText.

    Parameters
    ----------
    value : float
        value displayed
    min : float
        minimal value of the range of possible values displayed
    max : float
        maximal value of the range of possible values displayed
    step : float
        step of the increment (if None, any step is allowed)
    description : str
        description displayed next to the textbox
    

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#BoundedFloatText
    */
  export class _BoundedFloatText extends _Widget<TAnyBoundedFloatText> {
    constructor(options: TAnyBoundedFloatText) {
      super({ ..._BoundedFloatText.defaults(), ...options });
    }

    static defaults(): TAnyBoundedFloatText {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicBoundedFloatText.default,
        ...SCHEMA.IProtectedBoundedFloatText.default
      };
    }
  }

  /** the concrete observable BoundedFloatText */
  export const BoundedFloatText = _HasTraits._traitMeta<TAnyBoundedFloatText>(
    _BoundedFloatText
  );

  if (!ALL['BoundedFloatText']) {
    ALL['BoundedFloatText'] = BoundedFloatText;
  } else {
    console.log('BoundedFloatText is already hoisted', ALL['BoundedFloatText']);
  }

  // ---

  /** a type for the traits of FloatProgress*/
  export type TAnyFloatProgress =
    | PROTO.FloatProgressPublic
    | PROTO.FloatProgressProtected;

  /** a naive FloatProgress 

     Displays a progress bar.

    Parameters
    -----------
    value : float
        position within the range of the progress bar
    min : float
        minimal position of the slider
    max : float
        maximal position of the slider
    description : str
        name of the progress bar
    orientation : {'horizontal', 'vertical'}
        default is 'horizontal', orientation of the progress bar
    bar_style: {'success', 'info', 'warning', 'danger', ''}
        color of the progress bar, default is '' (blue)
        colors are: 'success'-green, 'info'-light blue, 'warning'-orange, 'danger'-red
    

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#FloatProgress
    */
  export class _FloatProgress extends _Widget<TAnyFloatProgress> {
    constructor(options: TAnyFloatProgress) {
      super({ ..._FloatProgress.defaults(), ...options });
    }

    static defaults(): TAnyFloatProgress {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicFloatProgress.default,
        ...SCHEMA.IProtectedFloatProgress.default
      };
    }
  }

  /** the concrete observable FloatProgress */
  export const FloatProgress = _HasTraits._traitMeta<TAnyFloatProgress>(_FloatProgress);

  if (!ALL['FloatProgress']) {
    ALL['FloatProgress'] = FloatProgress;
  } else {
    console.log('FloatProgress is already hoisted', ALL['FloatProgress']);
  }

  // ---

  /** a type for the traits of _Float*/
  export type TAny_Float = PROTO._FloatPublic | PROTO._FloatProtected;

  /** a naive _Float 

    None

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#_Float
    */
  export class __Float extends _Widget<TAny_Float> {
    constructor(options: TAny_Float) {
      super({ ...__Float.defaults(), ...options });
    }

    static defaults(): TAny_Float {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublic_Float.default,
        ...SCHEMA.IProtected_Float.default
      };
    }
  }

  /** the concrete observable _Float */
  export const _Float = _HasTraits._traitMeta<TAny_Float>(__Float);

  if (!ALL['_Float']) {
    ALL['_Float'] = _Float;
  } else {
    console.log('_Float is already hoisted', ALL['_Float']);
  }

  // ---

  /** a type for the traits of FloatSlider*/
  export type TAnyFloatSlider = PROTO.FloatSliderPublic | PROTO.FloatSliderProtected;

  /** a naive FloatSlider 

     Slider/trackbar of floating values with the specified range.

    Parameters
    ----------
    value : float
        position of the slider
    min : float
        minimal position of the slider
    max : float
        maximal position of the slider
    step : float
        step of the trackbar
    description : str
        name of the slider
    orientation : {'horizontal', 'vertical'}
        default is 'horizontal', orientation of the slider
    readout : {True, False}
        default is True, display the current value of the slider next to it
    readout_format : str
        default is '.2f', specifier for the format function used to represent
        slider value for human consumption, modeled after Python 3's format
        specification mini-language (PEP 3101).
    

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#FloatSlider
    */
  export class _FloatSlider extends _Widget<TAnyFloatSlider> {
    constructor(options: TAnyFloatSlider) {
      super({ ..._FloatSlider.defaults(), ...options });
    }

    static defaults(): TAnyFloatSlider {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicFloatSlider.default,
        ...SCHEMA.IProtectedFloatSlider.default
      };
    }
  }

  /** the concrete observable FloatSlider */
  export const FloatSlider = _HasTraits._traitMeta<TAnyFloatSlider>(_FloatSlider);

  if (!ALL['FloatSlider']) {
    ALL['FloatSlider'] = FloatSlider;
  } else {
    console.log('FloatSlider is already hoisted', ALL['FloatSlider']);
  }

  // ---

  /** a type for the traits of _BoundedFloat*/
  export type TAny_BoundedFloat =
    | PROTO._BoundedFloatPublic
    | PROTO._BoundedFloatProtected;

  /** a naive _BoundedFloat 

    None

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#_BoundedFloat
    */
  export class __BoundedFloat extends _Widget<TAny_BoundedFloat> {
    constructor(options: TAny_BoundedFloat) {
      super({ ...__BoundedFloat.defaults(), ...options });
    }

    static defaults(): TAny_BoundedFloat {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublic_BoundedFloat.default,
        ...SCHEMA.IProtected_BoundedFloat.default
      };
    }
  }

  /** the concrete observable _BoundedFloat */
  export const _BoundedFloat = _HasTraits._traitMeta<TAny_BoundedFloat>(__BoundedFloat);

  if (!ALL['_BoundedFloat']) {
    ALL['_BoundedFloat'] = _BoundedFloat;
  } else {
    console.log('_BoundedFloat is already hoisted', ALL['_BoundedFloat']);
  }

  // ---

  /** a type for the traits of _FloatRange*/
  export type TAny_FloatRange = PROTO._FloatRangePublic | PROTO._FloatRangeProtected;

  /** a naive _FloatRange 

    None

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#_FloatRange
    */
  export class __FloatRange extends _Widget<TAny_FloatRange> {
    constructor(options: TAny_FloatRange) {
      super({ ...__FloatRange.defaults(), ...options });
    }

    static defaults(): TAny_FloatRange {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublic_FloatRange.default,
        ...SCHEMA.IProtected_FloatRange.default
      };
    }
  }

  /** the concrete observable _FloatRange */
  export const _FloatRange = _HasTraits._traitMeta<TAny_FloatRange>(__FloatRange);

  if (!ALL['_FloatRange']) {
    ALL['_FloatRange'] = _FloatRange;
  } else {
    console.log('_FloatRange is already hoisted', ALL['_FloatRange']);
  }

  // ---

  /** a type for the traits of _BoundedFloatRange*/
  export type TAny_BoundedFloatRange =
    | PROTO._BoundedFloatRangePublic
    | PROTO._BoundedFloatRangeProtected;

  /** a naive _BoundedFloatRange 

    None

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#_BoundedFloatRange
    */
  export class __BoundedFloatRange extends _Widget<TAny_BoundedFloatRange> {
    constructor(options: TAny_BoundedFloatRange) {
      super({ ...__BoundedFloatRange.defaults(), ...options });
    }

    static defaults(): TAny_BoundedFloatRange {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublic_BoundedFloatRange.default,
        ...SCHEMA.IProtected_BoundedFloatRange.default
      };
    }
  }

  /** the concrete observable _BoundedFloatRange */
  export const _BoundedFloatRange = _HasTraits._traitMeta<TAny_BoundedFloatRange>(
    __BoundedFloatRange
  );

  if (!ALL['_BoundedFloatRange']) {
    ALL['_BoundedFloatRange'] = _BoundedFloatRange;
  } else {
    console.log('_BoundedFloatRange is already hoisted', ALL['_BoundedFloatRange']);
  }

  // ---
} // end of ['ipywidgets', 'widgets', 'widget_float']

export namespace ipywidgets_widgets_widget_int {
  /** a type for the traits of IntProgress*/
  export type TAnyIntProgress = PROTO.IntProgressPublic | PROTO.IntProgressProtected;

  /** a naive IntProgress 

    Progress bar that represents an integer bounded from above and below.
    

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#IntProgress
    */
  export class _IntProgress extends _Widget<TAnyIntProgress> {
    constructor(options: TAnyIntProgress) {
      super({ ..._IntProgress.defaults(), ...options });
    }

    static defaults(): TAnyIntProgress {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicIntProgress.default,
        ...SCHEMA.IProtectedIntProgress.default
      };
    }
  }

  /** the concrete observable IntProgress */
  export const IntProgress = _HasTraits._traitMeta<TAnyIntProgress>(_IntProgress);

  if (!ALL['IntProgress']) {
    ALL['IntProgress'] = IntProgress;
  } else {
    console.log('IntProgress is already hoisted', ALL['IntProgress']);
  }

  // ---

  /** a type for the traits of IntRangeSlider*/
  export type TAnyIntRangeSlider =
    | PROTO.IntRangeSliderPublic
    | PROTO.IntRangeSliderProtected;

  /** a naive IntRangeSlider 

    Slider/trackbar that represents a pair of ints bounded by minimum and maximum value.

    Parameters
    ----------
    value : int tuple
        The pair (`lower`, `upper`) of integers
    min : int
        The lowest allowed value for `lower`
    max : int
        The highest allowed value for `upper`
    

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#IntRangeSlider
    */
  export class _IntRangeSlider extends _Widget<TAnyIntRangeSlider> {
    constructor(options: TAnyIntRangeSlider) {
      super({ ..._IntRangeSlider.defaults(), ...options });
    }

    static defaults(): TAnyIntRangeSlider {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicIntRangeSlider.default,
        ...SCHEMA.IProtectedIntRangeSlider.default
      };
    }
  }

  /** the concrete observable IntRangeSlider */
  export const IntRangeSlider = _HasTraits._traitMeta<TAnyIntRangeSlider>(
    _IntRangeSlider
  );

  if (!ALL['IntRangeSlider']) {
    ALL['IntRangeSlider'] = IntRangeSlider;
  } else {
    console.log('IntRangeSlider is already hoisted', ALL['IntRangeSlider']);
  }

  // ---

  /** a type for the traits of _BoundedInt*/
  export type TAny_BoundedInt = PROTO._BoundedIntPublic | PROTO._BoundedIntProtected;

  /** a naive _BoundedInt 

    Base class for widgets that represent an integer bounded from above and below.
    

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#_BoundedInt
    */
  export class __BoundedInt extends _Widget<TAny_BoundedInt> {
    constructor(options: TAny_BoundedInt) {
      super({ ...__BoundedInt.defaults(), ...options });
    }

    static defaults(): TAny_BoundedInt {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublic_BoundedInt.default,
        ...SCHEMA.IProtected_BoundedInt.default
      };
    }
  }

  /** the concrete observable _BoundedInt */
  export const _BoundedInt = _HasTraits._traitMeta<TAny_BoundedInt>(__BoundedInt);

  if (!ALL['_BoundedInt']) {
    ALL['_BoundedInt'] = _BoundedInt;
  } else {
    console.log('_BoundedInt is already hoisted', ALL['_BoundedInt']);
  }

  // ---

  /** a type for the traits of _Int*/
  export type TAny_Int = PROTO._IntPublic | PROTO._IntProtected;

  /** a naive _Int 

    Base class for widgets that represent an integer.

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#_Int
    */
  export class __Int extends _Widget<TAny_Int> {
    constructor(options: TAny_Int) {
      super({ ...__Int.defaults(), ...options });
    }

    static defaults(): TAny_Int {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublic_Int.default,
        ...SCHEMA.IProtected_Int.default
      };
    }
  }

  /** the concrete observable _Int */
  export const _Int = _HasTraits._traitMeta<TAny_Int>(__Int);

  if (!ALL['_Int']) {
    ALL['_Int'] = _Int;
  } else {
    console.log('_Int is already hoisted', ALL['_Int']);
  }

  // ---

  /** a type for the traits of _IntRange*/
  export type TAny_IntRange = PROTO._IntRangePublic | PROTO._IntRangeProtected;

  /** a naive _IntRange 

    None

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#_IntRange
    */
  export class __IntRange extends _Widget<TAny_IntRange> {
    constructor(options: TAny_IntRange) {
      super({ ...__IntRange.defaults(), ...options });
    }

    static defaults(): TAny_IntRange {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublic_IntRange.default,
        ...SCHEMA.IProtected_IntRange.default
      };
    }
  }

  /** the concrete observable _IntRange */
  export const _IntRange = _HasTraits._traitMeta<TAny_IntRange>(__IntRange);

  if (!ALL['_IntRange']) {
    ALL['_IntRange'] = _IntRange;
  } else {
    console.log('_IntRange is already hoisted', ALL['_IntRange']);
  }

  // ---

  /** a type for the traits of SliderStyle*/
  export type TAnySliderStyle = PROTO.SliderStylePublic | PROTO.SliderStyleProtected;

  /** a naive SliderStyle 

    Button style widget.

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#SliderStyle
    */
  export class _SliderStyle extends _Widget<TAnySliderStyle> {
    constructor(options: TAnySliderStyle) {
      super({ ..._SliderStyle.defaults(), ...options });
    }

    static defaults(): TAnySliderStyle {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicSliderStyle.default,
        ...SCHEMA.IProtectedSliderStyle.default
      };
    }
  }

  /** the concrete observable SliderStyle */
  export const SliderStyle = _HasTraits._traitMeta<TAnySliderStyle>(_SliderStyle);

  if (!ALL['SliderStyle']) {
    ALL['SliderStyle'] = SliderStyle;
  } else {
    console.log('SliderStyle is already hoisted', ALL['SliderStyle']);
  }

  // ---

  /** a type for the traits of IntSlider*/
  export type TAnyIntSlider = PROTO.IntSliderPublic | PROTO.IntSliderProtected;

  /** a naive IntSlider 

    Slider widget that represents an integer bounded from above and below.
    

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#IntSlider
    */
  export class _IntSlider extends _Widget<TAnyIntSlider> {
    constructor(options: TAnyIntSlider) {
      super({ ..._IntSlider.defaults(), ...options });
    }

    static defaults(): TAnyIntSlider {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicIntSlider.default,
        ...SCHEMA.IProtectedIntSlider.default
      };
    }
  }

  /** the concrete observable IntSlider */
  export const IntSlider = _HasTraits._traitMeta<TAnyIntSlider>(_IntSlider);

  if (!ALL['IntSlider']) {
    ALL['IntSlider'] = IntSlider;
  } else {
    console.log('IntSlider is already hoisted', ALL['IntSlider']);
  }

  // ---

  /** a type for the traits of Play*/
  export type TAnyPlay = PROTO.PlayPublic | PROTO.PlayProtected;

  /** a naive Play 

    Play/repeat buttons to step through values automatically, and optionally loop.
    

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#Play
    */
  export class _Play extends _Widget<TAnyPlay> {
    constructor(options: TAnyPlay) {
      super({ ..._Play.defaults(), ...options });
    }

    static defaults(): TAnyPlay {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicPlay.default,
        ...SCHEMA.IProtectedPlay.default
      };
    }
  }

  /** the concrete observable Play */
  export const Play = _HasTraits._traitMeta<TAnyPlay>(_Play);

  if (!ALL['Play']) {
    ALL['Play'] = Play;
  } else {
    console.log('Play is already hoisted', ALL['Play']);
  }

  // ---

  /** a type for the traits of BoundedIntText*/
  export type TAnyBoundedIntText =
    | PROTO.BoundedIntTextPublic
    | PROTO.BoundedIntTextProtected;

  /** a naive BoundedIntText 

    Textbox widget that represents an integer bounded from above and below.
    

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#BoundedIntText
    */
  export class _BoundedIntText extends _Widget<TAnyBoundedIntText> {
    constructor(options: TAnyBoundedIntText) {
      super({ ..._BoundedIntText.defaults(), ...options });
    }

    static defaults(): TAnyBoundedIntText {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicBoundedIntText.default,
        ...SCHEMA.IProtectedBoundedIntText.default
      };
    }
  }

  /** the concrete observable BoundedIntText */
  export const BoundedIntText = _HasTraits._traitMeta<TAnyBoundedIntText>(
    _BoundedIntText
  );

  if (!ALL['BoundedIntText']) {
    ALL['BoundedIntText'] = BoundedIntText;
  } else {
    console.log('BoundedIntText is already hoisted', ALL['BoundedIntText']);
  }

  // ---

  /** a type for the traits of IntText*/
  export type TAnyIntText = PROTO.IntTextPublic | PROTO.IntTextProtected;

  /** a naive IntText 

    Textbox widget that represents an integer.

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#IntText
    */
  export class _IntText extends _Widget<TAnyIntText> {
    constructor(options: TAnyIntText) {
      super({ ..._IntText.defaults(), ...options });
    }

    static defaults(): TAnyIntText {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicIntText.default,
        ...SCHEMA.IProtectedIntText.default
      };
    }
  }

  /** the concrete observable IntText */
  export const IntText = _HasTraits._traitMeta<TAnyIntText>(_IntText);

  if (!ALL['IntText']) {
    ALL['IntText'] = IntText;
  } else {
    console.log('IntText is already hoisted', ALL['IntText']);
  }

  // ---

  /** a type for the traits of ProgressStyle*/
  export type TAnyProgressStyle =
    | PROTO.ProgressStylePublic
    | PROTO.ProgressStyleProtected;

  /** a naive ProgressStyle 

    Button style widget.

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#ProgressStyle
    */
  export class _ProgressStyle extends _Widget<TAnyProgressStyle> {
    constructor(options: TAnyProgressStyle) {
      super({ ..._ProgressStyle.defaults(), ...options });
    }

    static defaults(): TAnyProgressStyle {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicProgressStyle.default,
        ...SCHEMA.IProtectedProgressStyle.default
      };
    }
  }

  /** the concrete observable ProgressStyle */
  export const ProgressStyle = _HasTraits._traitMeta<TAnyProgressStyle>(_ProgressStyle);

  if (!ALL['ProgressStyle']) {
    ALL['ProgressStyle'] = ProgressStyle;
  } else {
    console.log('ProgressStyle is already hoisted', ALL['ProgressStyle']);
  }

  // ---

  /** a type for the traits of _BoundedIntRange*/
  export type TAny_BoundedIntRange =
    | PROTO._BoundedIntRangePublic
    | PROTO._BoundedIntRangeProtected;

  /** a naive _BoundedIntRange 

    None

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#_BoundedIntRange
    */
  export class __BoundedIntRange extends _Widget<TAny_BoundedIntRange> {
    constructor(options: TAny_BoundedIntRange) {
      super({ ...__BoundedIntRange.defaults(), ...options });
    }

    static defaults(): TAny_BoundedIntRange {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublic_BoundedIntRange.default,
        ...SCHEMA.IProtected_BoundedIntRange.default
      };
    }
  }

  /** the concrete observable _BoundedIntRange */
  export const _BoundedIntRange = _HasTraits._traitMeta<TAny_BoundedIntRange>(
    __BoundedIntRange
  );

  if (!ALL['_BoundedIntRange']) {
    ALL['_BoundedIntRange'] = _BoundedIntRange;
  } else {
    console.log('_BoundedIntRange is already hoisted', ALL['_BoundedIntRange']);
  }

  // ---
} // end of ['ipywidgets', 'widgets', 'widget_int']

export namespace ipywidgets_widgets_widget_layout {
  /** a type for the traits of Layout*/
  export type TAnyLayout = PROTO.LayoutPublic | PROTO.LayoutProtected;

  /** a naive Layout 

    Layout specification

    Defines a layout that can be expressed using CSS.  Supports a subset of
    https://developer.mozilla.org/en-US/docs/Web/CSS/Reference

    When a property is also accessible via a shorthand property, we only
    expose the shorthand.

    For example:
    - ``flex-grow``, ``flex-shrink`` and ``flex-basis`` are bound to ``flex``.
    - ``flex-wrap`` and ``flex-direction`` are bound to ``flex-flow``.
    - ``margin-[top/bottom/left/right]`` values are bound to ``margin``, etc.
    

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#Layout
    */
  export class _Layout extends _Widget<TAnyLayout> {
    constructor(options: TAnyLayout) {
      super({ ..._Layout.defaults(), ...options });
    }

    static defaults(): TAnyLayout {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicLayout.default,
        ...SCHEMA.IProtectedLayout.default
      };
    }
  }

  /** the concrete observable Layout */
  export const Layout = _HasTraits._traitMeta<TAnyLayout>(_Layout);

  if (!ALL['Layout']) {
    ALL['Layout'] = Layout;
  } else {
    console.log('Layout is already hoisted', ALL['Layout']);
  }

  // ---
} // end of ['ipywidgets', 'widgets', 'widget_layout']

export namespace ipywidgets_widgets_widget_media {
  /** a type for the traits of _Media*/
  export type TAny_Media = PROTO._MediaPublic | PROTO._MediaProtected;

  /** a naive _Media 

    Base class for Image, Audio and Video widgets.

    The `value` of this widget accepts a byte string.  The byte string is the
    raw data that you want the browser to display.

    If you pass `"url"` to the `"format"` trait, `value` will be interpreted
    as a URL as bytes encoded in UTF-8.
    

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#_Media
    */
  export class __Media extends _Widget<TAny_Media> {
    constructor(options: TAny_Media) {
      super({ ...__Media.defaults(), ...options });
    }

    static defaults(): TAny_Media {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublic_Media.default,
        ...SCHEMA.IProtected_Media.default
      };
    }
  }

  /** the concrete observable _Media */
  export const _Media = _HasTraits._traitMeta<TAny_Media>(__Media);

  if (!ALL['_Media']) {
    ALL['_Media'] = _Media;
  } else {
    console.log('_Media is already hoisted', ALL['_Media']);
  }

  // ---

  /** a type for the traits of Audio*/
  export type TAnyAudio = PROTO.AudioPublic | PROTO.AudioProtected;

  /** a naive Audio 

    Displays a audio as a widget.

    The `value` of this widget accepts a byte string.  The byte string is the
    raw audio data that you want the browser to display.  You can explicitly
    define the format of the byte string using the `format` trait (which
    defaults to "mp3").

    If you pass `"url"` to the `"format"` trait, `value` will be interpreted
    as a URL as bytes encoded in UTF-8.
    

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#Audio
    */
  export class _Audio extends _Widget<TAnyAudio> {
    constructor(options: TAnyAudio) {
      super({ ..._Audio.defaults(), ...options });
    }

    static defaults(): TAnyAudio {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicAudio.default,
        ...SCHEMA.IProtectedAudio.default
      };
    }
  }

  /** the concrete observable Audio */
  export const Audio = _HasTraits._traitMeta<TAnyAudio>(_Audio);

  if (!ALL['Audio']) {
    ALL['Audio'] = Audio;
  } else {
    console.log('Audio is already hoisted', ALL['Audio']);
  }

  // ---

  /** a type for the traits of Image*/
  export type TAnyImage = PROTO.ImagePublic | PROTO.ImageProtected;

  /** a naive Image 

    Displays an image as a widget.

    The `value` of this widget accepts a byte string.  The byte string is the
    raw image data that you want the browser to display.  You can explicitly
    define the format of the byte string using the `format` trait (which
    defaults to "png").

    If you pass `"url"` to the `"format"` trait, `value` will be interpreted
    as a URL as bytes encoded in UTF-8.
    

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#Image
    */
  export class _Image extends _Widget<TAnyImage> {
    constructor(options: TAnyImage) {
      super({ ..._Image.defaults(), ...options });
    }

    static defaults(): TAnyImage {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicImage.default,
        ...SCHEMA.IProtectedImage.default
      };
    }
  }

  /** the concrete observable Image */
  export const Image = _HasTraits._traitMeta<TAnyImage>(_Image);

  if (!ALL['Image']) {
    ALL['Image'] = Image;
  } else {
    console.log('Image is already hoisted', ALL['Image']);
  }

  // ---

  /** a type for the traits of Video*/
  export type TAnyVideo = PROTO.VideoPublic | PROTO.VideoProtected;

  /** a naive Video 

    Displays a video as a widget.

    The `value` of this widget accepts a byte string.  The byte string is the
    raw video data that you want the browser to display.  You can explicitly
    define the format of the byte string using the `format` trait (which
    defaults to "mp4").

    If you pass `"url"` to the `"format"` trait, `value` will be interpreted
    as a URL as bytes encoded in UTF-8.
    

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#Video
    */
  export class _Video extends _Widget<TAnyVideo> {
    constructor(options: TAnyVideo) {
      super({ ..._Video.defaults(), ...options });
    }

    static defaults(): TAnyVideo {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicVideo.default,
        ...SCHEMA.IProtectedVideo.default
      };
    }
  }

  /** the concrete observable Video */
  export const Video = _HasTraits._traitMeta<TAnyVideo>(_Video);

  if (!ALL['Video']) {
    ALL['Video'] = Video;
  } else {
    console.log('Video is already hoisted', ALL['Video']);
  }

  // ---
} // end of ['ipywidgets', 'widgets', 'widget_media']

export namespace ipywidgets_widgets_widget_output {
  /** a type for the traits of Output*/
  export type TAnyOutput = PROTO.OutputPublic | PROTO.OutputProtected;

  /** a naive Output 

    Widget used as a context manager to display output.

    This widget can capture and display stdout, stderr, and rich output.  To use
    it, create an instance of it and display it.

    You can then use the widget as a context manager: any output produced while in the
    context will be captured and displayed in the widget instead of the standard output
    area.

    You can also use the .capture() method to decorate a function or a method. Any output 
    produced by the function will then go to the output widget. This is useful for
    debugging widget callbacks, for example.

    Example::
        import ipywidgets as widgets
        from IPython.display import display
        out = widgets.Output()
        display(out)

        print('prints to output area')

        with out:
            print('prints to output widget')

        @out.capture()
        def func():
            print('prints to output widget')
    

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#Output
    */
  export class _Output extends _Widget<TAnyOutput> {
    constructor(options: TAnyOutput) {
      super({ ..._Output.defaults(), ...options });
    }

    static defaults(): TAnyOutput {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicOutput.default,
        ...SCHEMA.IProtectedOutput.default
      };
    }
  }

  /** the concrete observable Output */
  export const Output = _HasTraits._traitMeta<TAnyOutput>(_Output);

  if (!ALL['Output']) {
    ALL['Output'] = Output;
  } else {
    console.log('Output is already hoisted', ALL['Output']);
  }

  // ---
} // end of ['ipywidgets', 'widgets', 'widget_output']

export namespace ipywidgets_widgets_widget_selection {
  /** a type for the traits of SelectMultiple*/
  export type TAnySelectMultiple =
    | PROTO.SelectMultiplePublic
    | PROTO.SelectMultipleProtected;

  /** a naive SelectMultiple 

    
    Listbox that allows many items to be selected at any given time.

    The ``value``, ``label`` and ``index`` attributes are all iterables.

    Parameters
    ----------
    options: dict or list
        The options for the dropdown. This can either be a list of values, e.g.
        ``['Galileo', 'Brahe', 'Hubble']`` or ``[0, 1, 2]``, a list of
        (label, value) pairs, e.g.
        ``[('Galileo', 0), ('Brahe', 1), ('Hubble', 2)]``,
        or a dictionary mapping the labels to the values, e.g. ``{'Galileo': 0,
        'Brahe': 1, 'Hubble': 2}``. The labels are the strings that will be
        displayed in the UI, representing the actual Python choices, and should
        be unique. If this is a dictionary, the order in which they are
        displayed is not guaranteed.

    index: iterable of int
        The indices of the options that are selected.

    value: iterable
        The values that are selected. When programmatically setting the
        value, a reverse lookup is performed among the options to check that
        the value is valid. The reverse lookup uses the equality operator by
        default, but another predicate may be provided via the ``equals``
        keyword argument. For example, when dealing with numpy arrays, one may
        set ``equals=np.array_equal``.

    label: iterable of str
        The labels corresponding to the selected value.

    disabled: bool
        Whether to disable user changes.

    description: str
        Label for this input group. This should be a string
        describing the widget.

    rows: int
        The number of rows to display in the widget.
    

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#SelectMultiple
    */
  export class _SelectMultiple extends _Widget<TAnySelectMultiple> {
    constructor(options: TAnySelectMultiple) {
      super({ ..._SelectMultiple.defaults(), ...options });
    }

    static defaults(): TAnySelectMultiple {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicSelectMultiple.default,
        ...SCHEMA.IProtectedSelectMultiple.default
      };
    }
  }

  /** the concrete observable SelectMultiple */
  export const SelectMultiple = _HasTraits._traitMeta<TAnySelectMultiple>(
    _SelectMultiple
  );

  if (!ALL['SelectMultiple']) {
    ALL['SelectMultiple'] = SelectMultiple;
  } else {
    console.log('SelectMultiple is already hoisted', ALL['SelectMultiple']);
  }

  // ---

  /** a type for the traits of ToggleButtonsStyle*/
  export type TAnyToggleButtonsStyle =
    | PROTO.ToggleButtonsStylePublic
    | PROTO.ToggleButtonsStyleProtected;

  /** a naive ToggleButtonsStyle 

    Button style widget.

    Parameters
    ----------
    button_width: str
        The width of each button. This should be a valid CSS
        width, e.g. '10px' or '5em'.

    font_weight: str
        The text font weight of each button, This should be a valid CSS font
        weight unit, for example 'bold' or '600'
    

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#ToggleButtonsStyle
    */
  export class _ToggleButtonsStyle extends _Widget<TAnyToggleButtonsStyle> {
    constructor(options: TAnyToggleButtonsStyle) {
      super({ ..._ToggleButtonsStyle.defaults(), ...options });
    }

    static defaults(): TAnyToggleButtonsStyle {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicToggleButtonsStyle.default,
        ...SCHEMA.IProtectedToggleButtonsStyle.default
      };
    }
  }

  /** the concrete observable ToggleButtonsStyle */
  export const ToggleButtonsStyle = _HasTraits._traitMeta<TAnyToggleButtonsStyle>(
    _ToggleButtonsStyle
  );

  if (!ALL['ToggleButtonsStyle']) {
    ALL['ToggleButtonsStyle'] = ToggleButtonsStyle;
  } else {
    console.log('ToggleButtonsStyle is already hoisted', ALL['ToggleButtonsStyle']);
  }

  // ---

  /** a type for the traits of _MultipleSelection*/
  export type TAny_MultipleSelection =
    | PROTO._MultipleSelectionPublic
    | PROTO._MultipleSelectionProtected;

  /** a naive _MultipleSelection 

    Base class for multiple Selection widgets

    ``options`` can be specified as a list of values, list of (label, value)
    tuples, or a dict of {label: value}. The labels are the strings that will be
    displayed in the UI, representing the actual Python choices, and should be
    unique. If labels are not specified, they are generated from the values.

    When programmatically setting the value, a reverse lookup is performed
    among the options to check that the value is valid. The reverse lookup uses
    the equality operator by default, but another predicate may be provided via
    the ``equals`` keyword argument. For example, when dealing with numpy arrays,
    one may set equals=np.array_equal.
    

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#_MultipleSelection
    */
  export class __MultipleSelection extends _Widget<TAny_MultipleSelection> {
    constructor(options: TAny_MultipleSelection) {
      super({ ...__MultipleSelection.defaults(), ...options });
    }

    static defaults(): TAny_MultipleSelection {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublic_MultipleSelection.default,
        ...SCHEMA.IProtected_MultipleSelection.default
      };
    }
  }

  /** the concrete observable _MultipleSelection */
  export const _MultipleSelection = _HasTraits._traitMeta<TAny_MultipleSelection>(
    __MultipleSelection
  );

  if (!ALL['_MultipleSelection']) {
    ALL['_MultipleSelection'] = _MultipleSelection;
  } else {
    console.log('_MultipleSelection is already hoisted', ALL['_MultipleSelection']);
  }

  // ---
} // end of ['ipywidgets', 'widgets', 'widget_selection']

export namespace ipywidgets_widgets_widget_selectioncontainer {
  /** a type for the traits of Accordion*/
  export type TAnyAccordion = PROTO.AccordionPublic | PROTO.AccordionProtected;

  /** a naive Accordion 

    Displays children each on a separate accordion page.

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#Accordion
    */
  export class _Accordion extends _Widget<TAnyAccordion> {
    constructor(options: TAnyAccordion) {
      super({ ..._Accordion.defaults(), ...options });
    }

    static defaults(): TAnyAccordion {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicAccordion.default,
        ...SCHEMA.IProtectedAccordion.default
      };
    }
  }

  /** the concrete observable Accordion */
  export const Accordion = _HasTraits._traitMeta<TAnyAccordion>(_Accordion);

  if (!ALL['Accordion']) {
    ALL['Accordion'] = Accordion;
  } else {
    console.log('Accordion is already hoisted', ALL['Accordion']);
  }

  // ---

  /** a type for the traits of _SelectionContainer*/
  export type TAny_SelectionContainer =
    | PROTO._SelectionContainerPublic
    | PROTO._SelectionContainerProtected;

  /** a naive _SelectionContainer 

    Base class used to display multiple child widgets.

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#_SelectionContainer
    */
  export class __SelectionContainer extends _Widget<TAny_SelectionContainer> {
    constructor(options: TAny_SelectionContainer) {
      super({ ...__SelectionContainer.defaults(), ...options });
    }

    static defaults(): TAny_SelectionContainer {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublic_SelectionContainer.default,
        ...SCHEMA.IProtected_SelectionContainer.default
      };
    }
  }

  /** the concrete observable _SelectionContainer */
  export const _SelectionContainer = _HasTraits._traitMeta<TAny_SelectionContainer>(
    __SelectionContainer
  );

  if (!ALL['_SelectionContainer']) {
    ALL['_SelectionContainer'] = _SelectionContainer;
  } else {
    console.log('_SelectionContainer is already hoisted', ALL['_SelectionContainer']);
  }

  // ---

  /** a type for the traits of Tab*/
  export type TAnyTab = PROTO.TabPublic | PROTO.TabProtected;

  /** a naive Tab 

    Displays children each on a separate accordion tab.

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#Tab
    */
  export class _Tab extends _Widget<TAnyTab> {
    constructor(options: TAnyTab) {
      super({ ..._Tab.defaults(), ...options });
    }

    static defaults(): TAnyTab {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicTab.default,
        ...SCHEMA.IProtectedTab.default
      };
    }
  }

  /** the concrete observable Tab */
  export const Tab = _HasTraits._traitMeta<TAnyTab>(_Tab);

  if (!ALL['Tab']) {
    ALL['Tab'] = Tab;
  } else {
    console.log('Tab is already hoisted', ALL['Tab']);
  }

  // ---
} // end of ['ipywidgets', 'widgets', 'widget_selectioncontainer']

export namespace ipywidgets_widgets_widget_string {
  /** a type for the traits of Textarea*/
  export type TAnyTextarea = PROTO.TextareaPublic | PROTO.TextareaProtected;

  /** a naive Textarea 

    Multiline text area widget.

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#Textarea
    */
  export class _Textarea extends _Widget<TAnyTextarea> {
    constructor(options: TAnyTextarea) {
      super({ ..._Textarea.defaults(), ...options });
    }

    static defaults(): TAnyTextarea {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicTextarea.default,
        ...SCHEMA.IProtectedTextarea.default
      };
    }
  }

  /** the concrete observable Textarea */
  export const Textarea = _HasTraits._traitMeta<TAnyTextarea>(_Textarea);

  if (!ALL['Textarea']) {
    ALL['Textarea'] = Textarea;
  } else {
    console.log('Textarea is already hoisted', ALL['Textarea']);
  }

  // ---

  /** a type for the traits of _String*/
  export type TAny_String = PROTO._StringPublic | PROTO._StringProtected;

  /** a naive _String 

    Base class used to create widgets that represent a string.

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#_String
    */
  export class __String extends _Widget<TAny_String> {
    constructor(options: TAny_String) {
      super({ ...__String.defaults(), ...options });
    }

    static defaults(): TAny_String {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublic_String.default,
        ...SCHEMA.IProtected_String.default
      };
    }
  }

  /** the concrete observable _String */
  export const _String = _HasTraits._traitMeta<TAny_String>(__String);

  if (!ALL['_String']) {
    ALL['_String'] = _String;
  } else {
    console.log('_String is already hoisted', ALL['_String']);
  }

  // ---

  /** a type for the traits of HTML*/
  export type TAnyHTML = PROTO.HTMLPublic | PROTO.HTMLProtected;

  /** a naive HTML 

    Renders the string `value` as HTML.

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#HTML
    */
  export class _HTML extends _Widget<TAnyHTML> {
    constructor(options: TAnyHTML) {
      super({ ..._HTML.defaults(), ...options });
    }

    static defaults(): TAnyHTML {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicHTML.default,
        ...SCHEMA.IProtectedHTML.default
      };
    }
  }

  /** the concrete observable HTML */
  export const HTML = _HasTraits._traitMeta<TAnyHTML>(_HTML);

  if (!ALL['HTML']) {
    ALL['HTML'] = HTML;
  } else {
    console.log('HTML is already hoisted', ALL['HTML']);
  }

  // ---

  /** a type for the traits of Text*/
  export type TAnyText = PROTO.TextPublic | PROTO.TextProtected;

  /** a naive Text 

    Single line textbox widget.

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#Text
    */
  export class _Text extends _Widget<TAnyText> {
    constructor(options: TAnyText) {
      super({ ..._Text.defaults(), ...options });
    }

    static defaults(): TAnyText {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicText.default,
        ...SCHEMA.IProtectedText.default
      };
    }
  }

  /** the concrete observable Text */
  export const Text = _HasTraits._traitMeta<TAnyText>(_Text);

  if (!ALL['Text']) {
    ALL['Text'] = Text;
  } else {
    console.log('Text is already hoisted', ALL['Text']);
  }

  // ---

  /** a type for the traits of Password*/
  export type TAnyPassword = PROTO.PasswordPublic | PROTO.PasswordProtected;

  /** a naive Password 

    Single line textbox widget.

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#Password
    */
  export class _Password extends _Widget<TAnyPassword> {
    constructor(options: TAnyPassword) {
      super({ ..._Password.defaults(), ...options });
    }

    static defaults(): TAnyPassword {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicPassword.default,
        ...SCHEMA.IProtectedPassword.default
      };
    }
  }

  /** the concrete observable Password */
  export const Password = _HasTraits._traitMeta<TAnyPassword>(_Password);

  if (!ALL['Password']) {
    ALL['Password'] = Password;
  } else {
    console.log('Password is already hoisted', ALL['Password']);
  }

  // ---

  /** a type for the traits of Combobox*/
  export type TAnyCombobox = PROTO.ComboboxPublic | PROTO.ComboboxProtected;

  /** a naive Combobox 

    Single line textbox widget with a dropdown and autocompletion.
    

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#Combobox
    */
  export class _Combobox extends _Widget<TAnyCombobox> {
    constructor(options: TAnyCombobox) {
      super({ ..._Combobox.defaults(), ...options });
    }

    static defaults(): TAnyCombobox {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicCombobox.default,
        ...SCHEMA.IProtectedCombobox.default
      };
    }
  }

  /** the concrete observable Combobox */
  export const Combobox = _HasTraits._traitMeta<TAnyCombobox>(_Combobox);

  if (!ALL['Combobox']) {
    ALL['Combobox'] = Combobox;
  } else {
    console.log('Combobox is already hoisted', ALL['Combobox']);
  }

  // ---

  /** a type for the traits of HTMLMath*/
  export type TAnyHTMLMath = PROTO.HTMLMathPublic | PROTO.HTMLMathProtected;

  /** a naive HTMLMath 

    Renders the string `value` as HTML, and render mathematics.

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#HTMLMath
    */
  export class _HTMLMath extends _Widget<TAnyHTMLMath> {
    constructor(options: TAnyHTMLMath) {
      super({ ..._HTMLMath.defaults(), ...options });
    }

    static defaults(): TAnyHTMLMath {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicHTMLMath.default,
        ...SCHEMA.IProtectedHTMLMath.default
      };
    }
  }

  /** the concrete observable HTMLMath */
  export const HTMLMath = _HasTraits._traitMeta<TAnyHTMLMath>(_HTMLMath);

  if (!ALL['HTMLMath']) {
    ALL['HTMLMath'] = HTMLMath;
  } else {
    console.log('HTMLMath is already hoisted', ALL['HTMLMath']);
  }

  // ---

  /** a type for the traits of Label*/
  export type TAnyLabel = PROTO.LabelPublic | PROTO.LabelProtected;

  /** a naive Label 

    Label widget.

    It also renders math inside the string `value` as Latex (requires $ $ or
    $$ $$ and similar latex tags).
    

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#Label
    */
  export class _Label extends _Widget<TAnyLabel> {
    constructor(options: TAnyLabel) {
      super({ ..._Label.defaults(), ...options });
    }

    static defaults(): TAnyLabel {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicLabel.default,
        ...SCHEMA.IProtectedLabel.default
      };
    }
  }

  /** the concrete observable Label */
  export const Label = _HasTraits._traitMeta<TAnyLabel>(_Label);

  if (!ALL['Label']) {
    ALL['Label'] = Label;
  } else {
    console.log('Label is already hoisted', ALL['Label']);
  }

  // ---
} // end of ['ipywidgets', 'widgets', 'widget_string']

export namespace ipywidgets_widgets_widget_style {
  /** a type for the traits of Style*/
  export type TAnyStyle = PROTO.StylePublic | PROTO.StyleProtected;

  /** a naive Style 

    Style specification

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#Style
    */
  export class _Style extends _Widget<TAnyStyle> {
    constructor(options: TAnyStyle) {
      super({ ..._Style.defaults(), ...options });
    }

    static defaults(): TAnyStyle {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicStyle.default,
        ...SCHEMA.IProtectedStyle.default
      };
    }
  }

  /** the concrete observable Style */
  export const Style = _HasTraits._traitMeta<TAnyStyle>(_Style);

  if (!ALL['Style']) {
    ALL['Style'] = Style;
  } else {
    console.log('Style is already hoisted', ALL['Style']);
  }

  // ---
} // end of ['ipywidgets', 'widgets', 'widget_style']

export namespace ipywidgets_widgets_widget_templates {
  /** a type for the traits of TwoByTwoLayout*/
  export type TAnyTwoByTwoLayout =
    | PROTO.TwoByTwoLayoutPublic
    | PROTO.TwoByTwoLayoutProtected;

  /** a naive TwoByTwoLayout 

     Define a layout with 2x2 regular grid.

    Parameters
    ----------

    top_left: instance of Widget
    top_right: instance of Widget
    bottom_left: instance of Widget
    bottom_right: instance of Widget
        widgets to fill the positions in the layout

    merge: bool
        flag to say whether the empty positions should be automatically merged

    grid_gap : str
        CSS attribute used to set the gap between the grid cells

    justify_content : str, in ['flex-start', 'flex-end', 'center', 'space-between', 'space-around']
        CSS attribute used to align widgets vertically

    align_items : str, in ['top', 'bottom', 'center', 'flex-start', 'flex-end', 'baseline', 'stretch']
        CSS attribute used to align widgets horizontally

    width : str
    height : str
        width and height

    Examples
    --------

    >>> from ipywidgets import TwoByTwoLayout, Button
    >>> TwoByTwoLayout(top_left=Button(description="Top left"),
    ...                top_right=Button(description="Top right"),
    ...                bottom_left=Button(description="Bottom left"),
    ...                bottom_right=Button(description="Bottom right"))

    

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#TwoByTwoLayout
    */
  export class _TwoByTwoLayout extends _Widget<TAnyTwoByTwoLayout> {
    constructor(options: TAnyTwoByTwoLayout) {
      super({ ..._TwoByTwoLayout.defaults(), ...options });
    }

    static defaults(): TAnyTwoByTwoLayout {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicTwoByTwoLayout.default,
        ...SCHEMA.IProtectedTwoByTwoLayout.default
      };
    }
  }

  /** the concrete observable TwoByTwoLayout */
  export const TwoByTwoLayout = _HasTraits._traitMeta<TAnyTwoByTwoLayout>(
    _TwoByTwoLayout
  );

  if (!ALL['TwoByTwoLayout']) {
    ALL['TwoByTwoLayout'] = TwoByTwoLayout;
  } else {
    console.log('TwoByTwoLayout is already hoisted', ALL['TwoByTwoLayout']);
  }

  // ---

  /** a type for the traits of AppLayout*/
  export type TAnyAppLayout = PROTO.AppLayoutPublic | PROTO.AppLayoutProtected;

  /** a naive AppLayout 

     Define an application like layout of widgets.

    Parameters
    ----------

    header: instance of Widget
    left_sidebar: instance of Widget
    center: instance of Widget
    right_sidebar: instance of Widget
    footer: instance of Widget
        widgets to fill the positions in the layout

    merge: bool
        flag to say whether the empty positions should be automatically merged

    pane_widths: list of numbers/strings
        the fraction of the total layout width each of the central panes should occupy
        (left_sidebar,
        center, right_sidebar)

    pane_heights: list of numbers/strings
        the fraction of the width the vertical space that the panes should occupy
         (left_sidebar, center, right_sidebar)

    grid_gap : str
        CSS attribute used to set the gap between the grid cells

    justify_content : str, in ['flex-start', 'flex-end', 'center', 'space-between', 'space-around']
        CSS attribute used to align widgets vertically

    align_items : str, in ['top', 'bottom', 'center', 'flex-start', 'flex-end', 'baseline', 'stretch']
        CSS attribute used to align widgets horizontally

    width : str
    height : str
        width and height

    Examples
    --------

    

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#AppLayout
    */
  export class _AppLayout extends _Widget<TAnyAppLayout> {
    constructor(options: TAnyAppLayout) {
      super({ ..._AppLayout.defaults(), ...options });
    }

    static defaults(): TAnyAppLayout {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicAppLayout.default,
        ...SCHEMA.IProtectedAppLayout.default
      };
    }
  }

  /** the concrete observable AppLayout */
  export const AppLayout = _HasTraits._traitMeta<TAnyAppLayout>(_AppLayout);

  if (!ALL['AppLayout']) {
    ALL['AppLayout'] = AppLayout;
  } else {
    console.log('AppLayout is already hoisted', ALL['AppLayout']);
  }

  // ---
} // end of ['ipywidgets', 'widgets', 'widget_templates']

export namespace ipywidgets_widgets_widget_upload {
  /** a type for the traits of FileUpload*/
  export type TAnyFileUpload = PROTO.FileUploadPublic | PROTO.FileUploadProtected;

  /** a naive FileUpload 

    
    Upload file(s) from browser to Python kernel as bytes
    

    @see https://ipywidgets.readthedocs.io/en/7.6.3/examples/Widget%20List.html#FileUpload
    */
  export class _FileUpload extends _Widget<TAnyFileUpload> {
    constructor(options: TAnyFileUpload) {
      super({ ..._FileUpload.defaults(), ...options });
    }

    static defaults(): TAnyFileUpload {
      return {
        ...super.defaults(),
        ...SCHEMA.IPublicFileUpload.default,
        ...SCHEMA.IProtectedFileUpload.default
      };
    }
  }

  /** the concrete observable FileUpload */
  export const FileUpload = _HasTraits._traitMeta<TAnyFileUpload>(_FileUpload);

  if (!ALL['FileUpload']) {
    ALL['FileUpload'] = FileUpload;
  } else {
    console.log('FileUpload is already hoisted', ALL['FileUpload']);
  }

  // ---
} // end of ['ipywidgets', 'widgets', 'widget_upload']

// fin
