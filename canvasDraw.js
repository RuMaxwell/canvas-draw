export function getDrawInstance(canvasWidth, canvasHeight) {
  return {
    canvasWidth,
    canvasHeight,
    contentWidth: canvasWidth,
    contentHeight: canvasHeight,
    x: 0,
    y: 0,
  };
}

export function provide(component, providerConstructor, ...args) {
  if (typeof providerConstructor !== 'function') {
    throw new Error('provider is not a function');
  }
  if (!component?.providers || typeof component.providers !== 'object') {
    return;
  }
  component.providers[providerConstructor.name] = new providerConstructor(
    ...args,
  );
}

class CanvasComponent {
  width;
  height;
  id;

  providers = {};

  constructor() { }

  ofId(id) {
    this.id = id;
    return this;
  }
}

export class CustomComponent extends CanvasComponent {
  _init;
  _measure;
  _draw;

  constructor({
    init = function () { },
    measure = function () { },
    draw = function () { },
  }) {
    super();
    this._init = init;
    this._measure = measure;
    this._draw = draw;
  }
  static new({
    init = function () { },
    measure = function () { },
    draw = function () { },
  }) {
    return new CustomComponent(...arguments);
  }

  init() {
    this._init.call(this);
  }

  measure(di, ctx) {
    this._measure.call(this, di, ctx);
  }

  draw(di, ctx) {
    this._draw.call(this, di, ctx);
  }
}

export class SingleChildCustomComponent extends CanvasComponent {
  child;

  _init;
  _measure;
  _draw;

  constructor(
    { init = function () { }, measure = function () { }, draw = function () { } },
    child,
  ) {
    super();
    this._init = init;
    this._measure = measure;
    this._draw = draw;
    this.child = child;
  }
  static new(
    { init = function () { }, measure = function () { }, draw = function () { } },
    child,
  ) {
    return new SingleChildCustomComponent(...arguments);
  }

  init() {
    this._init.call(this);
  }

  measure(di, ctx) {
    this._measure.call(this, di, ctx);
  }

  draw(di, ctx) {
    this._draw.call(this, di, ctx);
  }
}

export class MultiChildCustomComponent extends CanvasComponent {
  children;

  _init;
  _measure;
  _draw;

  constructor(
    { init = function () { }, measure = function () { }, draw = function () { } },
    ...children
  ) {
    super();
    this._measure = measure;
    this._draw = draw;
    this.children = children;
  }
  static new(
    { init = function () { }, measure = function () { }, draw = function () { } },
    ...children
  ) {
    return new MultiChildCustomComponent(...arguments);
  }

  init() {
    this._init.call(this);
  }

  measure(di, ctx) {
    this._measure.call(this, di, ctx);
  }

  draw(di, ctx) {
    this._draw.call(this, di, ctx);
  }
}

export class CircleShaped extends CanvasComponent {
  child;

  constructor(child) {
    super();
    this.child = child;
    if (child) {
      if (child.width) {
        this.width = this.child.width;
      }
      if (child.height) {
        this.height = this.child.height;
      }
    }
  }
  static new(child) {
    return new CircleShaped(...arguments);
  }

  init() {
    this.child?.init();
  }

  measure(di, ctx) {
    if (!this.child) return;
    this.child.measure(di, ctx);
    this.width = this.child.width;
    this.height = this.child.height;
  }

  draw(di, ctx) {
    if (!this.child) return;
    this.measure(di, ctx);
    ctx.save();
    ctx.beginPath();
    ctx.arc(
      di.x + this.width / 2,
      di.y + this.height / 2,
      this.width / 2,
      0,
      Math.PI * 2,
    );
    ctx.clip();
    this.child.draw(di, ctx);
    ctx.restore();
  }
}

export class RectangleShaped extends CanvasComponent {
  child;

  radius;

  constructor({ radius = 0 }, child) {
    super();
    this.child = child;
    this.radius = radius;
    if (child) {
      if (child.width) {
        this.width = this.child.width;
      }
      if (child.height) {
        this.height = this.child.height;
      }
    }
  }
  static new({ radius = 0 }, child) {
    return new RectangleShaped(...arguments);
  }

