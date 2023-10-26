class WSocket {
    constructor(msgTag, processData) {
        this.msgTag = msgTag;
        this.socket = io();
        this.socket.on(this.msgTag, function (msg) {
            processData(msg);
        });
    }
    Send(data) {
        this.socket.emit(this.msgTag, data);
    }
}
