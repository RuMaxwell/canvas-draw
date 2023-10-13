/** 绘制上下文，描述可绘制区域。在绘制过程中，表示当前正在绘制的组件正常情况下应该被限制在的区域，类似于 CSS 盒模型中的 content 区域。内容并非完全不可能超出区域，例如存在绝对定位的元素或某些元素的 overflow 是 visible。 */
interface DrawInstance {
  /** 全画布宽度。 */
  canvasWidth: number;
  /** 全画布高度。 */
  canvasHeight: number;
  /** 可绘制区域宽度。通常被严格限制，大部分组件的真实宽度不能超过此宽度。 */
  contentWidth: number;
  /** 可绘制区域高度。只有固定高度的组件才能限制内容的真实高度，否则高度会由内容的高度决定。 */
  contentHeight: number;
  /** 可绘制区域左边距（相对于画布）。 */
  x: number;
  /** 可绘制区域上边距（相对于画布）。 */
  y: number;
}

/** 字体配置选项。 */
interface Font {
  color?: Color;
  size?: number;
  weight?: string;
}

/** 根据 canvas 的宽度和高度获取一个全新的可绘制区域。 */
declare function getDrawInstance(canvasWidth: number, canvasHeight: number): DrawInstance;

/** 用一种特定的字体测量一段文字的尺寸数据。 */
declare function measureTextWithFont(ctx: CanvasRenderingContext2D, text: string, font: Font): TextMetrics;

interface Provider {
}

interface ProviderConstructor {
  new(...arg: any[]): Provider;
}

declare function provide(component: CanvasComponent, providerConstructor: ProviderConstructor, ...args: any[]): any;

/** 任何组件的基类。 */
class CanvasComponent {
  /** 包括当前组件的所有子内容的宽度（计算 overflow 为 visible 的组件，不计算绝对定位组件）。若组件和子组件均没有被指定固定的宽度，那么在测量（调用 `measure` 方法）之前该值为 `undefined`。 */
  width?: number;
  /** 包括当前组件的所有子内容的高度（计算 overflow 为 visible 的组件，不计算绝对定位组件）。若组件和子组件均没有被指定固定的高度，那么在测量（调用 `measure` 方法）之前该值为 `undefined`。 */
  height?: number;
  /** 自定义的名称，用于调试。 */
  id?: string;

  /** 父组件注入的依赖。 */
  providers: Record<string, ProviderConstructor>;

  /** 额外的初始化程序，会在父组件 init 后调用。
   * 因为求值顺序，子组件会在父组件之前构造，所以该函数可以处理一些在父组件构造成功以后才能正确初始化的状态。
   * 最外层组件的 init 需要在构造后手动调用。*/
  init(): void;

  /** 测量组件的宽度和高度。 */
  measure(di: DrawInstance, ctx: CanvasRenderingContext2D): void;
  /** 在 canvas 上绘制组件。 */
  draw(di: DrawInstance, ctx: CanvasRenderingContext2D): void;

  /** 为该组件赋予 id 并返回组件自身。 */
  ofId(id: string): CanvasComponent;
}

/** 有单个子组件的组件。 */
class SingleChildComponent extends CanvasComponent {
  child?: CanvasComponent;
}

/** 有多个子组件的组件。 */
class MultiChildComponent extends CanvasComponent {
  children: CanvasComponent[];
}

/** 临时使用的匿名组件，可以自定义 `measure` 和 `draw` 方法。应该为了特定的、一次性的绘制在组件树中直接构造这个组件。大量重复利用的情况应该继承 CanvasComponent 或其子类创建新的组件。 */
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

/** 临时使用的匿名组件，可以自定义 `measure` 和 `draw` 方法，且能包含一个子组件。应该为了特定的、一次性的绘制在组件树中直接构造这个组件。大量重复利用的情况应该继承 CanvasComponent 或其子类创建新的组件。 */
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

/** 临时使用的匿名组件，可以自定义 `measure` 和 `draw` 方法，且能包含多个子组件。应该为了特定的、一次性的绘制在组件树中直接构造这个组件。大量重复利用的情况应该继承 CanvasComponent 或其子类创建新的组件。 */
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

/** 将组件的边缘剪切成圆形。 */
export class CircleShaped extends SingleChildComponent {
  constructor(child?: CanvasComponent);
  static new(child?: CanvasComponent): CircleShaped;
}

