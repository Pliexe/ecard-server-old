import { User } from '../Classes/user';
import { Round } from './round';
import * as shortid from 'shortid';
import { SocketEvent } from '../constants';

export interface IResults {
    winer?: User;
    loser?: User;
    winerScore: number;
    loserScore: number;
    draw: boolean;
    disc: boolean;
}

export class Game
{
    public gameID: string;

    private starting: Number;
    private canContinue: boolean = false;
    private playerDisconnected: boolean = false;
    public player1: User;
    public player2: User;
    private player1Wins: number = 0;
    private player2Wins: number = 0;
    private rounds: number = 1;
    private maxRounds: number;
    private timeout;
    private callback: (gameid: any, results: IResults) => void;

    private currentRound: Round;

    constructor(player1: User, player2: User, rounds?: number)
    {
        this.gameID = shortid.generate();
        this.maxRounds = rounds || 12;
        this.player1 = player1;
        this.player2 = player2;
    }

    public startGame(p1Starting: number, callback: (gameid: any, results: IResults) => void): this
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
                this.callback(this.gameID, {winer: this.player2, loser: this.player1, draw: false, winerScore: this.player2Wins, loserScore: this.player1Wins, disc: true});
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
                    this.callback(this.gameID, {winer: this.player2, loser: this.player1, draw: false, winerScore: this.player2Wins, loserScore: this.player1Wins, disc: true});
                }, 60000);
            }
        } else if (this.player2.id === playerDisconnected.id) {
            if (this.playerDisconnected) {
                this.callback(this.gameID, {winer: this.player1, loser: this.player2, draw: false, winerScore: this.player1Wins, loserScore: this.player2Wins, disc: true});
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
                    this.callback(this.gameID, {winer: this.player1, loser: this.player2, draw: false, winerScore: this.player1Wins, loserScore: this.player2Wins, disc: true});
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

        console.log(this.player1Wins +" = "+ this.player2Wins);

        if(this.player1.username !== "Anymonious") this.player2.socket.emit("enemyUsername", {username: this.player1.username});
        if(this.player2.username !== "Anymonious") this.player1.socket.emit("enemyUsername", {username: this.player2.username});

        this.canContinue = false;
        if (this.rounds > this.maxRounds) {
            if (this.player1Wins > this.player2Wins) {
                console.log(this.player1Wins +" > "+ this.player2Wins);
                this.player1.socket.removeAllListeners("canContinue");
                this.player1.socket.emit('win');
                this.player2.socket.emit('lose');
                this.callback(this.gameID, {winer: this.player1, loser: this.player2, draw: false, winerScore: this.player1Wins, loserScore: this.player2Wins, disc: false});
            } if (this.player1Wins < this.player2Wins) {
                console.log(this.player1Wins +" < "+ this.player2Wins);
                this.player1.socket.removeAllListeners("canContinue");
                this.player1.socket.emit('lose');
                this.player2.socket.emit('win');
                this.callback(this.gameID, {winer: this.player2, loser: this.player1, draw: false, winerScore: this.player2Wins, loserScore: this.player1Wins, disc: false});
            } else if(this.player1Wins === this.player2Wins) {
                console.log("draw");
                this.player1.socket.removeAllListeners("canContinue");
                this.player1.socket.emit('draw');
                this.player2.socket.emit('draw');
                this.callback(this.gameID, {winer: this.player2, loser: this.player1, draw: true, winerScore: this.player2Wins, loserScore: this.player1Wins, disc: false});
            }
        } else {
            this.currentRound = new Round(this.player1, this.player2, this.starting, this.handleGame, this);
            console.log("Can flip around: " + (this.rounds as any % 3 == 0) + ", round: " + this.rounds);

            if (this.rounds as any % 3 == 0) this.starting = 1 - <any>this.starting;
            this.rounds++;
        }
    }

    private handleGame(wins: Number, g: Game)
    {
        console.log(wins);

        if (wins == 1) {
            console.log("THIS RUNS OMG WHY WONT IT WORK");
            this.player1.socket.emit('winRound');
            this.player2.socket.emit('loseRound');
            g.player1Wins++;
            console.log(this.player1Wins);
        }
        else {
            console.log("THIS RUNS OMG WHY WONT IT WORK 2");
            this.player1.socket.emit('loseRound');
            this.player2.socket.emit('winRound');
            g.player2Wins++;
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