  init() {
    this.child?.init();
  }

  measure(di, ctx) {
    if (!this.child) return;
    this.child.measure(di, ctx);
    this.width = this.child.width;
    this.height = this.child.height;
  }

  draw(di, ctx) {
    if (!this.child) return;
    this.measure(di, ctx);
    ctx.save();
    ctx.beginPath();
    const r = this.radius;
    ctx.moveTo(di.x + r, di.y);
    ctx.lineTo(di.x + this.width - r, di.y);
    ctx.arcTo(di.x + this.width, di.y, di.x + this.width, di.y + r, r);
    ctx.lineTo(di.x + this.width, di.y + this.height - r);
    ctx.arcTo(
      di.x + this.width,
      di.y + this.height,
      di.x + this.width - r,
      di.y + this.height,
      r,
    );
    ctx.lineTo(di.x + r, di.y + this.height);
    ctx.arcTo(di.x, di.y + this.height, di.x, di.y + this.height - r, r);
    ctx.lineTo(di.x, di.y + r);
    ctx.arcTo(di.x, di.y, di.x + r, di.y, r);
    ctx.closePath();
    ctx.clip();
    this.child.draw(di, ctx);
    ctx.restore();
  }
}

export class Canvas extends CanvasComponent {
  child;

  backgroundColor;
  grid;

  constructor({ backgroundColor = 'transparent', grid = false }, child) {
    super();
    this.child = child;
    this.backgroundColor = backgroundColor;
    this.grid = grid;
    if (child) {
      if (child.width) {
        this.width = child.width;
      }
      if (child.height) {
        this.height = child.height;
      }
    }
  }
  static new({ backgroundColor = 'transparent', grid = false }, child) {
    return new Canvas(...arguments);
  }

  init() {
    this.child?.init();
  }

  measure(di, ctx) {
    if (!this.child) {
      this.width = 0;
      this.height = 0;
    } else {
      this.child.measure(di, ctx);
      this.width = Math.min(this.child.width, di.contentWidth);
      this.height = this.child.height;
    }
  }

  draw(di, ctx) {
    if (!this.child) return;
    ctx.fillStyle = toCanvasColor(di, ctx, this.backgroundColor);
    ctx.fillRect(di.x, di.y, this.width, this.height);
    if (this.grid) {
      this._drawGrid(di, ctx);
    }
    this.child.draw(di, ctx);
  }

  _drawGrid(di, ctx) {
    ctx.lineWidth = 1;
    for (let y = 0; y <= di.contentHeight; y += 10) {
      if (y % 50 === 0) {
        ctx.strokeStyle = '#cccccc';
      } else {
        ctx.strokeStyle = '#eeeeee';
      }
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(di.contentWidth, y);
      ctx.stroke();
      ctx.closePath();
    }
    for (let x = 0; x <= di.contentWidth; x += 10) {
      if (x % 50 === 0) {
        ctx.strokeStyle = '#cccccc';
      } else {
        ctx.strokeStyle = '#eeeeee';
      }
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, di.contentHeight);
      ctx.stroke();
      ctx.closePath();
    }
  }
}

export class Stack extends CanvasComponent {
  children;
  widthOverride;
  heightOverride;

  constructor({ width, height }, ...children) {
    super();
    this.children = children;
    if (width) {
      this.width = this.widthOverride = width;
    }
    if (height) {
      this.height = this.heightOverride = height;
    }
  }
  static new(...children) {
    return new Stack(...children);
  }

  init() {
    this.children.forEach((child) => child.init());
  }

  measure(di, ctx) {
    let width = 0;
    let height = 0;
    this.children.forEach((child) => {
      child.measure(di, ctx);
      width = Math.max(width, child.width);
      height = Math.max(height, child.height);
    });
    this.width = width;
    this.height = height;
  }

