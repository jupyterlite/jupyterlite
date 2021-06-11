/** 
    @see Widget 
    */

export type AnyWidget = APublicWidget | AProtectedWidget;
export type APublicWidget =
  | GridBoxPublic
  | _BoundedLogFloatPublic
  | TwoByTwoLayoutPublic
  | _BoolPublic
  | AppLayoutPublic
  | AccordionPublic
  | ValidPublic
  | IntProgressPublic
  | FloatRangeSliderPublic
  | FloatLogSliderPublic
  | LayoutPublic
  | TextareaPublic
  | _SelectionContainerPublic
  | TabPublic
  | IntRangeSliderPublic
  | _BoundedIntPublic
  | FloatTextPublic
  | ControllerPublic
  | ColorPickerPublic
  | _StringPublic
  | _MediaPublic
  | BoxPublic
  | CheckboxPublic
  | OutputPublic
  | _IntPublic
  | BoundedFloatTextPublic
  | AxisPublic
  | SelectMultiplePublic
  | HTMLPublic
  | CoreWidgetPublic
  | ToggleButtonsStylePublic
  | _IntRangePublic
  | SliderStylePublic
  | FloatProgressPublic
  | TextPublic
  | IntSliderPublic
  | AudioPublic
  | DescriptionStylePublic
  | _FloatPublic
  | PlayPublic
  | VBoxPublic
  | ButtonStylePublic
  | ImagePublic
  | PasswordPublic
  | FileUploadPublic
  | BoundedIntTextPublic
  | DOMWidgetPublic
  | FloatSliderPublic
  | ToggleButtonPublic
  | ComboboxPublic
  | HBoxPublic
  | HTMLMathPublic
  | _BoundedFloatPublic
  | _FloatRangePublic
  | ButtonPublic
  | _MultipleSelectionPublic
  | StylePublic
  | IntTextPublic
  | LabelPublic
  | VideoPublic
  | DescriptionWidgetPublic
  | ProgressStylePublic
  | WidgetPublic
  | _BoundedFloatRangePublic
  | _BoundedIntRangePublic;
export type AProtectedWidget =
  | GridBoxProtected
  | _BoundedLogFloatProtected
  | TwoByTwoLayoutProtected
  | _BoolProtected
  | AppLayoutProtected
  | AccordionProtected
  | ValidProtected
  | IntProgressProtected
  | FloatRangeSliderProtected
  | FloatLogSliderProtected
  | LayoutProtected
  | TextareaProtected
  | _SelectionContainerProtected
  | TabProtected
  | IntRangeSliderProtected
  | _BoundedIntProtected
  | FloatTextProtected
  | ControllerProtected
  | ColorPickerProtected
  | _StringProtected
  | _MediaProtected
  | BoxProtected
  | CheckboxProtected
  | OutputProtected
  | _IntProtected
  | BoundedFloatTextProtected
  | AxisProtected
  | SelectMultipleProtected
  | HTMLProtected
  | CoreWidgetProtected
  | ToggleButtonsStyleProtected
  | _IntRangeProtected
  | SliderStyleProtected
  | FloatProgressProtected
  | TextProtected
  | IntSliderProtected
  | AudioProtected
  | DescriptionStyleProtected
  | _FloatProtected
  | PlayProtected
  | VBoxProtected
  | ButtonStyleProtected
  | ImageProtected
  | PasswordProtected
  | FileUploadProtected
  | BoundedIntTextProtected
  | DOMWidgetProtected
  | FloatSliderProtected
  | ToggleButtonProtected
  | ComboboxProtected
  | HBoxProtected
  | HTMLMathProtected
  | _BoundedFloatProtected
  | _FloatRangeProtected
  | ButtonProtected
  | _MultipleSelectionProtected
  | StyleProtected
  | IntTextProtected
  | LabelProtected
  | VideoProtected
  | DescriptionWidgetProtected
  | ProgressStyleProtected
  | WidgetProtected
  | _BoundedFloatRangeProtected
  | _BoundedIntRangeProtected;

/**
 * The public API for GridBox
 */
export interface GridBoxPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Use a predefined styling for the box.
   */
  box_style: 'success' | 'info' | 'warning' | 'danger' | '';
  /**
   * List of widget children
   */
  children: unknown[];
}
/**
 * The public API for _BoundedLogFloat
 */
export interface _BoundedLogFloatPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string | null;
  /**
   * Base of value
   */
  base: number;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Max value for the exponent
   */
  max: number;
  /**
   * Min value for the exponent
   */
  min: number;
  /**
   * Float value
   */
  value: number;
}
/**
 * The public API for TwoByTwoLayout
 */
export interface TwoByTwoLayoutPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Use a predefined styling for the box.
   */
  box_style: 'success' | 'info' | 'warning' | 'danger' | '';
  /**
   * List of widget children
   */
  children: unknown[];
}
/**
 * The public API for _Bool
 */
export interface _BoolPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string | null;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable user changes.
   */
  disabled: boolean;
  /**
   * Bool value
   */
  value: boolean;
}
/**
 * The public API for AppLayout
 */
export interface AppLayoutPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Use a predefined styling for the box.
   */
  box_style: 'success' | 'info' | 'warning' | 'danger' | '';
  /**
   * List of widget children
   */
  children: unknown[];
}
/**
 * The public API for Accordion
 */
export interface AccordionPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  /**
   * Titles of the pages
   */
  _titles: {
    [k: string]: unknown;
  };
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Use a predefined styling for the box.
   */
  box_style: 'success' | 'info' | 'warning' | 'danger' | '';
  /**
   * List of widget children
   */
  children: unknown[];
  selected_index: number | null;
}
/**
 * The public API for Valid
 */
export interface ValidPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable user changes.
   */
  disabled: boolean;
  /**
   * Message displayed when the value is False
   */
  readout: string;
  /**
   * Bool value
   */
  value: boolean;
}
/**
 * The public API for IntProgress
 */
export interface IntProgressPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Use a predefined styling for the progess bar.
   */
  bar_style: 'success' | 'info' | 'warning' | 'danger' | '';
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Max value
   */
  max: number;
  /**
   * Min value
   */
  min: number;
  /**
   * Vertical or horizontal.
   */
  orientation: 'horizontal' | 'vertical';
  /**
   * Int value
   */
  value: number;
}
/**
 * The public API for FloatRangeSlider
 */
