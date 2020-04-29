import { User } from '../Classes/user';
import { Round } from './round';

export class Game
{
    private starting: Number;
    private canContinue: boolean = false;
    private player1: User;
    private player2: User;
    private player1Wins: number;
    private player2Wins: number;
    private rounds: number = 1;
    private maxRounds: number;

    private currentRound: Round;

    constructor(player1: User, player2: User, rounds?: number)
    {
        this.maxRounds = rounds || 12;
        this.player1 = player1;
        this.player2 = player2;
    }

    public startGame(p1Starting: number): void
    {
        this.starting = p1Starting;
        this.setupGame();
        console.log("Starting: "+this.starting);
    }

    private initializeGame(): void
    {
      console.log("staring "+this.rounds+"th round");

        this.canContinue = false;
        if (this.rounds >= this.maxRounds) {
            if (this.player1Wins > this.player2Wins) {
              this.player1.socket.removeAllListeners("canContinue");
                this.player1.socket.emit('win');
                this.player2.socket.emit('lose');
            } if (this.player1Wins < this.player2Wins) {
              this.player1.socket.removeAllListeners("canContinue");
                this.player1.socket.emit('lose');
                this.player2.socket.emit('win');
            } else {
              this.player1.socket.removeAllListeners("canContinue");
                this.player1.socket.emit('draw');
                this.player2.socket.emit('draw');
            }
        } else {
            this.currentRound = new Round(this.player1, this.player2, this.starting, this.handleGame);
            console.log("Can flip around: "+(this.rounds as any % 3 == 0)+", round: "+this.rounds);

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

        console.log("Game started");
    }
}
