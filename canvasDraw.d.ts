/** 可绘制区域。在绘制过程中，表示当前正在绘制的组件正常情况下应该被限制在的区域，类似于 CSS 盒模型中的 content 区域。内容并非完全不可能超出区域，例如存在绝对定位的元素或某些元素的 overflow 是 visible。 */
interface DrawInstance {
  /** 全画布宽度。 */
  canvasWidth: number;
  /** 全画布高度。 */
  canvasHeight: number;
  /** 可绘制区域宽度。 */
  contentWidth: number;
  /** 可绘制区域高度（暂时没有用）。 */
  contentHeight: number;
  /** 可绘制区域左边距。 */
  x: number;
  /** 可绘制区域上边距。 */
  y: number;
}

interface Font {
  color?: string;
  size?: number;
  weight?: string;
}

/** 根据 canvas 的宽度和高度获取一个全新的可绘制区域。 */
declare function getDrawInstance(canvasWidth: number, canvasHeight: number): DrawInstance;

declare function measureTextWithFont(ctx: CanvasRenderingContext2D, text: string, font: Font);

/** 任何组件的基类。 */
class CanvasComponent {
  /** 包括当前组件的所有子内容的宽度（计算 overflow 为 visible 的元素，不计算绝对定位元素）。在测量（调用 `measure` 方法）之前为 `undefined`。 */
  width?: number;
  /** 包括当前组件的所有子内容的高度（计算 overflow 为 visible 的元素，不计算绝对定位元素）。在测量（调用 `measure` 方法）之前为 `undefined`。 */
  height?: number;
  /** 自定义的名称，用于调试。 */
  id?: string;

  /** 测量组件的宽度和高度。 */
  measure(di: DrawInstance, ctx: CanvasRenderingContext2D): void;
  /** 在 canvas 上绘制组件。 */
  draw(di: DrawInstance, ctx: CanvasRenderingContext2D): void;
}

/** 单个子组件的组件类。 */
class SingleChildComponent extends CanvasComponent {
  child?: CanvasComponent;
}

/** 多个子组件的组件类。 */
class MultiChildComponent extends CanvasComponent {
  children: CanvasComponent[];
}

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

/** 画布组件，可设置一块区域的背景色。 */
export class Canvas extends SingleChildComponent {
  backgroundColor: string;

  constructor(options: { backgroundColor: string = 'transparent' }, child?: CanvasComponent);
  static new(options: { backgroundColor: string = 'transparent' }, child?: CanvasComponent): Canvas;
}

export class Stack extends MultiChildComponent {
  constructor(...children: CanvasComponent[]);
  static new(...children: CanvasComponent[]): CanvasComponent;
}

export class Positional extends SingleChildComponent {
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

/** 行组件，将子组件按横向排列（一行一个）。可以指定子组件的纵向对齐方式。类似于 CSS display: flex 模式。 */
export class Row extends MultiChildComponent {
  /** 子组件的纵向对齐方式。 */
  alignment: 'top' | 'center';

  constructor(options: { alignment: Row['alignment'] = 'top' }, ...children: CanvasComponent[]);
  static new(options: { alignment: Row['alignment'] = 'top' }, ...children: CanvasComponent[]): Row;
}

/** Padding 组件，在子组件周围添加边距。左右边距会使可绘制区域向中间收缩，上下边距会使纵向排列的组件之间出现间距。 */
export class Padding extends SingleChildComponent {
  left: number;
  right: number;
  top: number;
  bottom: number;

  constructor(options: { left?: number; right?: number; top?: number; bottom?: number; }, child?: CanvasComponent);

  static new(options: { left?: number; right?: number; top?: number; bottom?: number; }, child?: CanvasComponent): Padding;

  /** 分别同时指定左右边距、上下边距。 */
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
  color: string;
  /** 字号。 */
  size: number;
  /** 粗细。 */
  weight: string;
  /** 行高（固定 px）。 */
  lineHeight: number;

  /** 是否占满可绘制区域宽度，即便文字不够长。 */
  widthFix: boolean;
  /** 换行模式。`'wrap'` 代表自动换行，`'nowrap'` 代表不换行。 */
  textWrap: 'wrap' | 'nowrap';
  /** 开启自动换行时，允许的最大行数。文字超出该行数时，根据 `overflow` 属性，实际绘制的文本内容可能会被截断。为空表示不限制行数。 */
  maxLines?: number;
  /** 溢出模式，当内容超出可绘制区域时的表现。`'visible'` 表示仍然绘制，文字（最后一行）最终会超出区域。`'ellipsis'` 表示截断文字并在最后显示省略号。 */
  overflow: 'visible' | 'ellipsis';

  constructor(
    content: string = '',
    options: {
      color: string = 'black';
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
      color: string = 'black';
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

/** 图片组件，绘制图片。需要提供已经加载好的 Image 对象。可以调整图片尺寸的适应模式。 */
export class CanvasImage extends CanvasComponent {
  img?: HTMLImageElement;
  /** 尺寸模式。`'original'` 表示按图片原本大小显示。`'widthFix'` 表示填满可绘制区域宽度，并按比例设置高度。 */
  mode: 'original' | 'widthFix';

  constructor(
    img?: HTMLImageElement,
    options: { mode: CanvasImage['mode'] = 'original'; width?: number; height?: number; }
  );
  static new(
    img?: HTMLImageElement,
    options: { mode: CanvasImage['mode'] = 'original'; width?: number; height?: number; }
  ): CanvasImage;
}