export interface FloatRangeSliderPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Update the value of the widget as the user is sliding the slider.
   */
  continuous_update: boolean;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable user changes
   */
  disabled: boolean;
  /**
   * Max value
   */
  max: number;
  /**
   * Min value
   */
  min: number;
  /**
   * Vertical or horizontal.
   */
  orientation: 'horizontal' | 'vertical';
  /**
   * Display the current value of the slider next to it.
   */
  readout: boolean;
  /**
   * Minimum step to increment the value
   */
  step: number;
  /**
   * Tuple of (lower, upper) bounds
   */
  value: {
    [k: string]: unknown;
  }[];
}
/**
 * The public API for FloatLogSlider
 */
export interface FloatLogSliderPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Base for the logarithm
   */
  base: number;
  /**
   * Update the value of the widget as the user is holding the slider.
   */
  continuous_update: boolean;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable user changes
   */
  disabled: boolean;
  /**
   * Max value for the exponent
   */
  max: number;
  /**
   * Min value for the exponent
   */
  min: number;
  /**
   * Vertical or horizontal.
   */
  orientation: 'horizontal' | 'vertical';
  /**
   * Display the current value of the slider next to it.
   */
  readout: boolean;
  /**
   * Minimum step in the exponent to increment the value
   */
  step: number;
  /**
   * Float value
   */
  value: number;
}
/**
 * The public API for Layout
 */
export interface LayoutPublic {
  /**
   * The namespace for the model.
   */
  _model_module: string;
  /**
   * A semver requirement for namespace version containing the model.
   */
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  align_content:
    | (
        | 'flex-start'
        | 'flex-end'
        | 'center'
        | 'space-between'
        | 'space-around'
        | 'space-evenly'
        | 'stretch'
        | 'inherit'
        | 'initial'
        | 'unset'
      )
    | null;
  align_items:
    | (
        | 'flex-start'
        | 'flex-end'
        | 'center'
        | 'baseline'
        | 'stretch'
        | 'inherit'
        | 'initial'
        | 'unset'
      )
    | null;
  align_self:
    | (
        | 'auto'
        | 'flex-start'
        | 'flex-end'
        | 'center'
        | 'baseline'
        | 'stretch'
        | 'inherit'
        | 'initial'
        | 'unset'
      )
    | null;
  border: string | null;
  bottom: string | null;
  display: string | null;
  flex: string | null;
  flex_flow: string | null;
  grid_area: string | null;
  grid_auto_columns: string | null;
  grid_auto_flow:
    | (
        | 'column'
        | 'row'
        | 'row dense'
        | 'column dense'
        | 'inherit'
        | 'initial'
        | 'unset'
      )
    | null;
  grid_auto_rows: string | null;
  grid_column: string | null;
  grid_gap: string | null;
  grid_row: string | null;
  grid_template_areas: string | null;
  grid_template_columns: string | null;
  grid_template_rows: string | null;
  height: string | null;
  justify_content:
    | (
        | 'flex-start'
        | 'flex-end'
        | 'center'
        | 'space-between'
        | 'space-around'
        | 'inherit'
        | 'initial'
        | 'unset'
      )
    | null;
  justify_items:
    | ('flex-start' | 'flex-end' | 'center' | 'inherit' | 'initial' | 'unset')
    | null;
  left: string | null;
  margin: string | null;
  max_height: string | null;
  max_width: string | null;
  min_height: string | null;
  min_width: string | null;
  object_fit: ('contain' | 'cover' | 'fill' | 'scale-down' | 'none') | null;
  object_position: string | null;
  order: string | null;
  overflow: string | null;
  overflow_x:
    | ('visible' | 'hidden' | 'scroll' | 'auto' | 'inherit' | 'initial' | 'unset')
    | null;
  overflow_y:
    | ('visible' | 'hidden' | 'scroll' | 'auto' | 'inherit' | 'initial' | 'unset')
    | null;
  padding: string | null;
  right: string | null;
  top: string | null;
  visibility: ('visible' | 'hidden' | 'inherit' | 'initial' | 'unset') | null;
  width: string | null;
}
/**
 * The public API for Textarea
 */
export interface TextareaPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Update the value as the user types. If False, update on submission, e.g., pressing Enter or navigating away.
   */
  continuous_update: boolean;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable user changes
   */
  disabled: boolean;
  /**
   * Placeholder text to display when nothing has been typed
   */
  placeholder: string;
  rows: number | null;
  /**
   * String value
   */
  value: string;
}
/**
 * The public API for _SelectionContainer
 */
export interface _SelectionContainerPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  /**
   * Titles of the pages
   */
  _titles: {
    [k: string]: unknown;
  };
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Use a predefined styling for the box.
   */
  box_style: 'success' | 'info' | 'warning' | 'danger' | '';
  /**
   * List of widget children
   */
  children: unknown[];
  selected_index: number | null;
}
/**
 * The public API for Tab
 */
export interface TabPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  /**
   * Titles of the pages
   */
  _titles: {
    [k: string]: unknown;
  };
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Use a predefined styling for the box.
   */
  box_style: 'success' | 'info' | 'warning' | 'danger' | '';
  /**
   * List of widget children
   */
  children: unknown[];
  selected_index: number | null;
}
/**
 * The public API for IntRangeSlider
 */
export interface IntRangeSliderPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Update the value of the widget as the user is sliding the slider.
   */
  continuous_update: boolean;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable user changes
   */
  disabled: boolean;
  /**
   * Max value
   */
  max: number;
  /**
   * Min value
   */
  min: number;
  /**
   * Vertical or horizontal.
   */
  orientation: 'horizontal' | 'vertical';
  /**
   * Display the current value of the slider next to it.
   */
  readout: boolean;
  /**
   * Minimum step that the value can take
   */
  step: number;
  /**
   * Tuple of (lower, upper) bounds
   */
  value: {
    [k: string]: unknown;
  }[];
}
/**
 * The public API for _BoundedInt
 */
export interface _BoundedIntPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string | null;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Max value
   */
  max: number;
  /**
   * Min value
   */
  min: number;
  /**
   * Int value
   */
  value: number;
}
/**
 * The public API for FloatText
 */
export interface FloatTextPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Update the value as the user types. If False, update on submission, e.g., pressing Enter or navigating away.
   */
  continuous_update: boolean;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable user changes
   */
  disabled: boolean;
  step: number | null;
  /**
   * Float value
   */
  value: number;
}
/**
 * The public API for Controller
 */
export interface ControllerPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * The axes on the gamepad.
   */
  axes: unknown[];
  /**
   * The buttons on the gamepad.
   */
  buttons: unknown[];
  /**
   * Whether the gamepad is connected.
   */
  connected: boolean;
  /**
   * The id number of the controller.
   */
  index: number;
  /**
   * The name of the control mapping.
   */
  mapping: string;
  /**
   * The name of the controller.
   */
  name: string;
  /**
   * The last time the data from this gamepad was updated.
   */
  timestamp: number;
}
/**
 * The public API for ColorPicker
 */
