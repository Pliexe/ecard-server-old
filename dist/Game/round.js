"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Round = void 0;
var defaultCards = [
    ["citizen", "citizen", "citizen", "citizen", "emperor"],
    ["citizen", "citizen", "citizen", "citizen", "slave"]
];
class Round {
    constructor(player1, player2, starting, callback, g) {
        this.player1LastPlacedCard = "";
        this.player2LastPlacedCard = "";
        this.player1 = player1;
        this.player2 = player2;
        this.callback = callback;
        this.setup(starting);
        this.game = g;
    }
    static whoWins(player1card, player2card) {
        switch (player1card) {
            case "citizen":
                return player2card == "slave" ? 1 : (player2card == "citizen" ? 0 : -1);
            case "slave":
                return player2card == "emperor" ? 1 : -1;
            case "emperor":
                return player2card == "slave" ? -1 : 1;
            default:
                return 2;
        }
    }
    setup(starting) {
        this.player1Cards = Round.shuffle(defaultCards[starting]);
        this.player2Cards = Round.shuffle(defaultCards[1 - starting]);
        this.RoundCardCollecting();
        this.player1.socket.on("calculateOutcome", () => {
            this.canContinueP1 = false;
            this.canContinueP2 = false;
            var outcome = Round.whoWins(this.player1LastPlacedCard, this.player2LastPlacedCard);
            console.log("outcome");
            if (outcome == 1) {
                this.callback(1, this.game);
                this.player1.socket.removeAllListeners("calculateOutcome");
            }
            else if (outcome == -1) {
                this.callback(0, this.game);
                this.player1.socket.removeAllListeners("calculateOutcome");
            }
            else {
                this.player1.socket.emit('roundDraw', { yourCardIndex: this.player1LastPlacedCardIndex, enemyCardIndex: this.player2LastPlacedCardIndex });
                this.player2.socket.emit('roundDraw', { yourCardIndex: this.player2LastPlacedCardIndex, enemyCardIndex: this.player1LastPlacedCardIndex });
                this.canContinueP1 = false;
                this.canContinueP2 = false;
                this.RoundCardCollecting();
            }
        });
        this.runRound();
    }
    RoundCardCollecting() {
        this.player1.socket.once("canContinueRound", () => {
            this.canContinueP1 = true;
        });
        this.player2.socket.once("canContinueRound", () => {
            this.canContinueP2 = true;
        });
        this.player1.socket.once('placeCard', ({ card, index }) => {
            if (!this.canContinueP1 && !this.canContinueP2)
                return;
            this.player1LastPlacedCard = card;
            this.player1LastPlacedCardIndex = index;
            this.player2.socket.emit("enemyPlaceCard", { id: parseInt(index), card: card });
        });
        this.player2.socket.once('placeCard', ({ card, index }) => {
            // console.log(`recived: card: ${card}, at: ${index}`);
            if (!this.canContinueP1 && !this.canContinueP2)
                return;
            this.player2LastPlacedCard = card;
            this.player2LastPlacedCardIndex = index;
            this.player1.socket.emit("enemyPlaceCard", { id: parseInt(index), card: card });
        });
    }
    runRound() {
        this.player1.socket.emit('startRound', { yourCards: this.player1Cards.join(','), enemyCards: this.player2Cards.join(',') });
        this.player2.socket.emit('startRound', { yourCards: this.player2Cards.join(','), enemyCards: this.player1Cards.join(',') });
        // console.log(this.player1Cards);
        // console.log(this.player2Cards);
    }
    static shuffle(a) {
        var j, x, i;
        for (i = a.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = a[i];
            a[i] = a[j];
            a[j] = x;
        }
        return a;
    }
}
exports.Round = Round;
//# sourceMappingURL=round.js.map