"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const shortid = __importStar(require("shortid"));
class User {
    constructor(socket) {
        this.username = "Anymonious";
        this.id = shortid.generate();
        this.socket = socket;
        this.token = "";
        this.userid = 0;
        this.logedIn = false;
    }
}
exports.User = User;
//# sourceMappingURL=user.js.map