export interface ColorPickerPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Display short version with just a color selector.
   */
  concise: boolean;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable user changes.
   */
  disabled: boolean;
  /**
   * The color value.
   */
  value: string;
}
/**
 * The public API for _String
 */
export interface _StringPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string | null;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Placeholder text to display when nothing has been typed
   */
  placeholder: string;
  /**
   * String value
   */
  value: string;
}
/**
 * The public API for _Media
 */
export interface _MediaPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string | null;
}
/**
 * The public API for Box
 */
export interface BoxPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Use a predefined styling for the box.
   */
  box_style: 'success' | 'info' | 'warning' | 'danger' | '';
  /**
   * List of widget children
   */
  children: unknown[];
}
/**
 * The public API for Checkbox
 */
export interface CheckboxPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable user changes.
   */
  disabled: boolean;
  /**
   * Indent the control to align with other controls with a description.
   */
  indent: boolean;
  /**
   * Bool value
   */
  value: boolean;
}
/**
 * The public API for Output
 */
export interface OutputPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Parent message id of messages to capture
   */
  msg_id: string;
  /**
   * The output messages synced from the frontend.
   */
  outputs: {
    [k: string]: unknown;
  }[];
}
/**
 * The public API for _Int
 */
export interface _IntPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string | null;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Int value
   */
  value: number;
}
/**
 * The public API for BoundedFloatText
 */
export interface BoundedFloatTextPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Update the value as the user types. If False, update on submission, e.g., pressing Enter or navigating away.
   */
  continuous_update: boolean;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable user changes
   */
  disabled: boolean;
  /**
   * Max value
   */
  max: number;
  /**
   * Min value
   */
  min: number;
  step: number | null;
  /**
   * Float value
   */
  value: number;
}
/**
 * The public API for Axis
 */
export interface AxisPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * The value of the axis.
   */
  value: number;
}
/**
 * The public API for SelectMultiple
 */
export interface SelectMultiplePublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  /**
   * The labels for the options.
   */
  _options_labels: string[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable user changes
   */
  disabled: boolean;
  /**
   * Selected indices
   */
  index: number[];
  /**
   * The number of rows to display.
   */
  rows: number;
}
/**
 * The public API for HTML
 */
export interface HTMLPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Placeholder text to display when nothing has been typed
   */
  placeholder: string;
  /**
   * String value
   */
  value: string;
}
/**
 * The public API for CoreWidget
 */
export interface CoreWidgetPublic {
  _model_module: string;
  _model_module_version: string;
  /**
   * Name of the model.
   */
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string | null;
}
/**
 * The public API for ToggleButtonsStyle
 */
export interface ToggleButtonsStylePublic {
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * The width of each button.
   */
  button_width: string;
  /**
   * Width of the description to the side of the control.
   */
  description_width: string;
  /**
   * Text font weight of each button.
   */
  font_weight: string;
}
/**
 * The public API for _IntRange
 */
export interface _IntRangePublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string | null;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Tuple of (lower, upper) bounds
   */
  value: {
    [k: string]: unknown;
  }[];
}
/**
 * The public API for SliderStyle
 */
export interface SliderStylePublic {
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Width of the description to the side of the control.
   */
  description_width: string;
}
/**
 * The public API for FloatProgress
 */
export interface FloatProgressPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  bar_style: ('success' | 'info' | 'warning' | 'danger' | '') | null;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Max value
   */
  max: number;
  /**
   * Min value
   */
  min: number;
  /**
   * Vertical or horizontal.
   */
  orientation: 'horizontal' | 'vertical';
  /**
   * Float value
   */
  value: number;
}
/**
 * The public API for Text
 */
export interface TextPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Update the value as the user types. If False, update on submission, e.g., pressing Enter or navigating away.
   */
  continuous_update: boolean;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable user changes
   */
  disabled: boolean;
  /**
   * Placeholder text to display when nothing has been typed
   */
  placeholder: string;
  /**
   * String value
   */
  value: string;
}
/**
 * The public API for IntSlider
 */
export interface IntSliderPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Update the value of the widget as the user is holding the slider.
   */
  continuous_update: boolean;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable user changes
   */
  disabled: boolean;
  /**
   * Max value
   */
  max: number;
  /**
   * Min value
   */
  min: number;
  /**
   * Vertical or horizontal.
   */
  orientation: 'horizontal' | 'vertical';
  /**
   * Display the current value of the slider next to it.
   */
  readout: boolean;
  /**
   * Minimum step to increment the value
   */
  step: number;
  /**
   * Int value
   */
  value: number;
}
/**
 * The public API for Audio
 */
export interface AudioPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * When true, the audio starts when it's displayed
   */
  autoplay: boolean;
  /**
   * Specifies that audio controls should be displayed (such as a play/pause button etc)
   */
  controls: boolean;
  /**
   * The format of the audio.
   */
  format: string;
  /**
   * When true, the audio will start from the beginning after finishing
   */
  loop: boolean;
}
/**
 * The public API for DescriptionStyle
 */
export interface DescriptionStylePublic {
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Width of the description to the side of the control.
   */
  description_width: string;
}
/**
 * The public API for _Float
 */
export interface _FloatPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string | null;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Float value
   */
  value: number;
}
/**
 * The public API for Play
 */
export interface PlayPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  /**
   * Whether the control is currently playing.
   */
  _playing: boolean;
  /**
   * Whether the control will repeat in a continous loop.
   */
  _repeat: boolean;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable user changes
   */
  disabled: boolean;
  /**
   * The maximum value for the play control.
   */
  interval: number;
  /**
   * Max value
   */
  max: number;
  /**
   * Min value
   */
  min: number;
  /**
   * Show the repeat toggle button in the widget.
   */
  show_repeat: boolean;
  /**
   * Increment step
   */
  step: number;
  /**
   * Int value
   */
  value: number;
}
/**
 * The public API for VBox
 */
export interface VBoxPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Use a predefined styling for the box.
   */
  box_style: 'success' | 'info' | 'warning' | 'danger' | '';
  /**
   * List of widget children
   */
  children: unknown[];
}
/**
 * The public API for ButtonStyle
 */
export interface ButtonStylePublic {
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Button text font weight.
   */
  font_weight: string;
}
/**
 * The public API for Image
 */
export interface ImagePublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * The format of the image.
   */
  format: string;
  /**
   * Height of the image in pixels. Use layout.height for styling the widget.
   */
  height: string;
  /**
   * Width of the image in pixels. Use layout.width for styling the widget.
   */
  width: string;
}
/**
 * The public API for Password
 */
