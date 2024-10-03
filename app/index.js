const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const FileHandler = require("./file_handler.js");
const Logger = require("./data_logger");
const WebsocketServer = require("./ws_server");
const IP = require('ip');

const fileHandlerTablet = new FileHandler();
const filePrefix = "stylus_";
const loggerTablet = new Logger(fileHandlerTablet, filePrefix);

const wsServer = new WebsocketServer(3030, (data) => {
    loggerOculus.logData(data);
});

app.use(express.static(__dirname + '/public_html'));

const dataFolder = __dirname + '/public_html/data/';
const fs = require('fs');

function getFilesList(socket) {
    let tabletFiles = [];
    let oculusFiles = [];
    fs.readdir(dataFolder, (err, files) => {
        files.forEach(file => {
            if (file.includes(filePrefix)) {
                tabletFiles.push(file);
            }
        });
        socket.emit('log_msg', { description: "list_files", tabletFiles });
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
                loggerTablet.startLog();
            }
            if (msg.ctrl === 'close_log') {

                loggerTablet.stopLog();
            }
            if (msg.ctrl === 'list_files') {
                let files = getFilesList(socket);
            }
        } else {
            loggerTablet.logData(JSON.stringify(msg));
        }
    });
});

http.listen(3000, () => {
    console.log('Stylus logger running on ' + IP.address() + ' 3000');
});