  draw(di, ctx) {
    this.children.forEach((child) => {
      child.draw({ ...di }, ctx);
    });
  }
}

export class Positional extends CanvasComponent {
  child;

  mode;
  x;
  y;

  constructor({ mode = 'relative', x = 0, y = 0 }, child) {
    super();
    this.mode = mode;
    this.x = x;
    this.y = y;
    this.child = child;
    if (mode !== 'absolute' && child) {
      if (child.width) {
        this.width = child.width;
      }
      if (child.height) {
        this.height = child.height;
      }
    }
  }
  static new({ mode = 'relative', x = 0, y = 0 }, child) {
    return new Positional(...arguments);
  }

  init() {
    this.child?.init();
  }

  measure(di, ctx) {
    if (!this.child) return;
    this.child.measure(di, ctx);
    if (this.mode === 'relative') {
      this.width = this.child.width + this.x;
      this.height = this.child.width + this.y;
    } else if (this.mode === 'absolute') {
      this.width = 0;
      this.height = 0;
    }
  }

  draw(di, ctx) {
    if (!this.child) return;
    if (this.mode === 'relative') {
      this.child.draw(
        {
          ...di,
          contentWidth: di.contentWidth - this.x,
          contentHeight: di.contentHeight - this.y,
          x: di.x + this.x,
          y: di.y + this.y,
        },
        ctx,
      );
    } else if (this.mode === 'absolute') {
      this.child.draw(
        {
          ...di,
          contentWidth: di.canvasWidth,
          contentHeight: di.canvasHeight,
          x: this.x,
          y: this.y,
        },
        ctx,
      );
    }
  }
}

export class Column extends CanvasComponent {
  children;

  alignment;

  constructor({ alignment = 'left', width }, ...children) {
    super();
    this.children = children;
    this.alignment = alignment;
    this.width = width;
  }
  static new({ alignment = 'left', width }, ...children) {
    return new Column(...arguments);
  }

  init() {
    this.children.forEach((child) => child.init());
  }

  measure(di, ctx) {
    let width = 0;
    let height = 0;
    this.children.forEach((child) => {
      child.measure(di, ctx);
      width = Math.max(width, child.width);
      height += child.height;
    });
    this.width = width;
    this.height = height;
  }

  draw(di, ctx) {
    const left = di.x;
    let y = di.y;
    this.children.forEach((child) => {
      child.measure(di, ctx);
      const x = getAlignedX(this.alignment, left, di.contentWidth, child.width);
      child.draw({ ...di, x, y }, ctx);
      y += child.height;
    });
  }
}

export class Row extends CanvasComponent {
  children;

  alignment;

  constructor({ alignment = 'top' }, ...children) {
    super();
    this.children = children;
    this.alignment = alignment;
  }
  static new({ alignment = 'top' }, ...children) {
    return new Row(...arguments);
  }

  init() {
    this.children.forEach((child) => child.init());
  }

  measure(di, ctx) {
    this.width = di.contentWidth;
    let height = 0;
    let totalFixedWidth = 0;
    let fixedWidthCount = 0;
    this.children.forEach((child) => {
      if (child.width) {
        totalFixedWidth += child.width;
        fixedWidthCount++;
      }
    });
    let totalDynamicWidth = this.width - totalFixedWidth;
    const dynamicWidth =
      this.children.length === fixedWidthCount
        ? 0
        : totalDynamicWidth / (this.children.length - fixedWidthCount);
    this.children.forEach((child) => {
      const contentWidth = child.width ?? dynamicWidth;
      child.measure(
        {
          ...di,
          contentWidth,
        },
        ctx,
      );
      height = Math.max(height, child.height);
    });
    this.height = height;
  }

  draw(di, ctx) {
    const top = di.y;
    let x = di.x;
    this.measure(di, ctx);
    this.children.forEach((child) => {
      const y = getAlignedY(this.alignment, top, this.height, child.height);
      child.draw({ ...di, contentWidth: child.width, x, y }, ctx);
      x += child.width;
    });
  }
}

export class Padding extends CanvasComponent {
  child;