/** 将组件的边缘剪切成圆角矩形。 */
export class RectangleShaped extends SingleChildComponent {
  radius: number;

  constructor(options: { radius: number = 0; }, child?: CanvasComponent);
  static new(options: { radius: number = 0; }, child?: CanvasComponent): RectangleShaped;
}

/** 画布组件，可设置一块区域的背景色。还有一些辅助功能。 */
export class Canvas extends SingleChildComponent {
  /** 可绘制区域背景色。 */
  backgroundColor: Color;
  /** 显示以 10 为单位的网格。 */
  grid: boolean;

  constructor(options: { backgroundColor: Color = 'transparent'; grid: boolean = false; }, child?: CanvasComponent);
  static new(options: { backgroundColor: Color = 'transparent'; grid: boolean = false; }, child?: CanvasComponent): Canvas;
}

/** 栈组件，在相同位置叠加多个子组件。先声明的组件在后声明的组件下方。 */
export class Stack extends MultiChildComponent {
  widthOverride?: number;
  heightOverride?: number;

  constructor(options: { width?: number; height?: number; }, ...children: CanvasComponent[]);
  static new(options: { width?: number; height?: number; }, ...children: CanvasComponent[]): CanvasComponent;
}

/** 定位组件，可以给子组件指定相对于当前可绘制区域或整个画布的 x, y 偏移量。 */
export class Positional extends SingleChildComponent {
  /** 偏移量模式。`'relative'` 使得偏移量相对于当前可绘制区域的左上角，`'absolute'` 使得偏移量相对于整个画布的左上角。 */
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

/** 列组件，将子组件按纵向排列（一行一个）。可以指定子组件的横向对齐方式。 */
export class Column extends MultiChildComponent {
  /** 子组件的横向对齐方式。 */
  alignment: 'left' | 'center' | 'right';

  constructor(options: { alignment: Column['alignment'] = 'left'; width?: number; }, ...children: CanvasComponent[]);
  static new(options: { alignment: Column['alignment'] = 'left'; width?: number; }, ...children: CanvasComponent[]): Column;
}

/** 行组件，将子组件按横向排列。可以指定子组件的纵向对齐方式。类似于 CSS display: flex 模式。 */
export class Row extends MultiChildComponent {
  /** 子组件的纵向对齐方式。 */
  alignment: 'top' | 'center';

  constructor(options: { alignment: Row['alignment'] = 'top' }, ...children: CanvasComponent[]);
  static new(options: { alignment: Row['alignment'] = 'top' }, ...children: CanvasComponent[]): Row;
}

/** Padding 组件，在子组件周围添加填充边距。左右填充会使可绘制区域向中间横向收缩，上下填充会使纵向排列的组件之间出现间距。 */
export class Padding extends SingleChildComponent {
  left: number;
  right: number;
  top: number;
  bottom: number;

  constructor(options: { left?: number; right?: number; top?: number; bottom?: number; }, child?: CanvasComponent);

  static new(options: { left?: number; right?: number; top?: number; bottom?: number; }, child?: CanvasComponent): Padding;

  /** 对称式地指定左右边距、上下边距。 */
  static symmetric(options: { horizontal?: number; vertical?: number; }, child?: CanvasComponent): Padding;

  /** 同时指定所有方向的边距。 */
  static all(distance?: number, child?: CanvasComponent): Padding;
}

/** 文字组件，绘制单行或多行文字。支持超出可绘制区域显示省略号。可以自定义文字颜色、字号、粗细等 CSS font 属性支持的文字属性。可以限制多行文字的最大行数。可以调整行高。 */
export class Text extends CanvasComponent {
  /** 文本内容。 */
  content: string;
  /** 实际绘制的文本内容，当内容超出可绘制区域时，根据 `overflow` 属性，实际绘制的文本内容可能会被截断。 */
  actualContent: string;
  /** 文字颜色。 */
  color: Color;
  /** 字号。 */
  size: number;
  /** 粗细。 */
  weight: string;
  /** 行高（固定 px）。 */
  lineHeight: number;

