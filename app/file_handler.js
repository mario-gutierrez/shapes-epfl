class FileHandler {
    constructor() {
        this.LogSettings = {
            pathToLogFile: "public_html/data/",
            fileName: "shapes_",
            fileExtension: ".json",
            currentSessionId: "-"
        };
        this.stream = null;
    }

    // Calls saveCurrentLog to close the open file
    closeLogFile() {
        this.saveCurrentLog();
    }

    // Closes the currently open file by closing the stream
    saveCurrentLog() {
        if (this.stream) {
            this.stream.end();
            this.stream = null;
        }
    }

    // Append one line to log file
    log(data) {
        if (this.stream) {
            this.stream.write(data + "\n");
        }
    }

    logFileIsOpen() {
        return this.stream ? true : false;
    }

    paddNumber(n) { return n > 9 ? ("" + n) : ("0" + n); }

    // Open write stream to persist data
    openLogFile() {
        const fs = require('fs');
        const currentdate = new Date();
        let dateString = currentdate.getFullYear() + "." +
            this.paddNumber(currentdate.getMonth() + 1) + "." +
            this.paddNumber(currentdate.getDate()) + "_" +
            this.paddNumber(currentdate.getHours()) + "." +
            this.paddNumber(currentdate.getMinutes()) + "." +
            this.paddNumber(currentdate.getSeconds()) + "." +
            this.paddNumber(currentdate.getMilliseconds());
        let pathToSavedLogFile = this.LogSettings.pathToLogFile + this.LogSettings.fileName + dateString + this.LogSettings.fileExtension;
        this.stream = fs.createWriteStream(pathToSavedLogFile, {
            flags: 'a'
        });
        console.log(`Writing file: ${pathToSavedLogFile}`);
    }

    // Get a list of files in path
    getFilesList(dirPath, callback) {
        const fs = require("fs");

        let filesList = {
            "m": "GetLogs",
            "dir": dirPath,
            "files": []
        };

        const fileExtension = this.LogSettings.fileExtension;
        fs.readdir(dirPath, function (err, files, self) {
            if (err) {
                console.log("error listing from: " + dirPath);
                filesList.msg = "Error getting directory information";
            } else {
                files.forEach(function (file) {
                    if (file.includes(fileExtension)) {
                        filesList.files.push(file);
                    }
                });
            }
            callback(filesList);
        });
    }

    readLogFile(filename, onReadLine, onEndOfFile, onError) {
        const lineReader = require('line-reader');
        try {
            // read all lines:
            lineReader.eachLine(this.LogSettings.pathToLogFile + filename, function (line, last) {
                onReadLine(line);
                if (last) {
                    onEndOfFile(filename);
                    return false; // stop reading
                }
            });
        } catch (e) {
            onError(e);
        }

    }
}

module.exports = FileHandler;