  left;
  right;
  top;
  bottom;

  constructor({ left, right, top, bottom }, child) {
    super();
    this.child = child;
    this.left = left ?? 0;
    this.right = right ?? 0;
    this.top = top ?? 0;
    this.bottom = bottom ?? 0;
    if (child) {
      if (child.width) {
        this.width = this.child.width + this.left + this.right;
      }
      if (child.height) {
        this.height = this.child.height + this.top + this.bottom;
      }
    }
  }
  static new({ left, right, top, bottom }, child) {
    return new Padding(...arguments);
  }

  static symmetric({ horizontal, vertical }, child) {
    return new Padding(
      { left: horizontal, right: horizontal, top: vertical, bottom: vertical },
      child,
    );
  }

  static all(distance, child) {
    return new Padding(
      { left: distance, right: distance, top: distance, bottom: distance },
      child,
    );
  }

  init() {
    this.child?.init();
  }

  measure(di, ctx) {
    if (!this.child) {
      this.width = Math.min(di.contentWidth, this.left + this.right);
      this.height = this.top + this.bottom;
      return;
    }
    this.child.measure(
      {
        ...di,
        contentWidth: di.contentWidth - this.left - this.right,
        contentHeight: di.contentHeight,
      },
      ctx,
    );
    // Padding 组件被禁止宽度超过可绘制区域。
    this.width = Math.min(
      di.contentWidth,
      this.child.width + this.left + this.right,
    );
    this.height = this.child.height + this.top + this.bottom;
  }

  draw(di, ctx) {
    this.child?.draw(
      {
        ...di,
        contentWidth: di.contentWidth - this.left - this.right,
        contentHeight: di.contentHeight,
        x: di.x + this.left,
        y: di.y + this.top,
      },
      ctx,
    );
  }
}

export class Text extends CanvasComponent {
  content;
  actualContent;
  color;
  size;
  weight;
  lineHeight;

  textWrap;
  maxLines;
  overflow;

  constructor(
    content = '',
    {
      color = 'black',
      size = 10,
      weight = 'normal',
      lineHeight,
      textWrap = 'nowrap',
      maxLines,
      overflow = 'ellipsis',
    },
  ) {
    super();
    this.content = content;
    this.actualContent = '';
    this.color = color;
    this.size = size;
    this.lineHeight = lineHeight ?? size;
    this.weight = weight;
    this.textWrap = textWrap;
    this.maxLines = maxLines;
    this.overflow = overflow;
  }
  static new(
    content = '',
    {
      color = 'black',
      size = 10,
      weight = 'normal',
      lineHeight,
      textWrap = 'nowrap',
      maxLines,
      overflow = 'ellipsis',
    },
  ) {
    return new Text(...arguments);
  }

  init() { }

  _setActualContent(di, ctx) {
    if (this.textWrap === 'nowrap') {
      this._setActualContentNoWrap(di, ctx);
    } else {
      this._setActualContentLines(di, ctx);
    }
  }

  _setActualContentNoWrap(di, ctx) {
    if (this.overflow === 'ellipsis') {
      this.actualContent = getActualTextContent(
        ctx,
        this.content,
        this,
        di.contentWidth,
      );
    } else {
      this.actualContent = this.content;
    }
  }

  _setActualContentLines(di, ctx) {
    this.actualContent = getActualTextLines(
      ctx,
      this.content,
      this,
      di.contentWidth,
      this.maxLines,
      this.overflow,
    );
  }

  measure(di, ctx) {
    this._setActualContent(di, ctx);
    if (this.textWrap === 'nowrap') {
      const m = measureTextWithFont(ctx, this.actualContent, this);
      this.width = m.width;
    } else {
      let width = 0;
      this.actualContent.forEach((line) => {
        const m = measureTextWithFont(ctx, line, this);
        width = Math.max(m.width, width);
      });
      this.width = width;
    }
    if (this.textWrap === 'nowrap') {
      this.height = this.lineHeight;
    } else {
      this.height = this.lineHeight * this.actualContent.length;
    }
  }

