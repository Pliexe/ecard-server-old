"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shortid = require("shortid");
class User {
    constructor(socket) {
        this.username = "Anymonious";
        this.id = shortid.generate();
        this.socket = socket;
    }
}
exports.User = User;
//# sourceMappingURL=user.js.map