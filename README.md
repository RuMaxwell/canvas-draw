# canvas-draw

English | [[中文]](./README-zh.md)

Declare components and let them draw themselves onto the HTML Canvas.

Also usable in Weixin Mini Program.

## Check the example code

You can see the usage examples in the [`canvas.html`](./canvas.html) file. In general, you write something like this:

```html
<html>
<head>
    <script type="module" src="canvasDraw.js"></script>
</head>
<body>
    <canvas id="canvas" width="..." height="..."></canvas>
    <script type="module">
        import { getDrawInstance } from 'canvasDraw.js';

        const canvas = /* get the canvas element */;
        const ctx = canvas.getContext('2d');

        const comp = /* a component tree... */;

        comp.init();

        // Get a context that will be used by the rendering process.
        let di = getDrawInstance(canvas.width, canvas.height);

        // Optional. This can measure the actual width and height of the components,
        // making it possible to shrink the canvas size to fit the content.
        comp.measure(di, ctx);
        canvas.width = comp.width;
        canvas.height = comp.height;
        di = getDrawInstance(canvas.width, canvas.height); // Renew the draw instance.

        // Draw the components onto the canvas.
        comp.draw(di, ctx);
    </script>
</body>
</html>
```

The usage of the components and functions are written in the doc comments in [`canvasDraw.d.ts`](./canvasDraw.d.ts) file.

## Run the examples

Clone this project, go to the project directory, and then run with:

```python
python -m http.server
```

or any local static server host you like. Switch to `/canvas.html` to see the result,
and click the "Download" button to save it as a `.png` picture.