export interface PasswordPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Update the value as the user types. If False, update on submission, e.g., pressing Enter or navigating away.
   */
  continuous_update: boolean;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable user changes
   */
  disabled: boolean;
  /**
   * Placeholder text to display when nothing has been typed
   */
  placeholder: string;
  /**
   * String value
   */
  value: string;
}
/**
 * The public API for FileUpload
 */
export interface FileUploadPublic {
  _counter: number;
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * File types to accept, empty string for all
   */
  accept: string;
  /**
   * Use a predefined styling for the button.
   */
  button_style: 'primary' | 'success' | 'info' | 'warning' | 'danger' | '';
  /**
   * List of file content (bytes)
   */
  data: {
    [k: string]: unknown;
  }[];
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable button
   */
  disabled: boolean;
  /**
   * Error message
   */
  error: string;
  /**
   * Font-awesome icon name, without the 'fa-' prefix.
   */
  icon: string;
  /**
   * List of file metadata
   */
  metadata: {
    [k: string]: unknown;
  }[];
  /**
   * If True, allow for multiple files upload
   */
  multiple: boolean;
}
/**
 * The public API for BoundedIntText
 */
export interface BoundedIntTextPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Update the value as the user types. If False, update on submission, e.g., pressing Enter or navigating away.
   */
  continuous_update: boolean;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable user changes
   */
  disabled: boolean;
  /**
   * Max value
   */
  max: number;
  /**
   * Min value
   */
  min: number;
  /**
   * Minimum step to increment the value
   */
  step: number;
  /**
   * Int value
   */
  value: number;
}
/**
 * The public API for DOMWidget
 */
export interface DOMWidgetPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  /**
   * The namespace for the model.
   */
  _model_module: string;
  /**
   * A semver requirement for namespace version containing the model.
   */
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string | null;
  /**
   * A semver requirement for the namespace version containing the view.
   */
  _view_module_version: string;
  _view_name: string | null;
}
/**
 * The public API for FloatSlider
 */
export interface FloatSliderPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Update the value of the widget as the user is holding the slider.
   */
  continuous_update: boolean;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable user changes
   */
  disabled: boolean;
  /**
   * Max value
   */
  max: number;
  /**
   * Min value
   */
  min: number;
  /**
   * Vertical or horizontal.
   */
  orientation: 'horizontal' | 'vertical';
  /**
   * Display the current value of the slider next to it.
   */
  readout: boolean;
  /**
   * Minimum step to increment the value
   */
  step: number;
  /**
   * Float value
   */
  value: number;
}
/**
 * The public API for ToggleButton
 */
export interface ToggleButtonPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Use a predefined styling for the button.
   */
  button_style: 'primary' | 'success' | 'info' | 'warning' | 'danger' | '';
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable user changes.
   */
  disabled: boolean;
  /**
   * Font-awesome icon.
   */
  icon: string;
  /**
   * Tooltip caption of the toggle button.
   */
  tooltip: string;
  /**
   * Bool value
   */
  value: boolean;
}
/**
 * The public API for Combobox
 */
export interface ComboboxPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Update the value as the user types. If False, update on submission, e.g., pressing Enter or navigating away.
   */
  continuous_update: boolean;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable user changes
   */
  disabled: boolean;
  /**
   * If set, ensure value is in options. Implies continuous_update=False.
   */
  ensure_option: boolean;
  /**
   * Dropdown options for the combobox
   */
  options: string[];
  /**
   * Placeholder text to display when nothing has been typed
   */
  placeholder: string;
  /**
   * String value
   */
  value: string;
}
/**
 * The public API for HBox
 */
export interface HBoxPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Use a predefined styling for the box.
   */
  box_style: 'success' | 'info' | 'warning' | 'danger' | '';
  /**
   * List of widget children
   */
  children: unknown[];
}
/**
 * The public API for HTMLMath
 */
export interface HTMLMathPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Placeholder text to display when nothing has been typed
   */
  placeholder: string;
  /**
   * String value
   */
  value: string;
}
/**
 * The public API for _BoundedFloat
 */
export interface _BoundedFloatPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string | null;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Max value
   */
  max: number;
  /**
   * Min value
   */
  min: number;
  /**
   * Float value
   */
  value: number;
}
/**
 * The public API for _FloatRange
 */
export interface _FloatRangePublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string | null;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Tuple of (lower, upper) bounds
   */
  value: {
    [k: string]: unknown;
  }[];
}
/**
 * The public API for Button
 */
export interface ButtonPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Use a predefined styling for the button.
   */
  button_style: 'primary' | 'success' | 'info' | 'warning' | 'danger' | '';
  /**
   * Button label.
   */
  description: string;
  /**
   * Enable or disable user changes.
   */
  disabled: boolean;
  /**
   * Font-awesome icon name, without the 'fa-' prefix.
   */
  icon: string;
  /**
   * Tooltip caption of the button.
   */
  tooltip: string;
}
/**
 * The public API for _MultipleSelection
 */
export interface _MultipleSelectionPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  /**
   * The labels for the options.
   */
  _options_labels: string[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string | null;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable user changes
   */
  disabled: boolean;
  /**
   * Selected indices
   */
  index: number[];
}
/**
 * The public API for Style
 */
export interface StylePublic {
  /**
   * The namespace for the model.
   */
  _model_module: string;
  /**
   * A semver requirement for namespace version containing the model.
   */
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
}
/**
 * The public API for IntText
 */
export interface IntTextPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Update the value as the user types. If False, update on submission, e.g., pressing Enter or navigating away.
   */
  continuous_update: boolean;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable user changes
   */
  disabled: boolean;
  /**
   * Minimum step to increment the value
   */
  step: number;
  /**
   * Int value
   */
  value: number;
}
/**
 * The public API for Label
 */
export interface LabelPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Placeholder text to display when nothing has been typed
   */
  placeholder: string;
  /**
   * String value
   */
  value: string;
}
/**
 * The public API for Video
 */
export interface VideoPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * When true, the video starts when it's displayed
   */
  autoplay: boolean;
  /**
   * Specifies that video controls should be displayed (such as a play/pause button etc)
   */
  controls: boolean;
  /**
   * The format of the video.
   */
  format: string;
  /**
   * Height of the video in pixels.
   */
  height: string;
  /**
   * When true, the video will start from the beginning after finishing
   */
  loop: boolean;
  /**
   * Width of the video in pixels.
   */
  width: string;
}
/**
 * The public API for DescriptionWidget
 */
export interface DescriptionWidgetPublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string | null;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
}
/**
 * The public API for ProgressStyle
 */
export interface ProgressStylePublic {
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Width of the description to the side of the control.
   */
  description_width: string;
}
/**
 * The public API for Widget
 */
