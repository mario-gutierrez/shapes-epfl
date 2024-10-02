class DrawingEngine {
    constructor(canvas, websocket) {
        this.context = canvas.getContext('2d');
        this.strokes = [];
        this.points = [];
        this.websocket = websocket;
        this.canvas = canvas;
        this.previousPoint = undefined;
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
    AddPoint(point, color = "#101010") {
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
}
