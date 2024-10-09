class DataLogger {
    constructor(logger, filePrefix) {
        this.logger = logger;
        this.logger.LogSettings.fileName = filePrefix;
    }

    startLog() {
        this.logger.openLogFile();
    }

    logData(data) {
        this.logger.log(data);
    }

    stopLog() {
        this.logger.closeLogFile();
    }

    logFileIsOpen() {
        return this.logger.logFileIsOpen();
    }
}

module.exports = DataLogger;
