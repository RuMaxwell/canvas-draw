# canvas-draw

[[English]](./README.md) | 中文

声明组件树，让它把自己画到 HTML Canvas 上。

也可用于微信小程序。

## 阅读示例代码

可以在 [`canvas.html`](./canvas.html) 文件中找到示例。大致的用法如下：

```html
<html>
<head>
    <script type="module" src="canvasDraw.js"></script>
</head>
<body>
    <canvas id="canvas" width="..." height="..."></canvas>
    <script type="module">
        import { getDrawInstance } from 'canvasDraw.js';

        const canvas = /* 找到 canvas 元素 */;
        const ctx = canvas.getContext('2d');

        const comp = /* 组件树... */;

        comp.init();

        // 创建一个用于渲染过程的上下文。
        let di = getDrawInstance(canvas.width, canvas.height);

        // 可选。这一段可以确定组件树的实际宽度和高度，便于将 canvas 缩小到刚好合适。
        comp.measure(di, ctx);
        canvas.width = comp.width;
        canvas.height = comp.height;
        di = getDrawInstance(canvas.width, canvas.height); // 重新创建 draw instance。

        // 把组件树画到 canvas 上。
        comp.draw(di, ctx);
    </script>
</body>
</html>
```

各组件和函数的用法均写在 [`canvasDraw.d.ts`](./canvasDraw.d.ts) 文件的文档注释中。

## 运行示例

Clone 本项目，进入项目目录，然后运行：

```python
python -m http.server
```

或任何一个你喜欢的本地静态服务器。切换到 `/canvas.html` 查看结果，点击“Download”按钮可保存为 `.png` 图片。
