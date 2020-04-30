"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const io = require("socket.io");
class SocketServer {
    constructor() {
        this.httpConnection = http_1.createServer();
        this.socketHandler = io(this.httpConnection);
        this.listen();
    }
    listen() {
        this.httpConnection.listen(SocketServer.PORT, () => {
            console.log("Server listening at port %d", SocketServer.PORT);
        });
    }
}
exports.SocketServer = SocketServer;
SocketServer.PORT = parseInt(process.env.PORT) || 3000;
//# sourceMappingURL=SocketIO.js.map