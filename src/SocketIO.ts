import { createServer, Server } from 'http';
import * as io from 'socket.io';

export class SocketServer
{
    public static readonly PORT: number = parseInt(process.env.PORT) || 3000;
    private httpConnection: Server;
    public socketHandler: SocketIO.Server;

    constructor()
    {
        this.httpConnection = createServer();
        this.socketHandler = io(this.httpConnection);
        this.listen();
    }

    public listen(): void
    {
        this.httpConnection.listen(SocketServer.PORT, () =>
        {
            console.log("Server listening at port %d", SocketServer.PORT);
        });
    }
}