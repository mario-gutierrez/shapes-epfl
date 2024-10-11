const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const FileHandler = require("./file_handler.js");
const Logger = require("./data_logger");
const WebsocketServer = require("./ws_server");
const httpPort = 3000;
const wsPort = 3030;
const fileHandler = new FileHandler();
const filePrefix = "shapes_";
const logger = new Logger(fileHandler, filePrefix);

const wsServer = new WebsocketServer(wsPort, (data) => {
    loggerOculus.logData(data);
});

app.use(express.static(__dirname + '/public_html'));
// Middleware to parse incoming JSON requests
app.use(express.json());

const dataFolder = __dirname + '/public_html/data/';
const fs = require('fs');

function getFilesList(socket) {
    let files = [];
    fs.readdir(dataFolder, (err, files) => {
        files.forEach(file => {
            if (file.includes(filePrefix)) {
                files.push(file);
            }
        });
        socket.emit('log_msg', { description: "list_files", files });
    });
}

io.on('connection', (socket) => {
    console.log(`${socket.id} connected`);
    socket.broadcast.emit('log_msg', { nickname: socket.id, txt: socket.id + " joined" });
    socket.on('disconnect', () => {
        console.log(`${socket.id} disconnected`);
    });
    socket.on('log_msg', (msg) => {
        if (msg.ctrl) {
            if (msg.ctrl === 'new_log') {
                logger.startLog();
            }
            if (msg.ctrl === 'close_log') {

                logger.stopLog();
            }
            if (msg.ctrl === 'list_files') {
                let files = getFilesList(socket);
            }
        } else {
            logger.logData(JSON.stringify(msg));
        }
    });
});

app.post('/api', (req, res) => {
    console.log(req.body);

    try {
        const { shapeName } = req.body;

        // Log the received value
        console.log("Shape requested:", shapeName);

        // Send a response back
        const fullPathToShape = dataFolder + shapeName;
        const data = fileHandler.readJsonFile(fullPathToShape);
        if (data) {
            res.json({
                message: 'shape retrieved successfully',
                data: data
            });
        } else {
            res.json({ message: `unable to retrieve file: ${fullPathToShape}` })
        }

    } catch (e) {
        console.error(e.message);
        res.json({
            message: e.message,
            body: req.body
        });
    }
});

http.listen(httpPort, () => {
    var os = require('os');
    var ip = '0.0.0.0';
    var ips = os.networkInterfaces();
    Object
        .keys(ips)
        .forEach(function (_interface) {
            ips[_interface]
                .forEach(function (_dev) {
                    if (_dev.family === 'IPv4' && !_dev.internal) ip = _dev.address
                })
        });
    console.log(`Server running on ${ip}:${httpPort}`);
});