export interface WidgetPublic {
  /**
   * The namespace for the model.
   */
  _model_module: string;
  /**
   * A semver requirement for namespace version containing the model.
   */
  _model_module_version: string;
  /**
   * Name of the model.
   */
  _model_name: string;
  _view_count: number | null;
  _view_module: string | null;
  /**
   * A semver requirement for the namespace version containing the view.
   */
  _view_module_version: string;
  _view_name: string | null;
}
/**
 * The public API for _BoundedFloatRange
 */
export interface _BoundedFloatRangePublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string | null;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Max value
   */
  max: number;
  /**
   * Min value
   */
  min: number;
  /**
   * Minimum step that the value can take (ignored by some views)
   */
  step: number;
  /**
   * Tuple of (lower, upper) bounds
   */
  value: {
    [k: string]: unknown;
  }[];
}
/**
 * The public API for _BoundedIntRange
 */
export interface _BoundedIntRangePublic {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string | null;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Max value
   */
  max: number;
  /**
   * Min value
   */
  min: number;
  /**
   * Tuple of (lower, upper) bounds
   */
  value: {
    [k: string]: unknown;
  }[];
}
/**
 * The protected API for GridBox
 */
export interface GridBoxProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Use a predefined styling for the box.
   */
  box_style: 'success' | 'info' | 'warning' | 'danger' | '';
  /**
   * List of widget children
   */
  children: unknown[];
}
/**
 * The protected API for _BoundedLogFloat
 */
export interface _BoundedLogFloatProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string | null;
  /**
   * Base of value
   */
  base: number;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Max value for the exponent
   */
  max: number;
  /**
   * Min value for the exponent
   */
  min: number;
  /**
   * Float value
   */
  value: number;
}
/**
 * The protected API for TwoByTwoLayout
 */
export interface TwoByTwoLayoutProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  align_items:
    | ('top' | 'bottom' | 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch')
    | null;
  /**
   * Use a predefined styling for the box.
   */
  box_style: 'success' | 'info' | 'warning' | 'danger' | '';
  /**
   * List of widget children
   */
  children: unknown[];
  grid_gap: string | null;
  height: string | null;
  justify_content:
    | ('flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around')
    | null;
  merge: boolean;
  width: string | null;
}
/**
 * The protected API for _Bool
 */
export interface _BoolProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string | null;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable user changes.
   */
  disabled: boolean;
  /**
   * Bool value
   */
  value: boolean;
}
/**
 * The protected API for AppLayout
 */
export interface AppLayoutProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  align_items:
    | ('top' | 'bottom' | 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch')
    | null;
  /**
   * Use a predefined styling for the box.
   */
  box_style: 'success' | 'info' | 'warning' | 'danger' | '';
  /**
   * List of widget children
   */
  children: unknown[];
  grid_gap: string | null;
  height: string | null;
  justify_content:
    | ('flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around')
    | null;
  merge: boolean;
  pane_heights: {
    [k: string]: unknown;
  }[];
  pane_widths: {
    [k: string]: unknown;
  }[];
  width: string | null;
}
/**
 * The protected API for Accordion
 */
export interface AccordionProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  /**
   * Titles of the pages
   */
  _titles: {
    [k: string]: unknown;
  };
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Use a predefined styling for the box.
   */
  box_style: 'success' | 'info' | 'warning' | 'danger' | '';
  /**
   * List of widget children
   */
  children: unknown[];
  selected_index: number | null;
}
/**
 * The protected API for Valid
 */
export interface ValidProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable user changes.
   */
  disabled: boolean;
  /**
   * Message displayed when the value is False
   */
  readout: string;
  /**
   * Bool value
   */
  value: boolean;
}
/**
 * The protected API for IntProgress
 */
export interface IntProgressProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Use a predefined styling for the progess bar.
   */
  bar_style: 'success' | 'info' | 'warning' | 'danger' | '';
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Max value
   */
  max: number;
  /**
   * Min value
   */
  min: number;
  /**
   * Vertical or horizontal.
   */
  orientation: 'horizontal' | 'vertical';
  /**
   * Int value
   */
  value: number;
}
/**
 * The protected API for FloatRangeSlider
 */
export interface FloatRangeSliderProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Update the value of the widget as the user is sliding the slider.
   */
  continuous_update: boolean;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable user changes
   */
  disabled: boolean;
  /**
   * Max value
   */
  max: number;
  /**
   * Min value
   */
  min: number;
  /**
   * Vertical or horizontal.
   */
  orientation: 'horizontal' | 'vertical';
  /**
   * Display the current value of the slider next to it.
   */
  readout: boolean;
  /**
   * Minimum step to increment the value
   */
  step: number;
  /**
   * Tuple of (lower, upper) bounds
   */
  value: {
    [k: string]: unknown;
  }[];
}
/**
 * The protected API for FloatLogSlider
 */
export interface FloatLogSliderProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Base for the logarithm
   */
  base: number;
  /**
   * Update the value of the widget as the user is holding the slider.
   */
  continuous_update: boolean;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable user changes
   */
  disabled: boolean;
  /**
   * Max value for the exponent
   */
  max: number;
  /**
   * Min value for the exponent
   */
  min: number;
  /**
   * Vertical or horizontal.
   */
  orientation: 'horizontal' | 'vertical';
  /**
   * Display the current value of the slider next to it.
   */
  readout: boolean;
  /**
   * Minimum step in the exponent to increment the value
   */
  step: number;
  /**
   * Float value
   */
  value: number;
}
/**
 * The protected API for Layout
 */
