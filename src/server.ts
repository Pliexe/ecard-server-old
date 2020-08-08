import { SocketServer } from "./SocketIO";
import { SocketEvent } from "./constants";
import gamejoltAPI from 'game-jolt-api';
import { User } from "./Classes/user";
import socketClient from 'socket.io-client';
import { quickMatch as QuickMatch } from './Matchmaking/quickMatch';

interface ILoginResponse {
    success: boolean;
    message: string;
}

const quickMatch = new QuickMatch(runGame, (player) => { return player.id });
// const lobbyMaker = new LobbyMaker(runGame, (player) => { return player.id });

let gamejoltAPItools = gamejoltAPI(process.env.GAMEJOLT_GAME_API, 450666);

const socketServer = new SocketServer();
const app = socketServer.app;
const io: SocketIO.Server = socketServer.socketHandler;

// app.use(express.static('public'));

app.get('/', function(request, response) {
  response.send("What are you doing here? The website is not made yet, this is only to have it go 24/7");
});

let users: Map<string, User> = new Map();

io.on(SocketEvent.CONNECT, (socket: SocketIO.Socket) => {

    let user = new User(socket);

    users.set(user.id, user);

    socket.on(SocketEvent.LOGIN, (username, token) => {
        gamejoltAPItools.AuthUser(username, token, (res) => {
            user.username = username;
            user.token = token;
            user.logedIn = true;

            socket.emit('loginResult', res);
        });
    });

    socket.on('GameStatus', (callback: (result: string) => void) => {
        if (game_server.connected) {
            return callback("avaible");
        } else return callback("offline");
    });

    socket.on('joinQueue', (type) => {
        if(!game_server.connected) socket.emit('queueError', 'Game server offline');
        console.log(type);
        switch (type) {
            case "normal":
                if (quickMatch.inQueue(user)) {
                    socket.emit('forceLeave');
                    quickMatch.leaveQueue(user);
                }
                quickMatch.push(user);
                break;
            default:
                socket.emit('queueError', "Unknown queue type");
                break;
        }
    });

    socket.on('leaveQueue', (type: string, callback: (result) => void) => {
        console.log(type);
        switch (type) {
            case "normal":
                if (quickMatch.inQueue(user)) {
                    quickMatch.leaveQueue(user);
                    if (quickMatch.inQueue(user)) callback(false);
                    else
                        callback(true);
                }
                else
                    callback(true);
                break;
            default:
                callback(false);
                break;
        }
    });

    socket.on("disconnect", (reason) => {
        console.log(`${user.username} disconnected`);
        if (quickMatch.inQueue(user)) quickMatch.leaveQueue(user);
        if (users.has(user.id)) users.delete(user.id);
    });
});

const game_server = socketClient(process.env.GAME_SERVER_URL, {
    reconnection: true
});

game_server.on("connect", () => {
    game_server.emit("auth", ({ type: "server", auth: process.env.GAME_SERVER_AUTH }));
});

game_server.on("authResult", (data: { result: boolean, reason: string }) => {
    io.sockets.emit("gameStatusUpdate", data.result, data.result);
});

game_server.on('disconnect', () => {
    io.sockets.emit("gameStatusUpdate", false, "disconnected");
});

