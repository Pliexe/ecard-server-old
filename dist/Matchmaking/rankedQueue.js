"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rankedMatch = void 0;
class rankedMatch {
    constructor(resolver, getKey, options) {
        this.push = (player) => {
            if (this.inQueue(player))
                throw new Error("This player is already in queue");
            else
                this.queue.push(player);
        };
        this.leaveQueue = (player) => {
            console.log('removing player from queue');
            if (!this.inQueue(player))
                throw new Error("This player is not in queue");
            else
                this.queue.splice(this.indexOnQueue(player), 1);
        };
        this.indexOnQueue = (player) => {
            return this.queue.findIndex((p) => { return this.getKey(p) == this.getKey(player); });
        };
        this.inQueue = (player) => {
            return this.indexOnQueue(player) !== -1;
        };
        this.queue = [];
        this.getKey = getKey;
        this.resolver = resolver;
        this.checkInterval = (options && options.checkInterval && options.checkInterval > 0 && options.checkInterval) || 5000;
        this.matchSize = (options && options.matchSize && options.matchSize > 0 && options.matchSize) || 2;
        setInterval(() => {
            let players;
            while (this.queue.length >= this.matchSize) {
                players = [];
                while (this.queue.length > 0 && players.length < this.matchSize) {
                    players.push(this.queue.pop());
                }
                this.resolver(players);
            }
        }, this.checkInterval);
    }
}
exports.rankedMatch = rankedMatch;
//# sourceMappingURL=rankedQueue.js.map