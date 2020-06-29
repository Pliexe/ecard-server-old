import * as shortid from 'shortid';
import { Socket } from 'socket.io';

export class User
{
    public id: string;
    public socket: Socket;
    public username: string;
    public token: string;
    public userid: number;
    public logedIn: boolean;

    constructor(socket: Socket)
    {
        this.username = "Anymonious";
        this.id = shortid.generate();
        this.socket = socket;
        this.token = "";
        this.userid = 0;
        this.logedIn = false;
    }
}