export interface LayoutProtected {
  /**
   * The namespace for the model.
   */
  _model_module: string;
  /**
   * A semver requirement for namespace version containing the model.
   */
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  align_content:
    | (
        | 'flex-start'
        | 'flex-end'
        | 'center'
        | 'space-between'
        | 'space-around'
        | 'space-evenly'
        | 'stretch'
        | 'inherit'
        | 'initial'
        | 'unset'
      )
    | null;
  align_items:
    | (
        | 'flex-start'
        | 'flex-end'
        | 'center'
        | 'baseline'
        | 'stretch'
        | 'inherit'
        | 'initial'
        | 'unset'
      )
    | null;
  align_self:
    | (
        | 'auto'
        | 'flex-start'
        | 'flex-end'
        | 'center'
        | 'baseline'
        | 'stretch'
        | 'inherit'
        | 'initial'
        | 'unset'
      )
    | null;
  border: string | null;
  bottom: string | null;
  display: string | null;
  flex: string | null;
  flex_flow: string | null;
  grid_area: string | null;
  grid_auto_columns: string | null;
  grid_auto_flow:
    | (
        | 'column'
        | 'row'
        | 'row dense'
        | 'column dense'
        | 'inherit'
        | 'initial'
        | 'unset'
      )
    | null;
  grid_auto_rows: string | null;
  grid_column: string | null;
  grid_gap: string | null;
  grid_row: string | null;
  grid_template_areas: string | null;
  grid_template_columns: string | null;
  grid_template_rows: string | null;
  height: string | null;
  justify_content:
    | (
        | 'flex-start'
        | 'flex-end'
        | 'center'
        | 'space-between'
        | 'space-around'
        | 'inherit'
        | 'initial'
        | 'unset'
      )
    | null;
  justify_items:
    | ('flex-start' | 'flex-end' | 'center' | 'inherit' | 'initial' | 'unset')
    | null;
  left: string | null;
  margin: string | null;
  max_height: string | null;
  max_width: string | null;
  min_height: string | null;
  min_width: string | null;
  object_fit: ('contain' | 'cover' | 'fill' | 'scale-down' | 'none') | null;
  object_position: string | null;
  order: string | null;
  overflow: string | null;
  overflow_x:
    | ('visible' | 'hidden' | 'scroll' | 'auto' | 'inherit' | 'initial' | 'unset')
    | null;
  overflow_y:
    | ('visible' | 'hidden' | 'scroll' | 'auto' | 'inherit' | 'initial' | 'unset')
    | null;
  padding: string | null;
  right: string | null;
  top: string | null;
  visibility: ('visible' | 'hidden' | 'inherit' | 'initial' | 'unset') | null;
  width: string | null;
}
/**
 * The protected API for Textarea
 */
export interface TextareaProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Update the value as the user types. If False, update on submission, e.g., pressing Enter or navigating away.
   */
  continuous_update: boolean;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable user changes
   */
  disabled: boolean;
  /**
   * Placeholder text to display when nothing has been typed
   */
  placeholder: string;
  rows: number | null;
  /**
   * String value
   */
  value: string;
}
/**
 * The protected API for _SelectionContainer
 */
export interface _SelectionContainerProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  /**
   * Titles of the pages
   */
  _titles: {
    [k: string]: unknown;
  };
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Use a predefined styling for the box.
   */
  box_style: 'success' | 'info' | 'warning' | 'danger' | '';
  /**
   * List of widget children
   */
  children: unknown[];
  selected_index: number | null;
}
/**
 * The protected API for Tab
 */
export interface TabProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  /**
   * Titles of the pages
   */
  _titles: {
    [k: string]: unknown;
  };
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Use a predefined styling for the box.
   */
  box_style: 'success' | 'info' | 'warning' | 'danger' | '';
  /**
   * List of widget children
   */
  children: unknown[];
  selected_index: number | null;
}
/**
 * The protected API for IntRangeSlider
 */
export interface IntRangeSliderProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Update the value of the widget as the user is sliding the slider.
   */
  continuous_update: boolean;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable user changes
   */
  disabled: boolean;
  /**
   * Max value
   */
  max: number;
  /**
   * Min value
   */
  min: number;
  /**
   * Vertical or horizontal.
   */
  orientation: 'horizontal' | 'vertical';
  /**
   * Display the current value of the slider next to it.
   */
  readout: boolean;
  /**
   * Minimum step that the value can take
   */
  step: number;
  /**
   * Tuple of (lower, upper) bounds
   */
  value: {
    [k: string]: unknown;
  }[];
}
/**
 * The protected API for _BoundedInt
 */
export interface _BoundedIntProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string | null;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Max value
   */
  max: number;
  /**
   * Min value
   */
  min: number;
  /**
   * Int value
   */
  value: number;
}
/**
 * The protected API for FloatText
 */
export interface FloatTextProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Update the value as the user types. If False, update on submission, e.g., pressing Enter or navigating away.
   */
  continuous_update: boolean;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable user changes
   */
  disabled: boolean;
  step: number | null;
  /**
   * Float value
   */
  value: number;
}
/**
 * The protected API for Controller
 */
export interface ControllerProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * The axes on the gamepad.
   */
  axes: unknown[];
  /**
   * The buttons on the gamepad.
   */
  buttons: unknown[];
  /**
   * Whether the gamepad is connected.
   */
  connected: boolean;
  /**
   * The id number of the controller.
   */
  index: number;
  /**
   * The name of the control mapping.
   */
  mapping: string;
  /**
   * The name of the controller.
   */
  name: string;
  /**
   * The last time the data from this gamepad was updated.
   */
  timestamp: number;
}
/**
 * The protected API for ColorPicker
 */
export interface ColorPickerProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Display short version with just a color selector.
   */
  concise: boolean;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable user changes.
   */
  disabled: boolean;
  /**
   * The color value.
   */
  value: string;
}
/**
 * The protected API for _String
 */
export interface _StringProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string | null;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Placeholder text to display when nothing has been typed
   */
  placeholder: string;
  /**
   * String value
   */
  value: string;
}
/**
 * The protected API for _Media
 */
export interface _MediaProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string | null;
}
/**
 * The protected API for Box
 */
export interface BoxProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Use a predefined styling for the box.
   */
  box_style: 'success' | 'info' | 'warning' | 'danger' | '';
  /**
   * List of widget children
   */
  children: unknown[];
}
/**
 * The protected API for Checkbox
 */
export interface CheckboxProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable user changes.
   */
  disabled: boolean;
  /**
   * Indent the control to align with other controls with a description.
   */
  indent: boolean;
  /**
   * Bool value
   */
  value: boolean;
}
/**
 * The protected API for Output
 */
export interface OutputProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Parent message id of messages to capture
   */
  msg_id: string;
  /**
   * The output messages synced from the frontend.
   */
  outputs: {
    [k: string]: unknown;
  }[];
}
/**
 * The protected API for _Int
 */
export interface _IntProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string | null;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Int value
   */
  value: number;
}
/**
 * The protected API for BoundedFloatText
 */
export interface BoundedFloatTextProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Update the value as the user types. If False, update on submission, e.g., pressing Enter or navigating away.
   */
  continuous_update: boolean;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable user changes
   */
  disabled: boolean;
  /**
   * Max value
   */
  max: number;
  /**
   * Min value
   */
  min: number;
  step: number | null;
  /**
   * Float value
   */
  value: number;
}
/**
 * The protected API for Axis
 */
export interface AxisProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * The value of the axis.
   */
  value: number;
}
/**
 * The protected API for SelectMultiple
 */
