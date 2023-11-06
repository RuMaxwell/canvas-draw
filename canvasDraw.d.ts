/** Drawing context, describing the drawable area. While drawing, it represents the area where the drawing component should be limited in typical conditions. It resembles the content area of CSS box model.
 * The content isn't impossible to exceed the area, such as absolutely positioned element or an element whose overflow property is visible. */
interface DrawInstance {
  /** Full canvas width. */
  canvasWidth: number;
  /** Full canvas height. */
  canvasHeight: number;
  /** Width of the drawable area. Typically, it is strictly limited that most of the component cannot grow wider than this width. */
  contentWidth: number;
  /** Height of the drawable area. Only fixed height components can limit the height of their contents. Otherwise, this height is determined by the height of its content. */
  contentHeight: number;
  /** The left margin of the drawable area (relative to the canvas). */
  x: number;
  /** The top margin of the drawable area (relative to the canvas). */
  y: number;
}

/** Configuration of text font. */
interface Font {
  color?: Color;
  size?: number;
  weight?: string;
}

/** Get a brand new drawable area from the width and the height of a canvas. */
declare function getDrawInstance(canvasWidth: number, canvasHeight: number): DrawInstance;

/** Measure a piece of text using a specific font. */
declare function measureTextWithFont(ctx: CanvasRenderingContext2D, text: string, font: Font): TextMetrics;

interface Provider {
}

interface ProviderConstructor {
  new(...arg: any[]): Provider;
}

declare function provide(component: CanvasComponent, providerConstructor: ProviderConstructor, ...args: any[]): void;

/** Base class of any component. */
class CanvasComponent {
  /** Width of all child content, including itself. (Count in overflow: visible, not count in absolutely positioned component.)
   * If none of its child components nor itself is assign a fixed width, then this value is undefined before measuring (invoking the `measure` method). */
  width?: number;
  /** Height of all child content, including itself. (Count in overflow: visible, not count in absolutely positioned component.)
   * If none of its child components nor itself is assign a fixed height, then this value is undefined before measuring (invoking the `measure` method). */
  height?: number;
  /** A self-defined name, used for debugging. */
  id?: string;

  /** Dependencies injected by the parent component. */
  providers: Record<string, ProviderConstructor>;

  /** An extra initialization process, invoked at the end of the invocation of the same method in the parent component.
   * Because of the evaluation order, child components are constructed before parent components, so this function can manage the states that are only properly initialized after the successful construction of a parent component.
   * The `init` method of the outmost component need to be called manually after the construction. */
  init(): void;

  /** Measure the width and the height of this component. */
  measure(di: DrawInstance, ctx: CanvasRenderingContext2D): void;
  /** Draw the component onto the canvas. */
  draw(di: DrawInstance, ctx: CanvasRenderingContext2D): void;

  /** Assign an id to this component and return the component itself. */
  ofId(id: string): CanvasComponent;
}

/** Component that has a single child. */
class SingleChildComponent extends CanvasComponent {
  child?: CanvasComponent;
}

/** Component that has multiple children. */
class MultiChildComponent extends CanvasComponent {
  children: CanvasComponent[];
}

/** Temporarily used anonymous component that can customize the `measure` and `draw` methods. It is recommended to construct this component directly inside the component tree for specific, one-time drawing.
 * If you need to reuse it frequently, consider create a new component class by extending the `CanvasComponent` class or one of its subclass. */
export class CustomComponent extends CanvasComponent {
  constructor(options: {
    measure: (di: DrawInstance, ctx: CanvasRenderingContext2D) => void;
    draw: (di: DrawInstance, ctx: CanvasRenderingContext2D) => void;
  });
  static new(options: {
    measure: (di: DrawInstance, ctx: CanvasRenderingContext2D) => void;
    draw: (di: DrawInstance, ctx: CanvasRenderingContext2D) => void;
  }): CustomComponent;
}

