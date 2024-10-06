const Modes = {
    Drawing: 'drawing',
    Filling: 'filling'
};
class TouchApi {
    constructor(canvas, delegate, dpi) {
        this.canvas = canvas;
        this.isMousedown = false;
        this.delegate = delegate;
        this.EnableListeners();
        const inchInMeters = 0.0254;
        this.pixelSize = (inchInMeters / dpi) * window.devicePixelRatio;
        this.mode = Modes.Drawing;
        // On an iPad Pro 12.9 2020 with a screen resolution of 264 DPI:
        // 1 pixel = 0.000192424m  1cm = 51.9685034 pixels
        // alert("1 pixel = " + this.pixelSize + "m  1cm = " + (dpi / (100.0 * inchInMeters)) / window.devicePixelRatio + " pixels");
    }

    GetPoint(status, event) {
        const timestamp = Math.round(performance.now());

        // Extract properties from the event object
        let properties = {
            timestamp,
            'pointerId': event.pointerId,
            'pointerType': event.pointerType,
            'isPrimary': event.isPrimary,
            'width': event.width,
            'height': event.height,
            'pressure': event.pressure,
            'tiltX': event.tiltX,
            'tiltY': event.tiltY,
            'tangentialPressure': event.tangentialPressure,
            'twist': event.twist,
            'movementX': event.movementX,
            'movementY': event.movementY,
            'clientX': event.clientX,
            'clientY': event.clientY,
            'screenX': event.screenX,
            'screenY': event.screenY,
            'offsetX': event.offsetX,
            'offsetY': event.offsetY,
            'status': status
        };

        return properties;
    }

    EnableListeners() {
        for (const ev of ["touchstart", "mousedown"]) {
            this.canvas.addEventListener(ev, function (e) {
                e.preventDefault();
                const point = this.GetPoint("start", e);
                this.isMousedown = true;
                if (this.mode == Modes.Drawing) {
                    this.delegate.AddPoint(point);
                }
            }.bind(this), false);
        }

        for (const ev of ['pointermove']) {
            this.canvas.addEventListener(ev, function (e) {
                if (!this.isMousedown) return
                e.preventDefault();
                if (this.mode == Modes.Drawing) {
                    const point = this.GetPoint("move", e);
                    this.delegate.AddPoint(point);
                }
            }.bind(this), false);
        }

        for (const ev of ['touchend', 'touchleave', 'mouseup']) {
            this.canvas.addEventListener(ev, function (e) {
                e.preventDefault();
                this.isMousedown = false;
                const point = this.GetPoint("end", e);
                if (this.mode == Modes.Drawing) {
                    this.delegate.AddPoint(point);
                    let t0 = performance.now();
                    this.delegate.FillInDistantPoints();
                    let t1 = performance.now();
                    logArea.innerHTML = `\nFill-in points time: ${t1 - t0}ms`;
                } else if (this.mode == Modes.Filling) {
                    const p = [point.offsetX, point.offsetY];
                    let t0 = performance.now();
                    const lines = this.delegate.FindIntersections(p[0], p[1]);
                    let t1 = performance.now();
                    logArea.innerHTML += `\nFind Intersections time: ${t1 - t0}ms`;
                    let showIntersectionLines = false;
                    if (showIntersectionLines) {
                        t0 = performance.now();
                        this.delegate.DrawIntersectionLines(lines.xLines, lines.yLines);
                        t1 = performance.now();
                        logArea.innerHTML += `\nDraw Intersection Lines time: ${t1 - t0}ms`;
                    }
                    const windingNumbers = this.delegate.GetWindingNumbers(lines.xLines, lines.yLines, p);
                    console.log(windingNumbers);
                    const colorIndex = Math.abs(windingNumbers[0]) % this.delegate.ColorPaletteRGB.length;
                    this.delegate.Fill(p, this.delegate.ColorPaletteRGB[colorIndex]);

                }
            }.bind(this), false);
        }
    }
}
