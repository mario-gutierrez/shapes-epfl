class WebsocketServer {
    constructor(port, ProcessData) {

        this.port = port;
        this.ProcessData = ProcessData;

        const xpress = require('express');
        const { createServer } = require('http');
        const WebSocket = require('ws');
        const app = xpress();
        const server = createServer(app);
        const wss = new WebSocket.Server({ server });

        wss.on('connection', function (ws) {
            console.log("Websocket client joined.");

            ws.on('message', function (data) {
                this.ProcessData(data);
            }.bind(this));

            ws.on('close', function () {
                console.log("Websocket client left.");
            });
        }.bind(this));

        server.listen(this.port, function () {
            console.log(`Websocket server listening on :${this.port}`);
        }.bind(this));
    }
}


module.exports = WebsocketServer;