  draw(di, ctx) {
    ctx.textBaseline = 'top';
    const x = di.x;
    const y = di.y + (this.lineHeight - this.size) / 2;
    setFont(di, ctx, this);
    this._setActualContent(di, ctx);
    if (this.textWrap === 'nowrap') {
      ctx.fillText(this.actualContent, x, y);
    } else {
      this.actualContent.forEach((line, i) => {
        ctx.fillText(line, x, y + i * this.lineHeight);
      });
    }
  }
}

export class CanvasImage extends CanvasComponent {
  img;
  mode;
  widthOverride;
  heightOverride;

  constructor(img, { mode = 'fixed', width, height }) {
    super();
    this.img = img;
    this.mode = mode;
    this.widthOverride = width;
    this.heightOverride = height;
    if (mode === 'fixed') {
      if (width != null && height == null) {
        this.width = width;
        this.height = (width / img.width) * img.height;
      } else if (width == null && height != null) {
        this.height = height;
        this.width = (height / img.height) * img.width;
      } else {
        this.width = width ?? img.width;
        this.height = height ?? img.height;
      }
    }
  }
  static new(img, { mode = 'fixed', width, height }) {
    return new CanvasImage(...arguments);
  }

  init() { }

  measure(di, ctx) {
    if (this.img == null) {
      this.width = 0;
      this.height = 0;
      return;
    }
    if (this.mode === 'widthFix') {
      this.width = di.contentWidth;
      this.height = (this.width / this.img.width) * this.img.height;
    } else {
      const width = this.widthOverride;
      const height = this.heightOverride;
      const img = this.img;
      if (width != null && height == null) {
        this.width = width;
        this.height = (width / img.width) * img.height;
      } else if (width == null && height != null) {
        this.height = height;
        this.width = (height / img.height) * img.width;
      } else {
        this.width = width ?? img.width;
        this.height = height ?? img.height;
      }
    }
  }

  draw(di, ctx) {
    this.measure(di, ctx);
    ctx.drawImage(this.img, di.x, di.y, this.width, this.height);
  }
}

export class Rect extends CanvasComponent {
  color;
  stroked;
  lineWidth;
  borderRadius;

  constructor({
    width = 10,
    height = 10,
    color = 'black',
    stroked = false,
    lineWidth = 1,
    borderRadius = 0,
  }) {
    super();
    this.height = height;
    this.width = width;
    this.color = color;
    this.stroked = stroked;
    this.lineWidth = lineWidth;
    this.borderRadius = borderRadius;
  }
  static new({
    width,
    height = 10,
    color = 'black',
    stroked = true,
    lineWidth = 1,
    borderRadius = 0,
  }) {
    return new Rect(...arguments);
  }

  init() { }

  measure(di, ctx) { }

  draw(di, ctx) {
    this.measure(di, ctx);
    if (this.stroked) {
      ctx.lineWidth = this.lineWidth;
      ctx.strokeStyle = toCanvasColor(di, ctx, this.color);
      ctx.beginPath();
      ctx.roundRect(di.x, di.y, this.width, this.height, this.borderRadius);
      ctx.stroke();
    } else {
      ctx.fillStyle = toCanvasColor(di, ctx, this.color);
      ctx.beginPath();
      ctx.roundRect(di.x, di.y, this.width, this.height, this.borderRadius);
      ctx.fill();
    }
  }
}

export class Outlined extends CanvasComponent {
  child;

  lineWidth;
  color;
  borderRadius;

  constructor({ lineWidth = 1, color = 'black', borderRadius = 0 }, child) {
    super();
    this.child = child;
    this.lineWidth = lineWidth;
    this.color = color;
    this.borderRadius = borderRadius;
  }
  static new({ lineWidth, color, borderRadius }, child) {
    return new Outlined(...arguments);
  }

  init() {
    this.child?.init();
  }

  measure(di, ctx) {
    if (!this.child) return;
    this.child.measure(di, ctx);
    this.width = this.child.width;
    this.height = this.child.height;
  }

