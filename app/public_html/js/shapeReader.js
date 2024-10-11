function DrawShape(drawingEngine, shape) {
    drawingEngine.Clear();
    if (shape.length > 0) {
        shape[0].isFromLogFile = true;
        drawingEngine.AddPoint(shape[0], 'start');
        for (let i = 1; i < shape.length - 1; i++) {
            drawingEngine.AddPoint(shape[i], 'move');
        }
        shape[shape.length - 1].isFromLogFile = true;
        drawingEngine.AddPoint(shape[shape.length - 1], 'end');
        let t0 = performance.now();
        drawingEngine.FillInDistantPoints();
        let t1 = performance.now();
        console.log(`Fill-in points time: ${t1 - t0}ms`);
        t0 = performance.now();
        drawingEngine.FillInCanvas();
        t1 = performance.now();
        console.log(`Fill in Canvas time: ${t1 - t0}ms`);
    }
}
