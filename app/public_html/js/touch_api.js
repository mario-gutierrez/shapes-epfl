class TouchApi {
    constructor(canvas, delegate, dpi) {
        this.canvas = canvas;
        this.isMousedown = false;
        this.delegate = delegate;
        this.EnableListeners();
        const inchInMeters = 0.0254;
        this.pixelSize = (inchInMeters / dpi) * window.devicePixelRatio;
        // On an iPad Pro 12.9 2020 with a screen resolution of 264 DPI:
        // 1 pixel = 0.000192424m  1cm = 51.9685034 pixels
        // alert("1 pixel = " + this.pixelSize + "m  1cm = " + (dpi / (100.0 * inchInMeters)) / window.devicePixelRatio + " pixels");
    }

    GetPoint(status, e) {
        const timestamp = Math.round(performance.now() * 1000000);
        let pressure = 0.1;
        let x, y;
        let altitude = 0;
        let azimuth = 0;
        const rect = this.canvas.getBoundingClientRect();
        if (e.touches && e.touches[0] && typeof e.touches[0]["force"] !== "undefined") {
            if (e.touches[0]["force"] > 0) {
                pressure = e.touches[0]["force"];
            }
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
            altitude = e.touches[0].altitudeAngle;
            azimuth = e.touches[0].azimuthAngle;
        } else {
            pressure = 1.0;
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }
        if (x & y) {
            x = Math.floor(x);
            y = Math.floor(y);
        } else {
            x = 0;
            y = 0;
            status = "error";
        }
        const position = [x * this.pixelSize, y * this.pixelSize, 0];
        const screenCoords = [x, y]
        return { timestamp, position, screenCoords, pressure, altitude, azimuth, status }
    }

    EnableListeners() {
        for (const ev of ["touchstart", "mousedown"]) {
            this.canvas.addEventListener(ev, function (e) {
                const point = this.GetPoint("start", e);
                this.isMousedown = true;
                this.delegate.AddPoint(point);
            }.bind(this), false);
        }

        for (const ev of ['touchmove', 'mousemove']) {
            this.canvas.addEventListener(ev, function (e) {
                if (!this.isMousedown) return
                e.preventDefault();
                const point = this.GetPoint("move", e);
                this.delegate.AddPoint(point);
            }.bind(this), false);
        }

        for (const ev of ['touchend', 'touchleave', 'mouseup']) {
            this.canvas.addEventListener(ev, function (e) {
                this.isMousedown = false;
                const point = this.GetPoint("end", e);
                this.delegate.AddPoint(point);
            }.bind(this), false);
        }
    }
}
