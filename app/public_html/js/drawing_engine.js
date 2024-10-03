class DrawingEngine {
    constructor(canvas, websocket) {
        this.context = canvas.getContext('2d', { willReadFrequently: true });
        this.strokes = [];
        this.points = [];
        this.websocket = websocket;
        this.canvas = canvas;
        this.previousPoint = undefined;
        this.lineColorRGB = [16, 16, 16];
        this.lineColor = this.RGBtoHexString(this.lineColorRGB);
        this.currentImageData = undefined;
    }
    RGBtoHexString(color) {
        return `#${color[0].toString(16)}${color[1].toString(16)}${color[2].toString(16)}`;
    }
    DrawSquare(center, size, color) {
        let s = size / 2;
        this.context.fillStyle = color;
        this.context.fillRect(center[0] - s, center[1] - s, size, size);
    }
    DrawVector(vector, origin, length, width, color) {
        // set line stroke and line width
        this.context.strokeStyle = color;
        this.context.lineWidth = width;

        // draw a line
        this.context.beginPath();
        this.context.moveTo(origin[0], origin[1]);
        if (length == 0) {
            this.context.lineTo(vector[0], vector[1]);
        } else {
            this.context.lineTo(origin[0] + vector[0] * length, origin[1] + vector[1] * length);
        }

        this.context.stroke();
    }
    AddPoint(point, color = this.lineColor) {
        if (point.status === 'error') return;
        this.points.push(point);

        if (point.status === 'end') {
            color = "#ff0000";
            this.strokes.push(this.points);
            this.points = [];
        }

        if (point.status === 'start') {
            color = "#00ff00";
            this.previousPoint = undefined;
        }

        const screenCoords = [point.offsetX, point.offsetY];

        if (this.previousPoint) {
            this.DrawVector(screenCoords, [this.previousPoint.offsetX, this.previousPoint.offsetY], 0, 3, color);
        }
        this.DrawSquare(screenCoords, point.pressure * 3, color);
        this.previousPoint = point;
        if (this.websocket) {
            this.websocket.Send(point);
        }
        logArea.innerHTML = JSON.stringify(point);
    }
    GetColorIndicesForCoord = (x, y) => {
        if (x > 0 && x < this.canvas.width && y > 0 && y < this.canvas.height) {
            const i = y * (this.canvas.width * 4) + x * 4;
            return [i, i + 1, i + 2, i + 3];
        }
        console.error(`Coordinates out of image bounds: [${x},${y}]`);
        return undefined;
    }
    ColorPixelIs(x, y, color) {
        const indices = this.GetColorIndicesForCoord(x, y);
        if (indices !== undefined) {
            const pixelColor = [this.currentImageData[indices[0]], this.currentImageData[indices[1]], this.currentImageData[indices[2]]];
            if (
                pixelColor[0] === color[0] &&
                pixelColor[1] === color[1] &&
                pixelColor[2] === color[2]
            ) {
                return true;
            }
        }
        //console.error('color pixel is undefined');
        return false;
    }
    Fill(point, color = [0, 128, 250]) {
        const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
        this.currentImageData = imageData.data;

        const p = [point.offsetX, point.offsetY];
        this.FillPixel([p[0], p[1]], color);
        this.context.putImageData(imageData, 0, 0);
    }
    TryToFillPixel(newPoint, color) {
        if (this.ColorPixelIs(newPoint[0], newPoint[1], this.lineColorRGB) === false &&
            this.ColorPixelIs(newPoint[0], newPoint[1], color) === false) {
            this.FillPixel([newPoint[0], newPoint[1]], color);
        }
    }
    FillPixel(point, color) {
        if (this.ColorPixelIs(point[0], point[1], this.lineColorRGB) === false &&
            this.ColorPixelIs(point[0], point[1], color) === false) {
            const indices = this.GetColorIndicesForCoord(point[0], point[1]);
            //console.log(`[${point[0]},${point[1]}]`);
            this.currentImageData[indices[0]] = color[0];
            this.currentImageData[indices[1]] = color[1];
            this.currentImageData[indices[2]] = color[2];
            this.currentImageData[indices[3]] = 255;

            this.TryToFillPixel([point[0], point[1] - 1], color);
            this.TryToFillPixel([point[0], point[1] + 1], color);
            this.TryToFillPixel([point[0] - 1, point[1]], color);
            this.TryToFillPixel([point[0] + 1, point[1]], color);
        }
    }
}