/** Temporarily used anonymous component that can customize the `measure` and `draw` methods and has a single child. It is recommended to construct this component directly inside the component tree for specific, one-time drawing.
 * If you need to reuse it frequently, consider create a new component class by extending the `CanvasComponent` class or one of its subclass. */
export class SingleChildCustomComponent extends CustomComponent {
  constructor(
    options: {
      measure: (di: DrawInstance, ctx: CanvasRenderingContext2D) => void;
      draw: (di: DrawInstance, ctx: CanvasRenderingContext2D) => void;
    },
    child?: CanvasComponent,
  );
  static new(
    options: {
      measure: (di: DrawInstance, ctx: CanvasRenderingContext2D) => void;
      draw: (di: DrawInstance, ctx: CanvasRenderingContext2D) => void;
    },
    child?: CanvasComponent,
  ): SingleChildCustomComponent;
}

/** Temporarily used anonymous component that can customize the `measure` and `draw` methods and has multiple children. It is recommended to construct this component directly inside the component tree for specific, one-time drawing.
 * If you need to reuse it frequently, consider create a new component class by extending the `CanvasComponent` class or one of its subclass. */
export class MultiChildCustomComponent extends CustomComponent {
  constructor(
    options: {
      measure: (di: DrawInstance, ctx: CanvasRenderingContext2D) => void;
      draw: (di: DrawInstance, ctx: CanvasRenderingContext2D) => void;
    },
    ...children: CanvasComponent[],
  );
  static new(
    options: {
      measure: (di: DrawInstance, ctx: CanvasRenderingContext2D) => void;
      draw: (di: DrawInstance, ctx: CanvasRenderingContext2D) => void;
    },
    ...children: CanvasComponent[],
  ): MultiChildCustomComponent;
}

/** Clip a component to shape it as a circle. */
export class CircleShaped extends SingleChildComponent {
  constructor(child?: CanvasComponent);
  static new(child?: CanvasComponent): CircleShaped;
}

/** Clip a component to shape it as a rounded rectangle. */
export class RectangleShaped extends SingleChildComponent {
  radius: number;

  constructor(options: { radius: number = 0; }, child?: CanvasComponent);
  static new(options: { radius: number = 0; }, child?: CanvasComponent): RectangleShaped;
}

/** Canvas component. Set the background color of an area and has some auxiliary features. */
export class Canvas extends SingleChildComponent {
  /** Background color of the drawable area. */
  backgroundColor: Color;
  /** Display a grid of 10 as the unit. */
  grid: boolean;

  constructor(options: { backgroundColor: Color = 'transparent'; grid: boolean = false; }, child?: CanvasComponent);
  static new(options: { backgroundColor: Color = 'transparent'; grid: boolean = false; }, child?: CanvasComponent): Canvas;
}

/** Stack component. Overlap multiple components in the same position. Components that are declared former are under the components that are declared latter. */
export class Stack extends MultiChildComponent {
  widthOverride?: number;
  heightOverride?: number;

  constructor(options: { width?: number; height?: number; }, ...children: CanvasComponent[]);
  static new(options: { width?: number; height?: number; }, ...children: CanvasComponent[]): CanvasComponent;
}

/** Positional component. Give an x, y offset to a component relative to drawable area or the whole canvas. */
export class Positional extends SingleChildComponent {
  /** Mode of offset. `'relative'` makes the offset relative to the top-left corner of the drawable area. `'absolute'` makes the offset relative to the top-left corner of the whole canvas. */
  mode: 'relative' | 'absolute';
  x: number;
  y: number;

  constructor(
    options: {
      mode: Positional['mode'] = 'relative';
      x: number = 0;
      y: number = 0;
    },
    child?: CanvasComponent
  );
  static new(
    options: {
      mode: Positional['mode'] = 'relative';
      x: number = 0;
      y: number = 0;
    },
    child?: CanvasComponent
  ): Positional;
}

