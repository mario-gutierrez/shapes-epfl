class DataLogger {
    constructor(logger, filePrefix) {
        this.separator = "";
        this.logger = logger;
        this.logger.LogSettings.fileName = filePrefix;
    }

    startLog() {
        this.logger.openLogFile();
        this.logger.log("[");
        this.separator = "";
    }

    logData(data) {
        this.logger.log(this.separator + data);
        this.separator = ",";
    }

    stopLog() {
        this.logger.log("]");
        this.logger.closeLogFile();
    }

    logFileIsOpen() {
        return this.logger.logFileIsOpen();
    }
}


module.exports = DataLogger;