export interface SelectMultipleProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  /**
   * The labels for the options.
   */
  _options_labels: string[];
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable user changes
   */
  disabled: boolean;
  /**
   * Selected indices
   */
  index: number[];
  /**
   * Selected labels
   */
  label: string[];
  options: {
    [k: string]: unknown;
  } | null;
  /**
   * The number of rows to display.
   */
  rows: number;
  /**
   * Selected values
   */
  value: unknown[];
}
/**
 * The protected API for HTML
 */
export interface HTMLProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Placeholder text to display when nothing has been typed
   */
  placeholder: string;
  /**
   * String value
   */
  value: string;
}
/**
 * The protected API for CoreWidget
 */
export interface CoreWidgetProtected {
  _model_module: string;
  _model_module_version: string;
  /**
   * Name of the model.
   */
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string | null;
}
/**
 * The protected API for ToggleButtonsStyle
 */
export interface ToggleButtonsStyleProtected {
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * The width of each button.
   */
  button_width: string;
  /**
   * Width of the description to the side of the control.
   */
  description_width: string;
  /**
   * Text font weight of each button.
   */
  font_weight: string;
}
/**
 * The protected API for _IntRange
 */
export interface _IntRangeProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string | null;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Tuple of (lower, upper) bounds
   */
  value: {
    [k: string]: unknown;
  }[];
}
/**
 * The protected API for SliderStyle
 */
export interface SliderStyleProtected {
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Width of the description to the side of the control.
   */
  description_width: string;
}
/**
 * The protected API for FloatProgress
 */
export interface FloatProgressProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  bar_style: ('success' | 'info' | 'warning' | 'danger' | '') | null;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Max value
   */
  max: number;
  /**
   * Min value
   */
  min: number;
  /**
   * Vertical or horizontal.
   */
  orientation: 'horizontal' | 'vertical';
  /**
   * Float value
   */
  value: number;
}
/**
 * The protected API for Text
 */
export interface TextProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Update the value as the user types. If False, update on submission, e.g., pressing Enter or navigating away.
   */
  continuous_update: boolean;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable user changes
   */
  disabled: boolean;
  /**
   * Placeholder text to display when nothing has been typed
   */
  placeholder: string;
  /**
   * String value
   */
  value: string;
}
/**
 * The protected API for IntSlider
 */
export interface IntSliderProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Update the value of the widget as the user is holding the slider.
   */
  continuous_update: boolean;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable user changes
   */
  disabled: boolean;
  /**
   * Max value
   */
  max: number;
  /**
   * Min value
   */
  min: number;
  /**
   * Vertical or horizontal.
   */
  orientation: 'horizontal' | 'vertical';
  /**
   * Display the current value of the slider next to it.
   */
  readout: boolean;
  /**
   * Minimum step to increment the value
   */
  step: number;
  /**
   * Int value
   */
  value: number;
}
/**
 * The protected API for Audio
 */
export interface AudioProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * When true, the audio starts when it's displayed
   */
  autoplay: boolean;
  /**
   * Specifies that audio controls should be displayed (such as a play/pause button etc)
   */
  controls: boolean;
  /**
   * The format of the audio.
   */
  format: string;
  /**
   * When true, the audio will start from the beginning after finishing
   */
  loop: boolean;
}
/**
 * The protected API for DescriptionStyle
 */
export interface DescriptionStyleProtected {
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Width of the description to the side of the control.
   */
  description_width: string;
}
/**
 * The protected API for _Float
 */
export interface _FloatProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string | null;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Float value
   */
  value: number;
}
/**
 * The protected API for Play
 */
export interface PlayProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  /**
   * Whether the control is currently playing.
   */
  _playing: boolean;
  /**
   * Whether the control will repeat in a continous loop.
   */
  _repeat: boolean;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable user changes
   */
  disabled: boolean;
  /**
   * The maximum value for the play control.
   */
  interval: number;
  /**
   * Max value
   */
  max: number;
  /**
   * Min value
   */
  min: number;
  /**
   * Show the repeat toggle button in the widget.
   */
  show_repeat: boolean;
  /**
   * Increment step
   */
  step: number;
  /**
   * Int value
   */
  value: number;
}
/**
 * The protected API for VBox
 */
export interface VBoxProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Use a predefined styling for the box.
   */
  box_style: 'success' | 'info' | 'warning' | 'danger' | '';
  /**
   * List of widget children
   */
  children: unknown[];
}
/**
 * The protected API for ButtonStyle
 */
export interface ButtonStyleProtected {
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Button text font weight.
   */
  font_weight: string;
}
/**
 * The protected API for Image
 */
export interface ImageProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * The format of the image.
   */
  format: string;
  /**
   * Height of the image in pixels. Use layout.height for styling the widget.
   */
  height: string;
  /**
   * Width of the image in pixels. Use layout.width for styling the widget.
   */
  width: string;
}
/**
 * The protected API for Password
 */
export interface PasswordProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Update the value as the user types. If False, update on submission, e.g., pressing Enter or navigating away.
   */
  continuous_update: boolean;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable user changes
   */
  disabled: boolean;
  /**
   * Placeholder text to display when nothing has been typed
   */
  placeholder: string;
  /**
   * String value
   */
  value: string;
}
/**
 * The protected API for FileUpload
 */
export interface FileUploadProtected {
  _counter: number;
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * File types to accept, empty string for all
   */
  accept: string;
  /**
   * Use a predefined styling for the button.
   */
  button_style: 'primary' | 'success' | 'info' | 'warning' | 'danger' | '';
  /**
   * List of file content (bytes)
   */
  data: {
    [k: string]: unknown;
  }[];
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable button
   */
  disabled: boolean;
  /**
   * Error message
   */
  error: string;
  /**
   * Font-awesome icon name, without the 'fa-' prefix.
   */
  icon: string;
  /**
   * List of file metadata
   */
  metadata: {
    [k: string]: unknown;
  }[];
  /**
   * If True, allow for multiple files upload
   */
  multiple: boolean;
  value: {
    [k: string]: unknown;
  };
}
/**
 * The protected API for BoundedIntText
 */
export interface BoundedIntTextProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Update the value as the user types. If False, update on submission, e.g., pressing Enter or navigating away.
   */
  continuous_update: boolean;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable user changes
   */
  disabled: boolean;
  /**
   * Max value
   */
  max: number;
  /**
   * Min value
   */
  min: number;
  /**
   * Minimum step to increment the value
   */
  step: number;
  /**
   * Int value
   */
  value: number;
}
/**
 * The protected API for DOMWidget
 */
export interface DOMWidgetProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  /**
   * The namespace for the model.
   */
  _model_module: string;
  /**
   * A semver requirement for namespace version containing the model.
   */
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string | null;
  /**
   * A semver requirement for the namespace version containing the view.
   */
  _view_module_version: string;
  _view_name: string | null;
}
/**
 * The protected API for FloatSlider
 */