/** Column component. Arrange components in a column (one in a row). Can specify the horizontal alignment of the components. */
export class Column extends MultiChildComponent {
  /** Horizontal alignment of the components. */
  alignment: 'left' | 'center' | 'right';

  constructor(options: { alignment: Column['alignment'] = 'left'; width?: number; }, ...children: CanvasComponent[]);
  static new(options: { alignment: Column['alignment'] = 'left'; width?: number; }, ...children: CanvasComponent[]): Column;
}

/** Row component. Arrange components in a row. Can specify the vertical alignment of the components. This resembles the CSS display: flex mode. */
export class Row extends MultiChildComponent {
  /** Vertical alignment of the components. */
  alignment: 'top' | 'center';
  /** Whether to shrink to fit the width of the children. If given `false`, the Row fills the width of the drawable area. */
  shrink: boolean;

  constructor(options: { alignment: Row['alignment'] = 'top' }, ...children: CanvasComponent[]);
  static new(options: { alignment: Row['alignment'] = 'top' }, ...children: CanvasComponent[]): Row;
}

/** Padding component. Add padding around a component. Left and right padding shrink the drawable area horizontally. Top and bottom padding make gaps between vertical arranged components. */
export class Padding extends SingleChildComponent {
  left: number;
  right: number;
  top: number;
  bottom: number;

  constructor(options: { left?: number; right?: number; top?: number; bottom?: number; }, child?: CanvasComponent);

  static new(options: { left?: number; right?: number; top?: number; bottom?: number; }, child?: CanvasComponent): Padding;

  /** Specify horizontal and vertical paddings symmetically. */
  static symmetric(options: { horizontal?: number; vertical?: number; }, child?: CanvasComponent): Padding;

  /** Specify paddings in every direction simultaneously. */
  static all(distance?: number, child?: CanvasComponent): Padding;
}

/** Text component. Draw a single-line or multiline text. Supports displaying ellipsis instead of let text overflow the drawable area.
 * Can customize text color, font size, weight and other properties that CSS font property supports.
 * Can restrict maximum lines of multiline text. Can adjust line height. */
export class Text extends CanvasComponent {
  /** Text content. */
  content: string;
  /** Actually drawn text content. When the content overflows the drawable area, according to the `overflow` property, actual text content might be trimmed. */
  actualContent: string;
  /** Text color. */
  color: Color;
  /** Font size. */
  size: number;
  /** Font weight. */
  weight: string;
  /** Line height (fixed px). */
  lineHeight: number;

  /** Wrap mode. `'wrap'` mode automatically wraps the text when it exceeds drawable area width. `'nowrap'` mode keeps the text in a single line. */
  textWrap: 'wrap' | 'nowrap';
  /** Maximum allowed lines of text when `textWrap` is `'wrap'`. When the content overflows the drawable area, according to the `overflow` property, actual text content might be trimmed.
   * Leaving it empty means not limiting the count of lines. */
  maxLines?: number;
  /** Overflow mode. When the content overflows the drawable area, `'visible'` mode still draw it, making the last line exceeds the area.
   * On the other hand, `'ellipsis'` cut off the text and displays an ellispis and the end. */
  overflow: 'visible' | 'ellipsis';

  constructor(
    content: string = '',
    options: {
      color: Color = 'black';
      size: number = 10;
      weight: string = 'normal';
      lineHeight?: number;
      widthFix: boolean = false;
      textWrap: Text['textWrap'] = 'nowrap';
      maxLines?: number;
      overflow: Text['overflow'] = 'ellipsis';
    },
  );

  static new(
    content: string = '',
    options: {
      color: Color = 'black';
      size: number = 10;
      weight: string = 'normal';
      lineHeight?: number;
      widthFix: boolean = false;
      textWrap: Text['textWrap'] = 'nowrap';
      maxLines?: number;
      overflow: Text['overflow'] = 'ellipsis';
    },
  ): Text;
}

