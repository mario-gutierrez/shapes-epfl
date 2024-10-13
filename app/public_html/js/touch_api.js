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

    GetPoint(event) {
        const ts = Math.round(performance.now());

        // Extract properties from the event object
        let properties = {
            ts,
            'p': [event.offsetX, event.offsetY]
        };

        return properties;
    }

    EnableListeners() {
        for (const ev of ["touchstart", "mousedown"]) {
            this.canvas.addEventListener(ev, function (e) {
                e.preventDefault();
                const point = this.GetPoint(e);
                this.isMousedown = true;
                if (this.mode == Modes.Drawing) {
                    this.delegate.AddPoint(point, "start");
                }
            }.bind(this), false);
        }

        for (const ev of ['pointermove']) {
            this.canvas.addEventListener(ev, function (e) {
                if (!this.isMousedown) {
                    const point = this.GetPoint(e);
                    console.log(`hover: ${point.p[0]},${point.p[1]}`);
                    return;
                }
                e.preventDefault();
                if (this.mode == Modes.Drawing) {
                    const point = this.GetPoint(e);
                    this.delegate.AddPoint(point, "move");
                }
            }.bind(this), false);
        }

        for (const ev of ['touchend', 'touchleave', 'mouseup']) {
            this.canvas.addEventListener(ev, function (e) {
                e.preventDefault();
                this.isMousedown = false;
                const point = this.GetPoint(e);
                if (this.mode == Modes.Drawing) {
                    this.delegate.AddPoint(point, "end");
                    let t0 = performance.now();
                    this.delegate.FillInDistantPoints();
                    let t1 = performance.now();
                    //logArea.innerHTML = `\nFill-in points time: ${t1 - t0}ms`;
                    this.delegate.FillInCanvas();
                    this.mode == Modes.Filling;
                } else if (this.mode == Modes.Filling) {
                    console.log(`touch: ${point.p[0]},${point.p[1]}`);
                    this.delegate.FillInArea(point.p);
                }
            }.bind(this), false);
        }
    }
}