  /** 换行模式。`'wrap'` 代表自动换行，`'nowrap'` 代表不换行。 */
  textWrap: 'wrap' | 'nowrap';
  /** 开启自动换行时，允许的最大行数。文字超出该行数时，根据 `overflow` 属性，实际绘制的文本内容可能会被截断。为空表示不限制行数。 */
  maxLines?: number;
  /** 溢出模式，当内容超出可绘制区域时的表现。`'visible'` 表示仍然绘制，文字（最后一行）最终会超出区域。`'ellipsis'` 表示截断文字并在最后显示省略号。 */
  overflow: 'visible' | 'ellipsis';

  constructor(
    content: string = '',
    options: {
      color: Color = 'black';
      size: number = 10;
      weight: string = 'normal';
      lineHeight?: number;
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
      textWrap: Text['textWrap'] = 'nowrap';
      maxLines?: number;
      overflow: Text['overflow'] = 'ellipsis';
    },
  ): Text;
}

/** 图片组件，绘制图片。需要提供已经加载好的 Image 对象。可以调整图片尺寸的适应模式。 */
export class CanvasImage extends CanvasComponent {
  img?: HTMLImageElement;
  /** 尺寸模式。`'fixed'` 表示按图片原本大小或指定大小显示。`'widthFix'` 表示填满可绘制区域宽度，并按比例设置高度。
   * `'fixed'` 模式下若只指定高度和宽度中的一个，那么另一个会按比例缩放。 */
  mode: 'fixed' | 'widthFix';
  widthOverride?: number;
  heightOverride?: number;

  constructor(
    img?: HTMLImageElement,
    options: {
      mode: CanvasImage['mode'] = 'original';
      width?: number;
      height?: number;
    },
  );
  static new(
    img?: HTMLImageElement,
    options: {
      mode: CanvasImage['mode'] = 'original';
      width?: number;
      height?: number;
    },
  ): CanvasImage;
}

/** 矩形组件，绘制实心或空心，圆角或直角的矩形。 */
export class Rect extends CanvasComponent {
  /** 矩形的宽度。 */
  width?: number;
  /** 矩形的高度。 */
  height: number;
  /** 矩形的填充或轮廓色。 */
  color: Color;
  /** 是否绘制空心矩形。 */
  stroked: boolean;
  /** 空心矩形的轮廓线宽度。 */
  lineWidth: number;
  /** 圆角半径。 */
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

/** 外轮廓组件，为子组件绘制不计算在宽高内的边框。 */
export class Outlined extends SingleChildComponent {
  /** 轮廓粗细。 */
  lineWidth: number;
  /** 轮廓颜色。 */
  color: Color;
  /** 圆角半径。 */
  borderRadius: number;

  constructor(options: { lineWidth: number = 1; color: Color = 'black'; borderRadius: number = 0; }, child?: CanvasComponent);
  static new(options: { lineWidth: number = 1; color: Color = 'black'; borderRadius: number = 0; }, child?: CanvasComponent): Outlined;
}

/** 允许设置为组件的颜色的类型。 */
export type Color = CanvasRenderingContext2D['fillStyle'] | CustomCanvasColor;

/** 一些便于使用的，可以转化为普通 canvas 颜色的颜色类。 */
interface CustomCanvasColor {
  toCanvasColor<T extends CanvasRenderingContext2D['fillStyle']>(di: DrawInstance, ctx: CanvasRenderingContext2D): T;
}

/** 使子元素占满整个可绘制区域的宽度。 */
declare const Expand: (child: CanvasComponent) => SingleChildCustomComponent;

/** 快速创建线性渐变，使用类似于 CSS `linear-gradient` 函数的语法，并可转换为 `CanvasGradient`。需要在赋值给 `fillStyle` 或 `strokeStyle` 前调用 `toCanvasColor` 转换。 */
export class LinearGradient implements CustomCanvasColor {
  /** 线性渐变的方向。 */
  direction: 'up' | 'down' | 'left' | 'right';
  colorStops: { offset: number; color: string; }[];

  constructor(direction: LinearGradient['direction'] = 'up', ...colorStops: LinearGradient['colorStops']);

  toCanvasColor(di: DrawInstance, ctx: CanvasRenderingContext2D): CanvasGradient;
}

/** 将一个 `Color` （不仅仅是 `CustomCanvasColor`）对象转换为 Canvas 可接受的颜色值。 */
declare function toCanvasColor(di: DrawInstance, ctx: CanvasRenderingContext2D, color: Color): CanvasRenderingContext2D['fillStyle'];