/** Image component, draws an image. You need to supply a loaded Image object. You can specify the size of the image or a resize mode. */
export class CanvasImage extends CanvasComponent {
  img?: HTMLImageElement;
  /** Resize mode. `'fixed'` means display the image as-is or in a fixed size. `'widthFix'` mode fill up the width of the drawable area, and set the height in proportion.
   * Under `'fixed'` mode, if only one of `width` or `height` is set, then the other will be set in proportion. */
  mode: 'fixed' | 'widthFix';
  widthOverride?: number;
  heightOverride?: number;

  constructor(
    img?: HTMLImageElement,
    options: {
      mode: CanvasImage['mode'] = 'fixed';
      width?: number;
      height?: number;
    },
  );
  static new(
    img?: HTMLImageElement,
    options: {
      mode: CanvasImage['mode'] = 'fixed';
      width?: number;
      height?: number;
    },
  ): CanvasImage;
}

/** Rectangle component. Draw a filled or stroked, rounded or sharp rectangle. */
export class Rect extends CanvasComponent {
  /** Width of the rectangle. */
  width?: number;
  /** Height of the rectangle. */
  height: number;
  /** Color to be filled or stroked. */
  color: Color;
  /** Whether the rectangle is stroked or filled. */
  stroked: boolean;
  /** The line width of the stroked rectangle. */
  lineWidth: number;
  /** The radius of the rounded corner. */
  borderRadius: number;

  constructor(options: {
    width?: number;
    height: number = 10;
    color: Color = 'black';
    stroked: boolean = false;
    lineWidth: number = 1;
    borderRadius: number = 0;
  });
  static new(options: {
    width?: number;
    height: number = 10;
    color: Color = 'black';
    stroked: boolean = false;
    lineWidth: number = 1;
    borderRadius: number = 0;
  }): Rect;
}

/** Outline component. Draw a outline of a component that does not count in the width and height. */
export class Outlined extends SingleChildComponent {
  /** Width of the outline. */
  lineWidth: number;
  /** Color of the outline. */
  color: Color;
  /** Radius of the rounded corner. */
  borderRadius: number;

  constructor(options: { lineWidth: number = 1; color: Color = 'black'; borderRadius: number = 0; }, child?: CanvasComponent);
  static new(options: { lineWidth: number = 1; color: Color = 'black'; borderRadius: number = 0; }, child?: CanvasComponent): Outlined;
}

/** A type that is allowed to set to the color of a component. */
export type Color = CanvasRenderingContext2D['fillStyle'] | CustomCanvasColor;

/** A bunch of utility color class that can be converted to regular canvas color. */
interface CustomCanvasColor {
  toCanvasColor<T extends CanvasRenderingContext2D['fillStyle']>(di: DrawInstance, ctx: CanvasRenderingContext2D): T;
}

/** Make a component to take up full width of the drawable area. */
declare const Expand: (child: CanvasComponent) => SingleChildCustomComponent;

/** Create linear gradient inline using a syntax near to the CSS `linear-gradient` function, and can be converted to `CanvasGradient`.
 * Should convert this by invoking `toCanvasColor` before assigned to `fillStyle` or `strokeStyle`. */
export class LinearGradient implements CustomCanvasColor {
  /** The direction of the linear gradient. */
  direction: 'up' | 'down' | 'left' | 'right';
  colorStops: { offset: number; color: string; }[];

  constructor(direction: LinearGradient['direction'] = 'up', ...colorStops: LinearGradient['colorStops']);

  toCanvasColor(di: DrawInstance, ctx: CanvasRenderingContext2D): CanvasGradient;
}

/** Convert a `Color` (not only `CustomCanvasColor`) object into a color value accepted by Canvas. */
declare function toCanvasColor(di: DrawInstance, ctx: CanvasRenderingContext2D, color: Color): CanvasRenderingContext2D['fillStyle'];