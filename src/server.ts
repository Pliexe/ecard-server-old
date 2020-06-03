import { SocketServer } from './SocketIO';
import * as SocketIO from 'socket.io';
import { SocketEvent } from './constants';
import { User } from './Classes/user';
import { quickMatch as QuickMatch } from './Matchmaking/quickMatch';
import { lobbyMaker as LobbyMaker } from './Matchmaking/lobbyMaker';
import { Game } from './Game/game';

const quickMatch = new QuickMatch(runGame, (player) => { return player.id });
const lobbyMaker = new LobbyMaker(runGame, (player) => { return player.id });
const io: SocketIO.Server = new SocketServer().socketHandler;

let users: Map<string, User> = new Map();
let sockets: Map<string, SocketIO.Socket> = new Map();
let activeGames: Array<Game> = [];

io.on(SocketEvent.CONNECT, (socket: SocketIO.Socket) =>
{
    console.log("User connected");

    let user = new User(socket);
    users.set(user.id, user);
    sockets.set(user.id, socket);

    socket.on("updateUsername", ({ username }) =>
    {
        user.username = username;
        users.set(user.id, user);
        console.log("Updated username to %s", username);
    });

    socket.on("getId", (callback) =>
    {
        callback(user.id);
    });

    socket.on('quickmatch', () =>
    {
        quickMatch.push(user);
    });

    socket.on('cancelMatchmaking', () =>
    {
        quickMatch.leaveQueue(user);
    });

    socket.on('createLobby', (callback) =>
    {
        callback(lobbyMaker.createRoom(user));
    });

    socket.on('joinRoom', async ({ roomID }, callback) =>
    {
        if (!lobbyMaker.roomExists(roomID)) return callback("Room with that id does not exist");
        if (lobbyMaker.isFull(roomID)) return callback("Room is full");
        await lobbyMaker.joinRoomPromise(user, roomID).then((r) => callback(r)).catch((reason) => callback(reason));
        lobbyMaker.showOtherUsers(lobbyMaker.getRoomId(user), user)[0].socket.emit('joinedRoom');
    });

    socket.on('mmStart', ({ roomID }) =>
    {
        lobbyMaker.startRoom(roomID);
    });

    socket.on('getRoomInformation', ({ roomID }, callback) =>
    {
        callback(lobbyMaker.playersInRoom(roomID)[0].username);
    })

    socket.on('inviteToRoom', ({ data }, callback) =>
    {
        if (data.toLowerCase() == 'anymonious') return callback("You may not invite someone with default username, instead give them the room id to join it.");
        if (lobbyMaker.roomExists(data)) return callback("You canot invite rooms silly");
        let _user = users.get(Array.from(users.keys()).some(u => users.get(u).username)[0]);
        if (_user.username === data) {
            if (lobbyMaker.inRoom(_user)) return callback("Already in room");
            _user.socket.emit("invited", (r) =>
            {
                callback(r);
            });
        } else {
            callback("Invalid username");
        }
    });

    socket.on('leaveLobby', async ({ roomID }) =>
    {
        let others = lobbyMaker.showOtherUsers(lobbyMaker.getRoomId(user), user);
        console.log(others);
        if (others.length > 0)
            await others[0].socket.emit('leftRoom');
        lobbyMaker.leaveRoom(user, roomID);
    });

    socket.on('Disconnect_me', () =>
    {
        console.log("clicked disconnect");
        
        socket.disconnect(); 
    });

    socket.on(SocketEvent.DISCONNECT, (reason: string) =>
    {
        console.log("Reason: " + reason);
        activeGames.forEach(game =>
        {
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

    socket.once('tryReconnect', async ({ playerID }, callback) =>
    {
        activeGames.forEach(game =>
        {
            let newUser = user;
            newUser.id = playerID;

            if (game.tryReconnect(newUser)) {
                console.log("Reconnected");
                
                users.set(user.id, newUser);
                user = newUser;
                callback("sucess");
            } else {
                callback("failed");
            }
        });
    });
});

function runGame(players): void
{
    console.log("starting game with: " + players.map(p => `${p.username}: ${p.id}`).join(" | "));

    let game = new Game(players[0], players[1]);

    players[0].socket.emit('foundMatchTest');
    players[1].socket.emit('foundMatchTest');

    activeGames.push(game.startGame(Math.floor(Math.random()), endGame));
}

function endGame(gameid): void
{
    let index = activeGames.findIndex(game => game.gameID === gameid);
    activeGames.splice(index);
}
