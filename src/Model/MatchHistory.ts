import { model, Schema, Document } from "mongoose";

export interface IMatchHistory {
    yourScore: number,
    enemyScore: number,
    oppomentUsername: string,
    ranked: boolean
}

export interface IMatchHistoryModel extends Document {
    userID: string,
    history: IMatchHistory[]
}

export default model("matchhistory", new Schema({
    userID: String,
    history: Array
}).index({ userID: 1 }));