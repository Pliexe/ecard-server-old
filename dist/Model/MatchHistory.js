"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
exports.default = mongoose_1.model("matchhistory", new mongoose_1.Schema({
    userID: String,
    history: Array
}).index({ userID: 1 }));
//# sourceMappingURL=MatchHistory.js.map