function runGame(players: User[], type: "normal" | "ranked" | "custom") {
    console.log(game_server.connected);
    console.log("Game tries to start");
    if (!game_server.connected) {
        players[0].socket.emit('queueError', 'Game server is offline');
        players[1].socket.emit('queueError', 'Game server is offline');
        return;
    }
    game_server.emit('queueGame', players[0].id, players[1].id, type, (result: boolean) => {
        if (result) {
            console.log('game start');
            players[0].socket.emit('gameStart', players[0].id);
            players[1].socket.emit('gameStart', players[1].id);
        } else {
            players[0].socket.emit('queueError', 'Game failed to start');
            players[1].socket.emit('queueError', 'Game failed to start');
        }
    });

    game_server.on('gameResult', (p1id, p2id, info: { time: number, p1s: number, p2s: number, winer: string, type: string }) => {

        console.log("GAME RESULTS: ");
        console.log(users.has(p1id));
        console.log(users.has(p2id));
        console.log("\n CONENCTED? =>>>>");
        console.log(users.get(p1id).socket.connected);
        console.log(users.get(p2id).socket.connected);
        console.log("END >> \n");

        switch (info.winer) {
            case "p1":
                if (users.has(p1id))
                    if (users.get(p1id).socket.connected)
                        users.get(p1id).socket.emit('matchResult', "win", {type: type, p1s: info.p1s, p2s: info.p2s, time: info.time });
                if (users.has(p2id))
                    if (users.get(p2id).socket.connected)
                        users.get(p2id).socket.emit('matchResult', "lose", {type: type, p1s: info.p2s, p2s: info.p1s, time: info.time });
                break;
            case "p2":
                if (users.has(p1id))
                    if (users.get(p1id).socket.connected)
                        users.get(p1id).socket.emit('matchResult', "lose", {type: type, p1s: info.p1s, p2s: info.p2s, time: info.time });
                if (users.has(p2id))
                    if (users.get(p2id).socket.connected)
                        users.get(p2id).socket.emit('matchResult', "win", {type: type, p1s: info.p2s, p2s: info.p1s, time: info.time });
                break;
            case "draw":
                if (users.has(p1id))
                    if (users.get(p1id).socket.connected)
                        users.get(p1id).socket.emit('matchResult', "draw", {type: type, p1s: info.p1s, p2s: info.p2s, time: info.time });
                if (users.has(p2id))
                    if (users.get(p2id).socket.connected)
                        users.get(p2id).socket.emit('matchResult', "draw", {type: type, p1s: info.p2s, p2s: info.p1s, time: info.time });
                break;
        }
    });

    game_server.on('loadFail', (p1id, p2id) => {
        console.log("OPP LOAD FAIL");
        if (users.has(p1id))
            if (users.get(p1id).socket.connected)
                users.get(p1id).socket.emit('oppDiscAtLoad');
        if (users.has(p2id))
            if (users.get(p2id).socket.connected)
                users.get(p2id).socket.emit('oppDiscAtLoad');
    });
}

// import { SocketServer } from './SocketIO';
// import * as SocketIO from 'socket.io';
// import { SocketEvent } from './constants';
// import { User } from './Classes/user';
// import { quickMatch as QuickMatch } from './Matchmaking/quickMatch';
// import { lobbyMaker as LobbyMaker } from './Matchmaking/lobbyMaker';
// import { Game, IResults } from './Game/game';
// import { connect } from 'mongoose';
// import { MatchHistory } from './Handlers/MatchHistory';

// // HERE ARE THE VALUES: accountLogout, getHistory

// const quickMatch = new QuickMatch(runGame, (player) => { return player.id });
// const lobbyMaker = new LobbyMaker(runGame, (player) => { return player.id });
// const io: SocketIO.Server = new SocketServer().socketHandler;

// let users: Map<string, User> = new Map();
// let sockets: Map<string, SocketIO.Socket> = new Map();
// let activeGames: Array<Game> = [];

// connect(process.env.MONGOURL, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//     useFindAndModify: false,
//     useCreateIndex: true
// });

// // IMPORTANT current game version

// let currentGameVersion = "0.0.1";

// io.on(SocketEvent.CONNECT, (socket: SocketIO.Socket) =>
// {
//     console.log("User connected");

//     let user = new User(socket);
//     users.set(user.id, user);
//     sockets.set(user.id, socket);

//     let verVerifyWait = setTimeout(() => {
//         socket.disconnect();
//         console.log("socket disconected")
//     }, 5000);

//     socket.on('checkVersion', async ({version}) => {
//         clearTimeout(verVerifyWait);
//         if(version !== currentGameVersion)
//         {
//             await socket.emit("wrongVersion");
//             socket.disconnect();
//         }
//     });

//     socket.on("updateUsername", ({ username, userid }) =>
//     {
//         user.username = username;
//         user.userid = userid;
//         users.set(user.id, user);
//         console.log("Updated username to %s", username);
//     });

//     socket.on("accountLogout", () => {
//         user.username = "Anymonious";
//         user.userid = 0;
//         users.set(user.id, user);
//         console.log("Reset this users info");
//     });

//     socket.on("getHistory", async (callback) => {
//         if(user.userid === 0) return;
//         let his = await new MatchHistory(user.userid).getHistory;
//         callback(his);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
//     });

//     socket.on("getId", (callback) =>
//     {
//         callback(user.id);
//     });

//     socket.on('quickmatch', () =>
//     {
//         quickMatch.push(user);
//     });

//     socket.on('cancelMatchmaking', () =>
//     {
//         quickMatch.leaveQueue(user);
//     });

