"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const socket_io_1 = __importDefault(require("socket.io"));
class SocketServer {
    constructor() {
        this.httpConnection = http_1.createServer();
        this.socketHandler = socket_io_1.default(this.httpConnection);
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