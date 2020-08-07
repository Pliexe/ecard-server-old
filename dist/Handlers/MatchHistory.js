"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchHistory = void 0;
const MatchHistory_1 = __importDefault(require("../Model/MatchHistory"));
class MatchHistory {
    constructor(id) {
        this.userid = id;
    }
    getHistory() {
        return __awaiter(this, void 0, void 0, function* () {
            let data = yield MatchHistory_1.default.findOne({ userID: this.userid });
            if (!data)
                return [];
            else if (!data.history)
                return [];
            else
                return data.history;
        });
    }
    saveMatch(yourScore, enemyScore, oppomentUsername, ranked) {
        return __awaiter(this, void 0, void 0, function* () {
            MatchHistory_1.default.findOne({ userID: this.userid }, (err, data) => {
                if (err)
                    console.log(err);
                if (!data) {
                    let newMH = new MatchHistory_1.default({
                        userID: this.userid,
                        history: [
                            {
                                yourScore: yourScore,
                                enemyScore: enemyScore,
                                oppomentUsername: oppomentUsername,
                                ranked: ranked
                            }
                        ]
                    });
                    newMH.save().catch(err => console.log(err));
                }
                else {
                    if (data.history.length > 10)
                        data.history.pop();
                    data.history.push({
                        yourScore: yourScore,
                        enemyScore: enemyScore,
                        oppomentUsername: oppomentUsername,
                        ranked: ranked
                    });
                    data.save().catch(err => console.log(err));
                }
            });
        });
    }
}
exports.MatchHistory = MatchHistory;
//# sourceMappingURL=MatchHistory.js.map