//     socket.on('createLobby', (callback) =>
//     {
//         callback(lobbyMaker.createRoom(user));
//     });

//     socket.on('joinRoom', async ({ roomID }, callback) =>
//     {
//         if (!lobbyMaker.roomExists(roomID)) return callback("Room with that id does not exist");
//         if (lobbyMaker.isFull(roomID)) return callback("Room is full");
//         await lobbyMaker.joinRoomPromise(user, roomID).then((r) => callback(r)).catch((reason) => callback(reason));
//         lobbyMaker.showOtherUsers(lobbyMaker.getRoomId(user), user)[0].socket.emit('joinedRoom');
//     });

//     socket.on('mmStart', ({ roomID }) =>
//     {
//         lobbyMaker.startRoom(roomID);
//     });

//     socket.on('getRoomInformation', ({ roomID }, callback) =>
//     {
//         callback(lobbyMaker.playersInRoom(roomID)[0].username);
//     })

//     socket.on('inviteToRoom', ({ data }, callback) =>
//     {
//         if (data.toLowerCase() == 'anymonious') return callback("You may not invite someone with default username, instead give them the room id to join it.");
//         if (lobbyMaker.roomExists(data)) return callback("You canot invite rooms silly");
//         let _user = users.get(Array.from(users.keys()).some(u => users.get(u).username)[0]);
//         if (_user.username === data) {
//             if (lobbyMaker.inRoom(_user)) return callback("Already in room");
//             _user.socket.emit("invited", (r) =>
//             {
//                 callback(r);
//             });
//         } else {
//             callback("Invalid username");
//         }
//     });

//     socket.on('leaveLobby', async ({ roomID }) =>
//     {
//         let others = lobbyMaker.showOtherUsers(lobbyMaker.getRoomId(user), user);
//         console.log(others);
//         if (others.length > 0)
//             await others[0].socket.emit('leftRoom');
//         lobbyMaker.leaveRoom(user, roomID);
//     });

//     socket.on('Disconnect_me', () =>
//     {
//         console.log("clicked disconnect");

//         socket.disconnect(); 
//     });

//     socket.on(SocketEvent.DISCONNECT, (reason: string) =>
//     {
//         console.log("Reason: " + reason);
//         activeGames.forEach(game =>
//         {
//             game.playerDisconnect(user);
//         });
//         // console.log("User was " + (quickMatch.inQueue(user) ? "in" : "out"));
//         if (quickMatch.inQueue(user)) {
//             quickMatch.leaveQueue(user);
//         }

//         if (lobbyMaker.inRoom(user)) {
//             let others = lobbyMaker.showOtherUsers(lobbyMaker.getRoomId(user), user);
//             if (others.length > 0)
//                 others[0].socket.emit('leftRoom');
//             lobbyMaker.leaveRoom(user, lobbyMaker.getRoomId(user));
//         }
//         // console.log(lobbyMaker.inRoom(user) + "in lobby");
//         console.log("%s disconnected", user.username);
//     });

//     socket.once('tryReconnect', async ({ playerID }, callback) =>
//     {
//         activeGames.forEach(game =>
//         {
//             let newUser = user;
//             newUser.id = playerID;

//             if (game.tryReconnect(newUser)) {
//                 console.log("Reconnected");

//                 users.set(user.id, newUser);
//                 user = newUser;
//                 callback("sucess");
//             } else {
//                 callback("failed");
//             }
//         });
//     });
// });

// function runGame(players): void
// {
//     console.log("starting game with: " + players.map(p => `${p.username}: ${p.id}`).join(" | "));

//     let game = new Game(players[0], players[1]);

//     players[0].socket.emit('foundMatchTest');
//     players[1].socket.emit('foundMatchTest');

//     activeGames.push(game.startGame(Math.floor(Math.random()), endGame));
// }

// async function endGame(gameid, { winer, loser, draw, disc, winerScore, loserScore }: IResults): Promise<void>
// {
//     let index = await activeGames.findIndex(game => game.gameID === gameid);
//     if(!disc)
//     {
//         if(winer.userid !== 0) await new MatchHistory(winer.userid).saveMatch(winerScore, loserScore, loser.username, false);
//         if(loser.userid !== 0) await new MatchHistory(loser.userid).saveMatch(loserScore, winerScore, winer.username, false);
//     }
//     activeGames.splice(index);
// }
