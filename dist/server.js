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
Object.defineProperty(exports, "__esModule", { value: true });
const SocketIO_1 = require("./SocketIO");
const constants_1 = require("./constants");
const user_1 = require("./Classes/user");
const quickMatch_1 = require("./Matchmaking/quickMatch");
const lobbyMaker_1 = require("./Matchmaking/lobbyMaker");
const game_1 = require("./Game/game");
const quickMatch = new quickMatch_1.quickMatch(runGame, (player) => { return player.id; });
const lobbyMaker = new lobbyMaker_1.lobbyMaker(runGame, (player) => { return player.id; });
const io = new SocketIO_1.SocketServer().socketHandler;
let users = new Map();
let sockets = new Map();
let activeGames = [];
io.on(constants_1.SocketEvent.CONNECT, (socket) => {
    console.log("User connected");
    let user = new user_1.User(socket);
    users.set(user.id, user);
    sockets.set(user.id, socket);
    socket.on("updateUsername", ({ username }) => {
        user.username = username;
        users.set(user.id, user);
        console.log("Updated username to %s", username);
    });
    socket.on("getId", (callback) => {
        callback(user.id);
    });
    socket.on('quickmatch', () => {
        quickMatch.push(user);
    });
    socket.on('cancelMatchmaking', () => {
        quickMatch.leaveQueue(user);
    });
    socket.on('createLobby', (callback) => {
        callback(lobbyMaker.createRoom(user));
    });
    socket.on('joinRoom', ({ roomID }, callback) => __awaiter(void 0, void 0, void 0, function* () {
        if (!lobbyMaker.roomExists(roomID))
            return callback("Room with that id does not exist");
        if (lobbyMaker.isFull(roomID))
            return callback("Room is full");
        yield lobbyMaker.joinRoomPromise(user, roomID).then((r) => callback(r)).catch((reason) => callback(reason));
        lobbyMaker.showOtherUsers(lobbyMaker.getRoomId(user), user)[0].socket.emit('joinedRoom');
    }));
    socket.on('mmStart', ({ roomID }) => {
        lobbyMaker.startRoom(roomID);
    });
    socket.on('getRoomInformation', ({ roomID }, callback) => {
        callback(lobbyMaker.playersInRoom(roomID)[0].username);
    });
    socket.on('inviteToRoom', ({ data }, callback) => {
        if (data.toLowerCase() == 'anymonious')
            return callback("You may not invite someone with default username, instead give them the room id to join it.");
        if (lobbyMaker.roomExists(data))
            return callback("You canot invite rooms silly");
        let _user = users.get(Array.from(users.keys()).some(u => users.get(u).username)[0]);
        if (_user.username === data) {
            if (lobbyMaker.inRoom(_user))
                return callback("Already in room");
            _user.socket.emit("invited", (r) => {
                callback(r);
            });
        }
        else {
            callback("Invalid username");
        }
    });
    socket.on('leaveLobby', ({ roomID }) => __awaiter(void 0, void 0, void 0, function* () {
        let others = lobbyMaker.showOtherUsers(lobbyMaker.getRoomId(user), user);
        console.log(others);
        if (others.length > 0)
            yield others[0].socket.emit('leftRoom');
        lobbyMaker.leaveRoom(user, roomID);
    }));
    socket.on('Disconnect_me', () => {
        console.log("clicked disconnect");
        socket.disconnect();
    });
    socket.on(constants_1.SocketEvent.DISCONNECT, (reason) => {
        console.log("Reason: " + reason);
        activeGames.forEach(game => {
            game.playerDisconnect(user);
        });
        // console.log("User was " + (quickMatch.inQueue(user) ? "in" : "out"));
        if (quickMatch.inQueue(user)) {
            quickMatch.leaveQueue(user);
        }
        if (lobbyMaker.inRoom(user)) {
            let others = lobbyMaker.showOtherUsers(lobbyMaker.getRoomId(user), user);
            if (others.length > 0)
                others[0].socket.emit('leftRoom');
            lobbyMaker.leaveRoom(user, lobbyMaker.getRoomId(user));
        }
        // console.log(lobbyMaker.inRoom(user) + "in lobby");
        console.log("%s disconnected", user.username);
    });
    socket.once('tryReconnect', ({ playerID }, callback) => __awaiter(void 0, void 0, void 0, function* () {
        activeGames.forEach(game => {
            let newUser = user;
            newUser.id = playerID;
            if (game.tryReconnect(newUser)) {
                console.log("Reconnected");
                users.set(user.id, newUser);
                user = newUser;
                callback("sucess");
            }
            else {
                callback("failed");
            }
        });
    }));
});
function runGame(players) {
    console.log("starting game with: " + players.map(p => `${p.username}: ${p.id}`).join(" | "));
    let game = new game_1.Game(players[0], players[1]);
    players[0].socket.emit('foundMatchTest');
    players[1].socket.emit('foundMatchTest');
    activeGames.push(game.startGame(Math.floor(Math.random()), endGame));
}
function endGame(gameid) {
    let index = activeGames.findIndex(game => game.gameID === gameid);
    activeGames.splice(index);
}
//# sourceMappingURL=server.js.map