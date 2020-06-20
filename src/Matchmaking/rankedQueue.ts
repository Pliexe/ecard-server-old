export interface quickMatchOptions
{
    matchSize?: number;
    checkInterval?: number;
}

export class rankedMatch<P>
{
    private getKey: (player: P) => string;
    private queue: P[];
    private resolver: (players: P[]) => void;
    private matchSize: number;
    private checkInterval: number;

    constructor(resolver: (players: P[]) => void, getKey: (player) => string, options?: quickMatchOptions)
    {
        this.queue = [];
        this.getKey = getKey;
        this.resolver = resolver;

        this.checkInterval = (options && options.checkInterval && options.checkInterval > 0 && options.checkInterval) || 5000;
        this.matchSize = (options && options.matchSize && options.matchSize > 0 && options.matchSize) || 2;

        setInterval(() =>
        {
            let players: P[];
            while (this.queue.length >= this.matchSize) {
                players = [];
                while (this.queue.length > 0 && players.length < this.matchSize) {
                    players.push(this.queue.pop() as P);
                }
                this.resolver(players);
            }
        }, this.checkInterval);
    }

    public push = (player: P): void | Error =>
    {
        if (this.inQueue(player)) throw new Error("This player is already in queue");
        else
            this.queue.push(player);
    }

    public leaveQueue = (player: P): void | Error =>
    {
        console.log('removing player from queue')
        if (!this.inQueue(player)) throw new Error("This player is not in queue");
        else
            this.queue.splice(this.indexOnQueue(player), 1);
    }

    public indexOnQueue = (player: P): number =>
    {
        return this.queue.findIndex((p) => { return this.getKey(p) == this.getKey(player) });
    }

    public inQueue = (player: P): boolean =>
    {
        return this.indexOnQueue(player) !== -1;
    }
}