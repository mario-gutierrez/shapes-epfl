class DrawingEngine {
    constructor(canvas, websocket) {
        this.context = canvas.getContext('2d', { willReadFrequently: true });
        this.strokes = [];
        this.points = [];
        this.websocket = websocket;
        this.canvas = canvas;
        this.previousPoint = undefined;
        this.lineColorRGB = [10, 10, 11, 255];
        this.lineColor = this.RGBtoHexString(this.lineColorRGB);
        this.currentImageData = undefined;
    }
    RGBtoHexString(color) {
        const getHexString = (n) => {
            return (n < 16 ? '0' : '') + n.toString(16);
        }
        return `#${getHexString(color[0])}${getHexString(color[1])}${getHexString(color[2])}${getHexString(color[3])}`;
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
            this.DrawVector(screenCoords, [this.previousPoint.offsetX, this.previousPoint.offsetY], 0, 3, this.lineColor);
        }
        this.DrawSquare(screenCoords, point.pressure * 3, color);
        this.previousPoint = point;
        if (this.websocket) {
            this.websocket.Send(point);
        }
        logArea.innerHTML = JSON.stringify(point);
    }
    GetColorIndicesForCoord = (p) => {
        const x = p[0];
        const y = p[1];
        if (x > 0 && x < this.canvas.width && y > 0 && y < this.canvas.height) {
            const i = y * (this.canvas.width * 4) + x * 4;
            return [i, i + 1, i + 2, i + 3];
        }
        //console.error(`Coordinates out of image bounds: [${x},${y}]`);
        return [];
    }
    ColorPixelIs(p, color) {
        const indices = this.GetColorIndicesForCoord(p);
        if (indices.length == 4) {
            const pixelColor = [this.currentImageData[indices[0]], this.currentImageData[indices[1]], this.currentImageData[indices[2]]];

            const dist = Math.hypot(pixelColor[0] - color[0], pixelColor[1] - color[1], pixelColor[2] - color[2]);
            if (dist < 15) {
                return 1;
            }
            return 0;
        }
        console.error('color pixel is undefined');
        return 2;
    }
    Fill(point, color = [0, 128, 250]) {
        const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
        this.currentImageData = imageData.data;

        const p = [point.offsetX, point.offsetY];

        const pointsStack = [];
        pointsStack.push(p);

        while (pointsStack.length > 0) {
            const p = pointsStack.pop();
            if (this.FillPixel(p, color)) {

                let newPoint = [p[0], p[1] - 1];
                if (this.GetColorIndicesForCoord(newPoint).length == 4) {
                    pointsStack.push(newPoint);
                }

                newPoint = [p[0], p[1] + 1];
                if (this.GetColorIndicesForCoord(newPoint).length == 4) {
                    pointsStack.push(newPoint);
                }

                newPoint = [p[0] - 1, p[1]];
                if (this.GetColorIndicesForCoord(newPoint).length == 4) {
                    pointsStack.push(newPoint);
                }

                newPoint = [p[0] + 1, p[1]];
                if (this.GetColorIndicesForCoord(newPoint).length == 4) {
                    pointsStack.push(newPoint);
                }
            }
        }

        this.context.putImageData(imageData, 0, 0);
    }
    PixelShouldBeFilled(newPoint, color) {
        if (this.ColorPixelIs(newPoint, this.lineColorRGB) === 0 &&
            this.ColorPixelIs(newPoint, color) === 0) {
            return true;
        }
        return false;
    }
    FillPixel(point, color) {
        if (this.PixelShouldBeFilled(point, color)) {
            const indices = this.GetColorIndicesForCoord(point);
            //console.log(`[${point[0]},${point[1]}]`);
            this.currentImageData[indices[0]] = color[0];
            this.currentImageData[indices[1]] = color[1];
            this.currentImageData[indices[2]] = color[2];
            this.currentImageData[indices[3]] = 255;
            return true;
        }
        return false;
    }
}
