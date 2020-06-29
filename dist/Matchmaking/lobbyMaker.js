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
class ErrorHandler extends Error {
    constructor(message, code) {
        super(message);
        this.error_codes = {
            ROOM_ALREADY_JOINED: 2,
            ROOM_DOESNT_EXIST: 3,
            ROOM_FULL: 4,
            NOT_ENOUGH_PLAYERS: 5,
            PLAYER_NOT_IN_ROOM: 6
        };
        this.error_code = code || 1;
    }
}
exports.ErrorHandler = ErrorHandler;
class lobbyMaker {
    constructor(resolver, getKey, options) {
        this.createRoom = (player) => {
            if (this.inRoom(player))
                throw new Error("This player already has created or joined a room!");
            let roomID = shortid.generate();
            this.rooms.set(roomID, [player]);
            return roomID;
        };
        this.joinRoom = (player, roomID) => {
            if (this.inRoom(player))
                throw new ErrorHandler("This player already has created or joined a room!", 2);
            if (!this.roomExists(roomID))
                throw new ErrorHandler("This room doesn't exist.", 3);
            let room_players = this.rooms.get(roomID);
            if (room_players.length > this.maxMatchSize)
                throw new ErrorHandler("Room is full!", 4);
            room_players.push(player);
            this.rooms.set(roomID, room_players);
        };
        this.joinRoomPromise = (player, roomID) => {
            console.log("promise starts");
            return new Promise((resolve, reject) => {
                console.log("promise starts2 2222");
                if (this.inRoom(player))
                    reject("Player already in room");
                if (!this.roomExists(roomID))
                    reject("This room doesn't exist");
                let room_players = this.rooms.get(roomID);
                if (room_players.length > this.maxMatchSize)
                    reject("Room is full!");
                room_players.push(player);
                this.rooms.set(roomID, room_players);
                console.log("promise starts 3333");
                resolve("Joined");
            });
        };
        this.playersInRoom = (roomID) => {
            if (!this.roomExists(roomID))
                throw new ErrorHandler("This room doesn't exist.", 3);
            return this.rooms.get(roomID);
        };
        this.leaveRoom = (player, roomID) => {
            if (!this.roomExists(roomID))
                throw new ErrorHandler("This room doesn't exist.", 3);
            let room_players = this.rooms.get(roomID);
            if (!room_players.some(p => this.getKey(p) === this.getKey(player)))
                throw new ErrorHandler("Player is not in this room.", 6);
            room_players.splice(room_players.findIndex((p) => { return this.getKey(p) == this.getKey(player); }), 1);
            if (room_players.length <= 0)
                this.rooms.delete(roomID);
            else
                this.rooms.set(roomID, room_players);
        };
        this.deleteRoom = (roomID) => {
            if (!this.roomExists(roomID))
                throw new ErrorHandler("This room doesn't exist.", 3);
            this.rooms.delete(roomID);
        };
        this.startRoom = (roomID) => {
            if (!this.roomExists(roomID))
                throw new ErrorHandler("This room doesn't exist.", 3);
            let room_players = this.rooms.get(roomID);
            if (room_players.length < this.minMatchSize)
                throw new ErrorHandler("There aren't enough players to start", 5);
            this.rooms.delete(roomID);
            this.resolver(room_players);
        };
        this.inRoom = (player) => {
            return Array.from(this.rooms.keys()).some(room => this.rooms.get(room).map(r => this.getKey(r)).includes(this.getKey(player)));
        };
        this.getRoomId = (player) => {
            return Array.from(this.rooms.keys()).find(roomId => this.rooms.get(roomId).map(p => this.getKey(p)).includes(this.getKey(player)));
        };
        this.roomExists = (roomID) => {
            return this.rooms.has(roomID);
        };
        this.isFull = (roomID) => {
            if (!this.roomExists(roomID))
                throw new ErrorHandler("This room doesn't exist", 3);
            return this.rooms.get(roomID).length >= this.maxMatchSize;
        };
        this.showOtherUsers = (roomID, player) => {
            if (!this.roomExists(roomID))
                throw new ErrorHandler("This room doesn't exist", 3);
            if (!this.inRoom(player))
                throw new ErrorHandler("Player is not in this room", 6);
            return this.rooms.get(roomID).filter(p => this.getKey(p) != this.getKey(player));
        };
        this.resolver = resolver;
        this.getKey = getKey;
        this.rooms = new Map();
        this.maxMatchSize = (options && options.maxMatchSize && options.maxMatchSize > 0 && options.maxMatchSize) || 2;
        this.minMatchSize = (options && options.minMatchSize && options.minMatchSize > 0 && options.minMatchSize) || this.maxMatchSize;
    }
}
exports.lobbyMaker = lobbyMaker;
//# sourceMappingURL=lobbyMaker.js.map