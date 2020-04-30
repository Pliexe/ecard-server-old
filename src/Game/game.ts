import { User } from '../Classes/user';
import { Round } from './round';
import * as shortid from 'shortid';
import { SocketEvent } from '../constants';

export class Game
{
    public gameID: string;

    private starting: Number;
    private canContinue: boolean = false;
    private playerDisconnected: boolean = false;
    public player1: User;
    public player2: User;
    private player1Wins: number;
    private player2Wins: number;
    private rounds: number = 1;
    private maxRounds: number;
    private timeout;
    private callback: (gameid: any) => void;

    private currentRound: Round;

    constructor(player1: User, player2: User, rounds?: number)
    {
        this.gameID = shortid.generate();
        this.maxRounds = rounds || 12;
        this.player1 = player1;
        this.player2 = player2;
    }

    public startGame(p1Starting: number, callback: (gameid: any) => void): this
    {
        this.callback = callback;
        this.starting = p1Starting;
        this.setupGame();
        console.log("Starting: " + this.starting);

        return this;
    }

    public playerDisconnect(playerDisconnected: User): void
    {
        console.log("Tries to see disc => p1: " + (this.player1.id === playerDisconnected.id) + ", p2: " + (this.player2.id === playerDisconnected.id));

        if (this.player1.id === playerDisconnected.id) {
            if (this.playerDisconnected) {
                this.callback(this.gameID);
            } else {
                console.log("tries to notify");
                this.player2.socket.emit('oppomentDisconnected');

                this.playerDisconnected = true;

                this.timeout = setTimeout(() =>
                {
                    console.log("trying to tell that user left the game: " + this.playerDisconnected);
                    if (!this.playerDisconnected) return;
                    console.log("trying to tell that user left the game x2");
                    this.player2.socket.emit('oppomentDisconnectedFully');
                    this.callback(this.gameID);
                }, 60000);
            }
        } else if (this.player2.id === playerDisconnected.id) {
            if (this.playerDisconnected) {
                this.callback(this.gameID);
            } else {
                console.log("tries to notify");

                this.player1.socket.emit('oppomentDisconnected');
                this.playerDisconnected = true;
                this.timeout = setTimeout(() =>
                {
                    console.log("trying to tell that user left the game: " + this.playerDisconnected);
                    if (!this.playerDisconnected) return;
                    console.log("trying to tell that user left the game x2");
                    this.player1.socket.emit('oppomentDisconnectedFully');
                    this.callback(this.gameID);
                }, 60000);
            }
        }
    }

    public tryReconnect(player: User): boolean
    {
        if (!this.timeout) return false;
        if (!this.playerDisconnected) return false;
        if (player.id != this.player1.id || player.id != this.player2.id) return false;
        clearTimeout(this.timeout);
        this.playerDisconnected = false;
        player.socket.emit('oppomentReconnected');
        if (player.id == this.player1.id) {
            this.player1 = player;
            this.player1.socket.on('canContinue', () =>
            {
                if (this.canContinue === true)
                    this.initializeGame();
                else
                    this.canContinue = true;
            });
        }
        else {
            this.player2 = player;
            this.player2.socket.on('canContinue', () =>
            {
                if (this.canContinue === true)
                    this.initializeGame();
                else
                    this.canContinue = true;
            });
        }
        return true;
    }

    private initializeGame(): void
    {
        console.log("staring " + this.rounds + "th round");

        this.canContinue = false;
        if (this.rounds > this.maxRounds) {
            if (this.player1Wins > this.player2Wins) {
                this.player1.socket.removeAllListeners("canContinue");
                this.player1.socket.emit('win');
                this.player2.socket.emit('lose');
                this.callback(this.gameID);
            } if (this.player1Wins < this.player2Wins) {
                this.player1.socket.removeAllListeners("canContinue");
                this.player1.socket.emit('lose');
                this.player2.socket.emit('win');
                this.callback(this.gameID);
            } else {
                this.player1.socket.removeAllListeners("canContinue");
                this.player1.socket.emit('draw');
                this.player2.socket.emit('draw');
                this.callback(this.gameID);
            }
        } else {
            this.currentRound = new Round(this.player1, this.player2, this.starting, this.handleGame);
            console.log("Can flip around: " + (this.rounds as any % 3 == 0) + ", round: " + this.rounds);

            if (this.rounds as any % 3 == 0) this.starting = 1 - <any>this.starting;
            this.rounds++;
        }
    }

    private handleGame(wins: Number)
    {
        if (wins == 1) {
            this.player1.socket.emit('winRound');
            this.player2.socket.emit('loseRound');
            this.player1Wins++;
        }
        else {
            this.player1.socket.emit('loseRound');
            this.player2.socket.emit('winRound');
            this.player2Wins++;
        }

        delete this.currentRound;
        this.player1.socket.emit('canContinue');
        this.player2.socket.emit('canContinue');
    }

    private setupGame(): void
    {
        this.player1.socket.on('canContinue', () =>
        {
            if (this.canContinue === true)
                this.initializeGame();
            else
                this.canContinue = true;
        });

        this.player2.socket.on('canContinue', () =>
        {
            if (this.canContinue === true)
                this.initializeGame();
            else
                this.canContinue = true;
        });
    }
}
