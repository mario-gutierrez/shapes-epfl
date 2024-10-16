class DrawingEngine {
    constructor(canvas, websocket) {
        this.context = canvas.getContext('2d', { willReadFrequently: true });
        this.points = [];
        this.websocket = websocket;
        this.canvas = canvas;
        this.previousPoint = undefined;
        this.lineAlphaValue = 255;
        this.lineColorRGB = [1, 1, 1, this.lineAlphaValue];
        this.lineColor = this.RGBtoHexString(this.lineColorRGB);
        this.colorSimilarityThreshold = 10;
        this.maxLineWidth = 10;
        this.minLineWidth = 3;
        this.maxDrawingMovement = 100;
        this.imageData = undefined;
        this.currentImageData = undefined;
        this.ColorPaletteRGB = [
            [239, 71, 111, 255],
            [255, 209, 102, 255],
            [6, 214, 160, 255],
            [17, 138, 178, 255],
            [7, 59, 76, 255]
        ];
        this.showIntersectionLines = false;
    }
    RGBtoHexString(color) {
        const getHexString = (n) => {
            return (n < 16 ? '0' : '') + n.toString(16);
        }
        return `#${getHexString(color[0])}${getHexString(color[1])}${getHexString(color[2])}${getHexString(color[3])}`;
    }
    Clear() {
        //clear setting alpha to 0
        this.DrawSquare([this.canvas.clientWidth / 2, this.canvas.clientHeight / 2],
            Math.max(this.canvas.clientWidth, this.canvas.clientHeight),
            "#ffffff00");
    }
    DrawSquare(center, size, color) {
        let s = size / 2;
        this.context.fillStyle = color;
        this.context.fillRect(center[0] - s, center[1] - s, size, size);
    }
    DrawCircle(center, size, color) {
        let s = size / 2;
        this.context.fillStyle = color;
        this.context.beginPath();
        this.context.arc(center[0], center[1], s, 0, 2 * Math.PI);
        this.context.fill();
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
    DrawLineSegments(color) {
        const screenCoords = this.points[this.points.length - 1].p;
        if (this.previousPoint) {
            this.DrawVector(screenCoords, this.previousPoint.p, 0, this.minLineWidth, color);
        }
        this.DrawCircle(screenCoords, this.minLineWidth, color);
    }
    DrawQuadraticBezier(color) {
        this.context.strokeStyle = color;
        this.context.lineCap = 'round';
        this.context.lineJoin = 'round';

        const l = this.points.length - 1;
        if (this.points.length >= 3) {
            const xc = (this.points[l].p[0] + this.points[l - 1].p[0]) / 2;
            const yc = (this.points[l].p[1] + this.points[l - 1].p[1]) / 2;
            this.context.lineWidth = this.minLineWidth;
            this.context.quadraticCurveTo(this.points[l - 1].p[0], this.points[l - 1].p[1], xc, yc);
            this.context.stroke();
            this.context.beginPath();
            this.context.moveTo(xc, yc);
        } else {
            const point = this.points[l].p;
            this.context.lineWidth = this.minLineWidth;
            this.context.strokeStyle = color;
            this.context.beginPath();
            this.context.moveTo(point[0], point[1]);
            this.context.stroke();
        }
    }
    AddPoint(point, status, color = this.lineColor) {
        if (status === 'error') return;
        if (status === 'end') {
            if (!point.isFromLogFile) {
                this.websocket.Send(this.points);
                this.websocket.Send({ ctrl: "close_log" });
            }
        }

        if (status === 'start') {
            this.points = [];
            this.previousPoint = undefined;
            if (!point.isFromLogFile) {
                this.websocket.Send({ ctrl: "new_log" });
            }
        }
        this.points.push(point);
        this.DrawQuadraticBezier(color);
        this.previousPoint = point;
        //logArea.innerHTML = JSON.stringify(point);
    }
    CoordinatesAreWithinCanvas(x, y) {
        return (x >= 0 && x < this.canvas.width && y >= 0 && y < this.canvas.height);
    }
    GetColorIndicesForCoord = (p) => {
        const x = p[0];
        const y = p[1];
        if (this.CoordinatesAreWithinCanvas(x, y)) {
            const i = y * (this.canvas.width * 4) + x * 4;
            return [i, i + 1, i + 2, i + 3];
        }
        //console.error(`Coordinates out of image bounds: [${x},${y}]`);
        return [];
    }
    ShouldFillPixel(indices, color) {
        if (indices.length === 4) {
            const alpha = this.currentImageData[indices[3]];
            if (alpha === 0) {
                return 1; // color needs to be filled, it was not painted before
            }
            // if (alpha <= this.lineAlphaValue) {
            //     return 0; // pixel should not be filled, it's part of a line
            // }
            const pixelColor = [this.currentImageData[indices[0]], this.currentImageData[indices[1]], this.currentImageData[indices[2]]];

            const distToLineColor = Math.hypot(pixelColor[0] - this.lineColorRGB[0], pixelColor[1] - this.lineColorRGB[1], pixelColor[2] - this.lineColorRGB[2]);
            if (distToLineColor < this.colorSimilarityThreshold) {
                return 0;
            }
            const distToColor = Math.hypot(pixelColor[0] - color[0], pixelColor[1] - color[1], pixelColor[2] - color[2]);
            if (distToColor < this.colorSimilarityThreshold) {
                return 0;
            }

            return 1;
        }
        console.error('color pixel is undefined');
        return 2;
    }
    Fill(point, color) {
        const pointsStack = [];
        pointsStack.push(point);
        while (pointsStack.length > 0) {
            const p = pointsStack.pop();
            const pixelInfo = this.FillPixel(p, color);
            if (pixelInfo.shouldBeFilled) {

                let x = p[0];
                let y = p[1] - 1;
                if (this.CoordinatesAreWithinCanvas(x, y)) {
                    pointsStack.push([x, y]);
                }
                x = p[0];
                y = p[1] + 1;
                if (this.CoordinatesAreWithinCanvas(x, y)) {
                    pointsStack.push([x, y]);
                }

                x = p[0] - 1;
                y = p[1];
                if (this.CoordinatesAreWithinCanvas(x, y)) {
                    pointsStack.push([x, y]);
                }

                x = p[0] + 1;
                y = p[1];
                if (this.CoordinatesAreWithinCanvas(x, y)) {
                    pointsStack.push([x, y]);
                }
            }
        }
    }
    FillPixel(point, color) {
        let shouldBeFilled = false;
        const indices = this.GetColorIndicesForCoord(point);
        if (this.ShouldFillPixel(indices, color) === 1) {
            this.currentImageData[indices[0]] = color[0];
            this.currentImageData[indices[1]] = color[1];
            this.currentImageData[indices[2]] = color[2];
            this.currentImageData[indices[3]] = 255;
            shouldBeFilled = true;
        }
        return { shouldBeFilled, indices };
    }

    FillInDistantPoints(drawAddedPoints = false) {
        for (let i = 0; i < this.points.length - 1; i++) {
            const p0 = this.points[i].p;
            const p1 = this.points[i + 1].p;
            const step = 2;
            const distance = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
            if (distance >= step * 2) {
                const dx = p1[0] - p0[0];
                const dy = p1[1] - p0[1];

                if (Math.abs(dx) > step * 2 && Math.abs(dy) > step * 2) {
                    const slope = dy / dx;
                    if (Math.abs(slope) > 0) {
                        let newIndex = i;
                        const steps = Math.round(Math.abs(dx) / step);
                        for (let j = 1; j <= steps; j++) {
                            const x = (dx > 0 ? 1 : -1) * step * j;
                            const p = { p: [p0[0] + x, Math.floor(p0[1] + x * slope)] };
                            newIndex = i + j;
                            this.points.splice(newIndex, 0, p);
                            if (drawAddedPoints) {
                                this.DrawSquare(p.p, step / 2, '#00ff00');
                            }
                        }
                        i = newIndex;
                    }
                }
                else if (Math.abs(dy) >= Math.abs(dx)) {
                    let newIndex = i;
                    const steps = Math.round(Math.abs(dy) / step);
                    const deltaX = dx / steps;
                    for (let j = 1; j < steps; j++) {
                        const y = (dy > 0 ? 1 : -1) * step * j;
                        const p = { p: [Math.round(p0[0] + deltaX * j), p0[1] + y] };
                        newIndex = i + j;
                        this.points.splice(newIndex, 0, p);
                        if (drawAddedPoints) {
                            this.DrawSquare(p.p, step / 2, '#00ff00');
                        }
                    }
                    i = newIndex;
                }
                else {
                    let newIndex = i;
                    const steps = Math.round(Math.abs(dx) / step);
                    const deltaY = dy / steps;
                    for (let j = 1; j < steps; j++) {
                        const x = (dx > 0 ? 1 : -1) * step * j;
                        const p = { p: [p0[0] + x, Math.round(p0[1] + deltaY * j)] };
                        newIndex = i + j;
                        this.points.splice(newIndex, 0, p);
                        if (drawAddedPoints) {
                            this.DrawSquare(p.p, step / 2, '#00ff00');
                        }
                    }
                    i = newIndex;
                }
            }
        }
    }
    FindIntersections(x, y, drawIntersectionPoints = false) {
        const intersectionDelta = 3;
        const intersections = [[], []];
        const lines = [[], []];

        for (let i = 0; i < this.points.length; i++) {
            const p = this.points[i].p;
            if (p[1] <= y && Math.abs(p[0] - x) < intersectionDelta) {
                intersections[0].push(i);
                if (drawIntersectionPoints) {
                    this.DrawSquare(p, this.minLineWidth, '#ff0000');
                }
            }

            if (p[0] <= x && Math.abs(p[1] - y) < intersectionDelta) {
                intersections[1].push(i);
                if (drawIntersectionPoints) {
                    this.DrawSquare(p, this.minLineWidth, '#00ff00');
                }
            }
        }

        for (let c = 0; c < 2; c++) {
            let currentLine = [];
            for (let i = 0; i < intersections[c].length; i++) {
                if (currentLine.length == 0) {
                    currentLine.push(intersections[c][i]);
                } else if ((intersections[c][i] - intersections[c][i - 1]) > 1) {
                    const previousIndex = intersections[c][i - 1];
                    currentLine.push(previousIndex + 1);
                    lines[c].push(currentLine);
                    currentLine = [intersections[c][i]];
                }
            }
            if (currentLine.length == 1 && intersections[c][intersections[c].length - 1] < this.points.length) {
                const previousIndex = intersections[c][intersections[c].length - 1];
                currentLine.push(previousIndex);
            } else if (intersections[c].length > 1) {
                currentLine = [currentLine[0] - 1, currentLine[0]];
            }
            if (currentLine.length > 0) {
                lines[c].push(currentLine);
            }
        }

        return { xLines: lines[0], yLines: lines[1] };
    }
    DrawIntersectionLines(xLines, yLines) {
        console.log('xLines:');
        console.log(xLines);
        console.log('yLines:');
        console.log(yLines);
        const lines = [xLines, yLines];
        const lineColor = ['#ff1000', '#10ff0a'];

        for (let c = 0; c < 2; c++) {
            for (let i = 0; i < lines[c].length; i++) {
                const line = lines[c][i];
                if (line.length > 1) {
                    const p0 = this.points[line[0]].p;
                    const p1 = this.points[line[1]].p;
                    const dx = p1[0] - p0[0];
                    const dy = p1[1] - p0[1];
                    const l = Math.hypot(dx, dy);
                    const norm = [dx / l, dy / l];
                    const p = [norm[0] * 10 + p0[0], norm[1] * 10 + p0[1]];
                    this.DrawVector(p, p0, 0, 2, lineColor[c]);
                    this.DrawSquare(p, 5, lineColor[c]);
                }
            }
        }
    }

    GetWindingNumbers(xLines, yLines, point) {
        if (!xLines || !yLines) { return [0, 0] };

        const lines = [xLines, yLines];
        const windingNumbers = [[], []];
        for (let coord = 0; coord < lines.length; coord++) {
            const lineSet = lines[coord];
            const linePoints = [];
            const label = coord == 0 ? 'x' : 'y';
            //console.log(`${label} lines:`);
            for (let lineIndx = 0; lineIndx < lineSet.length; lineIndx++) {
                const line = lineSet[lineIndx];
                //console.log(`line indices: ${line}`);
                try {
                    const p0 = this.points[line[0]].p;
                    const p1 = this.points[line[1]].p;
                    //console.log(`points: ${p0} ${p1}`);
                    const curveSign = p1[coord] >= p0[coord] ? -1 : 1;
                    windingNumbers[coord].push(curveSign * (coord == 1 ? -1 : 1));
                } catch (e) {
                    console.error(e);
                }
            }
        }
        return windingNumbers;
    }
    MyModulo(a, b) {
        return (a % b + b) % b;
    }
    FillInArea(p) {
        let t0 = performance.now();
        const lines = this.FindIntersections(p[0], p[1]);
        let t1 = performance.now();
        //logArea.innerHTML += `\nFind Intersections time: ${t1 - t0}ms`;

        if (this.showIntersectionLines) {
            t0 = performance.now();
            this.DrawIntersectionLines(lines.xLines, lines.yLines);
            t1 = performance.now();
            //logArea.innerHTML += `\nDraw Intersection Lines time: ${t1 - t0}ms`;
        }

        const windingNumbers = this.GetWindingNumbers(lines.xLines, lines.yLines, p);
        console.log('winding numbers:')
        console.log(windingNumbers);
        const index = windingNumbers[0].length < windingNumbers[1].length ? 0 : 1;
        let colorIndex = 0;
        for (let i = 0; i < windingNumbers[index].length; i++) {
            colorIndex += windingNumbers[index][i];
        }

        colorIndex = this.MyModulo(colorIndex, this.ColorPaletteRGB.length);
        console.log(`color index: ${colorIndex}`);
        this.DrawCircle(p, 10, this.RGBtoHexString(this.ColorPaletteRGB[colorIndex]));
        this.Fill(p, this.ColorPaletteRGB[colorIndex]);

    }
    FillInCanvas() {
        let t0 = performance.now();
        this.LoadImageData();
        const horizontalStride = this.canvas.width * 4;
        const seedPoints = [];

        const getIndex = (x, y) => {
            return (horizontalStride * y + x * 4);
        }

        const tryToFillArea = (x, y, step) => {
            if (this.currentImageData[getIndex(x, y) + 3] === 0) {
                let alphaSum = 0;
                for (let col = x - step; col < x + step; col++) {
                    for (let row = y - step; row < y + step; row++) {
                        const alphaIndex = getIndex(col, row) + 3;
                        if (alphaIndex >= 0 && alphaIndex < this.currentImageData.length) {
                            alphaSum += this.currentImageData[alphaIndex];
                        }
                    }
                }
                if (alphaSum === 0) {
                    console.log(`fill in area: ${x},${y}`);
                    seedPoints.push([x, y]);
                    this.FillInArea([x, y]);
                }
            }
        }

        let step = 4;
        let areaSide = 3;

        for (let x = step; x < this.canvas.width; x += step) {
            for (let y = step; y < this.canvas.height; y += step) {
                tryToFillArea(x, y, areaSide);
            }
        }

        step = 1;
        areaSide = 2;
        for (let x = step; x < this.canvas.width; x += step) {
            for (let y = step; y < this.canvas.height; y += step) {
                tryToFillArea(x, y, areaSide);
            }
        }

        this.UpdateImageData();
        // Show seed points after full coloring
        // for (let i = 0; i < seedPoints.length; i++) {
        //     this.DrawCircle(seedPoints[i], 5, '#00ff00');
        // }
        let t1 = performance.now();
        console.log(`Full Canvas Coloring time: ${t1 - t0}ms`);
    }
    LoadImageData() {
        this.imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
        this.currentImageData = this.imageData.data;
    }
    UpdateImageData() {
        this.context.putImageData(this.imageData, 0, 0);
    }
}
