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

export class CustomComponent {
  width;
  height;
  id;

  _measure;
  _draw;

  constructor({ measure = function () {}, draw = function () {} }) {
    this._measure = measure;
    this._draw = draw;
  }
  static new({ measure = function () {}, draw = function () {} }) {
    return new CustomComponent(...arguments);
  }

  measure(di, ctx) {
    this._measure.call(this, di, ctx);
  }

  draw(di, ctx) {
    this._draw.call(this, di, ctx);
  }
}

export class Canvas {
  width;
  height;
  id;
  child;

  backgroundColor;

  constructor({ backgroundColor = 'transparent' }, child) {
    this.child = child;
    this.backgroundColor = backgroundColor;
  }
  static new({ backgroundColor = 'transparent' }, child) {
    return new Canvas(...arguments);
  }

  measure(di, ctx) {
    if (!this.child) return;
    this.child.measure(di, ctx);
    this.width = this.child.width;
    this.height = this.child.height;
  }

  draw(di, ctx) {
    if (!this.child) return;
    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(0, 0, di.contentWidth, di.contentHeight);
    this.child.draw(di, ctx);
  }
}

export class Stack {
  width;
  height;
  id;
  children;

  constructor(...children) {
    this.children = children;
  }
  static new(...children) {
    return new Stack(...children);
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

export class Positional {
  width;
  height;
  id;
  child;

  mode;
  x;
  y;

  constructor({ mode = 'relative', x = 0, y = 0 }, child) {
    this.mode = mode;
    this.x = x;
    this.y = y;
    this.child = child;
  }
  static new({ mode = 'relative', x = 0, y = 0 }, child) {
    return new Positional(...arguments);
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

export class Column {
  width;
  height;
  id;
  children;

  alignment;

  constructor({ alignment = 'left', width }, ...children) {
    this.children = children;
    this.alignment = alignment;
    this.width = width;
  }
  static new({ alignment = 'left', width }, ...children) {
    return new Column(...arguments);
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

export class Row {
  width;
  height;
  id;
  children;

  alignment;

  constructor({ alignment = 'top' }, ...children) {
    this.children = children;
    this.alignment = alignment;
  }
  static new({ alignment = 'top' }, ...children) {
    return new Row(...arguments);
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

export class Padding {
  width;
  height;
  id;
  child;

  left;
  right;
  top;
  bottom;

  constructor({ left, right, top, bottom }, child) {
    this.child = child;
    this.left = left ?? 0;
    this.right = right ?? 0;
    this.top = top ?? 0;
    this.bottom = bottom ?? 0;
    if (this.child.width) {
      this.width = this.child.width + this.left + this.right;
    }
    if (this.child.height) {
      this.height = this.child.height + this.top + this.bottom;
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

  measure(di, ctx) {
    if (!this.child) return;
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

export class Text {
  content;
  actualContent;
  color;
  size;
  weight;
  lineHeight;

  widthFix;
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
      widthFix = false,
      textWrap = 'nowrap',
      maxLines,
      overflow = 'ellipsis',
    },
  ) {
    this.content = content;
    this.actualContent = '';
    this.color = color;
    this.size = size;
    this.lineHeight = lineHeight ?? size;
    this.widthFix = widthFix;
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
      widthFix = false,
      textWrap = 'nowrap',
      maxLines,
      overflow = 'ellipsis',
    },
  ) {
    return new Text(...arguments);
  }

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
    if (this.widthFix) {
      this.width = di.contentWidth;
    } else if (this.textWrap === 'nowrap') {
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
    setFont(ctx, this);
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

export class CanvasImage {
  img;
  mode;
  widthOverride;
  heightOverride;
  width;
  height;

  constructor(img, { mode = 'original', width, height }) {
    this.img = img;
    this.mode = mode;
    this.widthOverride = width;
    this.heightOverride = height;
    if (mode === 'original') {
      this.width = width ?? img.width;
      this.height =
        height ??
        (width != null ? (width / img.width) * img.height : img.height);
    }
  }
  static new(img, { mode = 'original', width, height }) {
    return new CanvasImage(...arguments);
  }

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
      this.width = this.widthOverride ?? this.img.width;
      this.height =
        this.heightOverride ??
        (this.widthOverride != null
          ? (this.widthOverride / this.img.width) * this.img.height
          : this.img.height);
    }
  }

  draw(di, ctx) {
    this.measure(di, ctx);
    ctx.drawImage(this.img, di.x, di.y, this.width, this.height);
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
  for (let i = 0; i <= text.length; ) {
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

function setFont(ctx, font) {
  ctx.fillStyle = font.color;
  const weight = font.weight ?? '';
  const size = font.size ?? 10;
  ctx.font = `${weight} ${size}px sans-serif`;
}

function measureText(ctx, text) {
  return ctx.measureText(text);
}

export function measureTextWithFont(ctx, text, font) {
  setFont(ctx, font);
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
