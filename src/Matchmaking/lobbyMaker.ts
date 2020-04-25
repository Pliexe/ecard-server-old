import * as shortid from 'shortid';
import { promises } from 'dns';

export class ErrorHandler extends Error
{
    public error_code: number;
    public error_codes = {
        ROOM_ALREADY_JOINED: 2,
        ROOM_DOESNT_EXIST: 3,
        ROOM_FULL: 4,
        NOT_ENOUGH_PLAYERS: 5,
        PLAYER_NOT_IN_ROOM: 6
    };

    constructor(message: string, code?: number)
    {
        super(message);
        this.error_code = code || 1;
    }
}

export interface lobbyMakerOptions
{
    minMatchSize?: number;
    maxMatchSize?: number;
}

export class lobbyMaker<P>
{
    private resolver: (players: P[]) => void;
    private getKey: (player: any) => string;
    private maxMatchSize: number;
    private minMatchSize: number;
    private rooms: Map<string, P[]>;

    constructor(resolver: (players: P[]) => void, getKey: (player: any) => string, options?: lobbyMakerOptions)
    {
        this.resolver = resolver;
        this.getKey = getKey;

        this.rooms = new Map<string, P[]>();
        this.maxMatchSize = (options && options.maxMatchSize && options.maxMatchSize > 0 && options.maxMatchSize) || 2;
        this.minMatchSize = (options && options.minMatchSize && options.minMatchSize > 0 && options.minMatchSize) || this.maxMatchSize;
    }

    public createRoom = (player: P): string | Error =>
    {
        if (this.inRoom(player)) throw new Error("This player already has created or joined a room!");

        let roomID: string = shortid.generate();
        this.rooms.set(roomID, [player]);

        return roomID;
    }

    public joinRoom = (player: P, roomID: string): void | ErrorHandler =>
    {
        if (this.inRoom(player)) throw new ErrorHandler("This player already has created or joined a room!", 2);
        if (!this.roomExists(roomID)) throw new ErrorHandler("This room doesn't exist.", 3);

        let room_players = this.rooms.get(roomID);
        if (room_players.length > this.maxMatchSize) throw new ErrorHandler("Room is full!", 4);

        room_players.push(player);
        this.rooms.set(roomID, room_players);
    }

    public joinRoomPromise = (player: P, roomID: string): Promise<any> =>
    {
        console.log("promise starts");
        return new Promise((resolve, reject) =>
        {
            console.log("promise starts2 2222");
            if (this.inRoom(player)) reject("Player already in room");
            if (!this.roomExists(roomID)) reject("This room doesn't exist");

            let room_players = this.rooms.get(roomID);
            if (room_players.length > this.maxMatchSize) reject("Room is full!");

            room_players.push(player);
            this.rooms.set(roomID, room_players);
            console.log("promise starts 3333");
            resolve("Joined");
        });
    }

    public playersInRoom = (roomID: string): P[] | ErrorHandler =>
    {
        if (!this.roomExists(roomID)) throw new ErrorHandler("This room doesn't exist.", 3);
        return this.rooms.get(roomID);
    }

    public leaveRoom = (player: P, roomID: string): void | ErrorHandler =>
    {
        if (!this.roomExists(roomID)) throw new ErrorHandler("This room doesn't exist.", 3);
        let room_players = this.rooms.get(roomID);
        if (!room_players.some(p => this.getKey(p) === this.getKey(player))) throw new ErrorHandler("Player is not in this room.", 6);

        room_players.splice(room_players.findIndex((p) => { return this.getKey(p) == this.getKey(player) }), 1);

        if (room_players.length <= 0)
            this.rooms.delete(roomID);
        else
            this.rooms.set(roomID, room_players);
    }

    public deleteRoom = (roomID: string): void | ErrorHandler =>
    {
        if (!this.roomExists(roomID)) throw new ErrorHandler("This room doesn't exist.", 3);
        this.rooms.delete(roomID);
    }

    public startRoom = (roomID: string): void | ErrorHandler =>
    {
        if (!this.roomExists(roomID)) throw new ErrorHandler("This room doesn't exist.", 3);
        let room_players = this.rooms.get(roomID);
        if (room_players.length < this.minMatchSize) throw new ErrorHandler("There aren't enough players to start", 5);

        this.rooms.delete(roomID);
        this.resolver(room_players);
    }

    public inRoom = (player: P): boolean =>
    {
        return Array.from(this.rooms.keys()).some(room => this.rooms.get(room).map(r => this.getKey(r)).includes(this.getKey(player)));
    }

    public getRoomId = (player: P): string =>
    {
        return Array.from(this.rooms.keys()).find(roomId => this.rooms.get(roomId).map(p => this.getKey(p)).includes(this.getKey(player)));
    }

    public roomExists = (roomID: string): boolean =>
    {
        return this.rooms.has(roomID);
    }

    public isFull = (roomID: string): boolean | ErrorHandler =>
    {
        if (!this.roomExists(roomID)) throw new ErrorHandler("This room doesn't exist", 3);
        return this.rooms.get(roomID).length >= this.maxMatchSize;
    }

    public showOtherUsers = (roomID: string, player: P): any[] =>
    {
        if (!this.roomExists(roomID)) throw new ErrorHandler("This room doesn't exist", 3);
        if (!this.inRoom(player)) throw new ErrorHandler("Player is not in this room", 6);

        return this.rooms.get(roomID).filter(p => this.getKey(p) != this.getKey(player));
    }
}