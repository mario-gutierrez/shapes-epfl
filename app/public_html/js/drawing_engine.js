class DrawingEngine {
    constructor(canvas, websocket) {
        this.context = canvas.getContext('2d');
        this.strokes = [];
        this.points = [];
        this.websocket = websocket;
        this.canvas = canvas;
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
        }

        this.DrawSquare(point.screenCoords, point.pressure * 10.0, color);
        if (this.websocket) {
            this.websocket.Send(point);
        }
    }
    DrawImage(imageUrl, callback = () => { }) {
        const image = new Image(this.canvas.width, this.canvas.height);
        const canvasCtx = this.context;
        // Draw when image has loaded
        image.onload = () => {
            canvasCtx.drawImage(image, 0, 0);
            callback();
        };
        image.src = imageUrl;
    }
}