  draw(di, ctx) {
    if (!this.child) return;
    this.child.measure(di, ctx);
    Stack.new(
      {},
      this.child,
      Rect.new({
        width: this.child.width,
        height: this.child.height,
        color: this.color,
        stroked: true,
        lineWidth: this.lineWidth,
        borderRadius: this.borderRadius,
      }),
    ).draw(di, ctx);
  }
}

function getActualTextContent(ctx, text, font, maxWidth) {
  const textWidth = measureTextWithFont(ctx, text, font).width;
  if (textWidth <= maxWidth) {
    return text;
  }
  const ellipsis = '...';
  let actualText;
  for (let i = text.length - 1; i >= 0; i--) {
    actualText = text.slice(0, i) + ellipsis;
    const width = measureText(ctx, actualText).width;
    if (width <= maxWidth) break;
  }
  return actualText;
}

function getActualTextLines(ctx, text, font, maxWidth, maxLines, overflow) {
  const lines = [];
  let lineStart = 0;
  for (let i = 0; i <= text.length;) {
    let line = text.slice(lineStart, i);
    let width = measureTextWithFont(ctx, line, font).width;
    if (i - lineStart <= 1 || width <= maxWidth) {
      i++;
    } else if (!maxLines || lines.length + 1 < maxLines) {
      lines.push(line.slice(0, -1));
      lineStart = i - 1;
    } else if (overflow === 'ellipsis') {
      lines.push(
        getActualTextContent(ctx, text.slice(lineStart), font, maxWidth),
      );
      return lines;
    } else {
      break;
    }
  }
  lines.push(text.slice(lineStart));
  return lines;
}

function setFont(di, ctx, font) {
  ctx.fillStyle = toCanvasColor(di, ctx, font.color) ?? 'black';
  const weight = font.weight ?? '';
  const size = font.size ?? 10;
  ctx.font = `${weight} ${size}px sans-serif`;
}

function measureText(ctx, text) {
  return ctx.measureText(text);
}

export function measureTextWithFont(ctx, text, font) {
  setFont({}, ctx, font);
  return measureText(ctx, text);
}

function getAlignedX(alignment, left, rowWidth, elementWidth) {
  if (alignment === 'center') {
    return left + rowWidth / 2 - elementWidth / 2;
  } else if (alignment === 'right') {
    return left + rowWidth - elementWidth;
  } else {
    return left;
  }
}

function getAlignedY(alignment, top, columnHeight, elementHeight) {
  if (alignment === 'center') {
    return top + columnHeight / 2 - elementHeight / 2;
  } else {
    return top;
  }
}

export const Expand = (child) =>
  SingleChildCustomComponent.new(
    {
      measure(di, ctx) {
        this.child.measure(di, ctx);
        this.child.width = this.width = di.contentWidth;
        this.height = this.child.height;
      },
      draw(di, ctx) {
        this.measure(di, ctx);
        this.child.draw(di, ctx);
      },
    },
    child,
  );

export class LinearGradient {
  direction;
  colorStops;

  static directions(di) {
    return {
      up: [di.x, di.y + di.contentHeight, di.x, di.y],
      down: [di.x, di.y, di.x, di.y + di.contentHeight],
      left: [di.x + di.contentWidth, di.y, di.x, di.y],
      right: [di.x, di.y, di.x + di.contentWidth, di.y],
    };
  }

  constructor(direction = 'up', ...colorStops) {
    this.direction = direction;
    this.colorStops = colorStops;
  }

  toCanvasColor(di, ctx) {
    const grad = ctx.createLinearGradient(
      ...LinearGradient.directions(di)[this.direction],
    );
    this.colorStops.forEach(({ offset, color }) => {
      grad.addColorStop(offset, color);
    });
    return grad;
  }
}

export function toCanvasColor(di, ctx, color) {
  if (typeof color?.toCanvasColor === 'function') {
    return color.toCanvasColor(di, ctx);
  } else {
    return color;
  }
}
