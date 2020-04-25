import * as shortid from 'shortid';
import { Socket } from 'socket.io';

export class User
{
    public id: string;
    public socket: Socket;
    public username: string;

    constructor(socket: Socket)
    {
        this.username = "Anymonious";
        this.id = shortid.generate();
        this.socket = socket;
    }
}