export interface FloatSliderProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Update the value of the widget as the user is holding the slider.
   */
  continuous_update: boolean;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable user changes
   */
  disabled: boolean;
  /**
   * Max value
   */
  max: number;
  /**
   * Min value
   */
  min: number;
  /**
   * Vertical or horizontal.
   */
  orientation: 'horizontal' | 'vertical';
  /**
   * Display the current value of the slider next to it.
   */
  readout: boolean;
  /**
   * Minimum step to increment the value
   */
  step: number;
  /**
   * Float value
   */
  value: number;
}
/**
 * The protected API for ToggleButton
 */
export interface ToggleButtonProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Use a predefined styling for the button.
   */
  button_style: 'primary' | 'success' | 'info' | 'warning' | 'danger' | '';
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable user changes.
   */
  disabled: boolean;
  /**
   * Font-awesome icon.
   */
  icon: string;
  /**
   * Tooltip caption of the toggle button.
   */
  tooltip: string;
  /**
   * Bool value
   */
  value: boolean;
}
/**
 * The protected API for Combobox
 */
export interface ComboboxProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Update the value as the user types. If False, update on submission, e.g., pressing Enter or navigating away.
   */
  continuous_update: boolean;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable user changes
   */
  disabled: boolean;
  /**
   * If set, ensure value is in options. Implies continuous_update=False.
   */
  ensure_option: boolean;
  /**
   * Dropdown options for the combobox
   */
  options: string[];
  /**
   * Placeholder text to display when nothing has been typed
   */
  placeholder: string;
  /**
   * String value
   */
  value: string;
}
/**
 * The protected API for HBox
 */
export interface HBoxProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Use a predefined styling for the box.
   */
  box_style: 'success' | 'info' | 'warning' | 'danger' | '';
  /**
   * List of widget children
   */
  children: unknown[];
}
/**
 * The protected API for HTMLMath
 */
export interface HTMLMathProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Placeholder text to display when nothing has been typed
   */
  placeholder: string;
  /**
   * String value
   */
  value: string;
}
/**
 * The protected API for _BoundedFloat
 */
export interface _BoundedFloatProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string | null;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Max value
   */
  max: number;
  /**
   * Min value
   */
  min: number;
  /**
   * Float value
   */
  value: number;
}
/**
 * The protected API for _FloatRange
 */
export interface _FloatRangeProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string | null;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Tuple of (lower, upper) bounds
   */
  value: {
    [k: string]: unknown;
  }[];
}
/**
 * The protected API for Button
 */
export interface ButtonProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Use a predefined styling for the button.
   */
  button_style: 'primary' | 'success' | 'info' | 'warning' | 'danger' | '';
  /**
   * Button label.
   */
  description: string;
  /**
   * Enable or disable user changes.
   */
  disabled: boolean;
  /**
   * Font-awesome icon name, without the 'fa-' prefix.
   */
  icon: string;
  /**
   * Tooltip caption of the button.
   */
  tooltip: string;
}
/**
 * The protected API for _MultipleSelection
 */
export interface _MultipleSelectionProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  /**
   * The labels for the options.
   */
  _options_labels: string[];
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string | null;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable user changes
   */
  disabled: boolean;
  /**
   * Selected indices
   */
  index: number[];
  /**
   * Selected labels
   */
  label: string[];
  options: {
    [k: string]: unknown;
  } | null;
  /**
   * Selected values
   */
  value: unknown[];
}
/**
 * The protected API for Style
 */
export interface StyleProtected {
  /**
   * The namespace for the model.
   */
  _model_module: string;
  /**
   * A semver requirement for namespace version containing the model.
   */
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
}
/**
 * The protected API for IntText
 */
export interface IntTextProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Update the value as the user types. If False, update on submission, e.g., pressing Enter or navigating away.
   */
  continuous_update: boolean;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Enable or disable user changes
   */
  disabled: boolean;
  /**
   * Minimum step to increment the value
   */
  step: number;
  /**
   * Int value
   */
  value: number;
}
/**
 * The protected API for Label
 */
export interface LabelProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Placeholder text to display when nothing has been typed
   */
  placeholder: string;
  /**
   * String value
   */
  value: string;
}
/**
 * The protected API for Video
 */
export interface VideoProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * When true, the video starts when it's displayed
   */
  autoplay: boolean;
  /**
   * Specifies that video controls should be displayed (such as a play/pause button etc)
   */
  controls: boolean;
  /**
   * The format of the video.
   */
  format: string;
  /**
   * Height of the video in pixels.
   */
  height: string;
  /**
   * When true, the video will start from the beginning after finishing
   */
  loop: boolean;
  /**
   * Width of the video in pixels.
   */
  width: string;
}
/**
 * The protected API for DescriptionWidget
 */
export interface DescriptionWidgetProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string | null;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
}
/**
 * The protected API for ProgressStyle
 */
export interface ProgressStyleProtected {
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string;
  /**
   * Width of the description to the side of the control.
   */
  description_width: string;
}
/**
 * The protected API for Widget
 */
export interface WidgetProtected {
  /**
   * The namespace for the model.
   */
  _model_module: string;
  /**
   * A semver requirement for namespace version containing the model.
   */
  _model_module_version: string;
  /**
   * Name of the model.
   */
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string | null;
  /**
   * A semver requirement for the namespace version containing the view.
   */
  _view_module_version: string;
  _view_name: string | null;
}
/**
 * The protected API for _BoundedFloatRange
 */
export interface _BoundedFloatRangeProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string | null;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Max value
   */
  max: number;
  /**
   * Min value
   */
  min: number;
  /**
   * Minimum step that the value can take (ignored by some views)
   */
  step: number;
  /**
   * Tuple of (lower, upper) bounds
   */
  value: {
    [k: string]: unknown;
  }[];
}
/**
 * The protected API for _BoundedIntRange
 */
export interface _BoundedIntRangeProtected {
  /**
   * CSS classes applied to widget DOM element
   */
  _dom_classes: string[];
  _model_module: string;
  _model_module_version: string;
  _model_name: string;
  _states_to_send: {
    [k: string]: unknown;
  }[];
  _view_count: number | null;
  _view_module: string;
  _view_module_version: string;
  _view_name: string | null;
  /**
   * Description of the control.
   */
  description: string;
  description_tooltip: string | null;
  /**
   * Max value
   */
  max: number;
  /**
   * Min value
   */
  min: number;
  /**
   * Tuple of (lower, upper) bounds
   */
  value: {
    [k: string]: unknown;
  }[];
}
