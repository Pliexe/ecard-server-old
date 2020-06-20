import model, { IMatchHistory, IMatchHistoryModel } from '../Model/MatchHistory';

export class MatchHistory {
    private userid: number;
    
    constructor(id: number)
    {
        this.userid = id;
    }

    async getHistory (): Promise<IMatchHistory[]>
    {
        let data: IMatchHistoryModel = await <any>model.findOne({ userID: this.userid });

        if(!data)
            return [];
        else if(!data.history)
            return [];
        else
            return data.history;
    }

    async saveMatch(yourScore: number, enemyScore: number, oppomentUsername: string, ranked: boolean)
    {
        model.findOne({ userID: this.userid }, (err, data: IMatchHistoryModel) => {
            if(err) console.log(err);
            if(!data) {
                let newMH = new model({
                    userID: this.userid,
                    history: [
                        {
                            yourScore: yourScore,
                            enemyScore: enemyScore,
                            oppomentUsername: oppomentUsername,
                            ranked: ranked
                        }
                    ]
                });

                newMH.save().catch(err => console.log(err));
            } else {
                if(data.history.length > 10) data.history.pop();
                data.history.push({
                    yourScore: yourScore,
                    enemyScore: enemyScore,
                    oppomentUsername: oppomentUsername,
                    ranked: ranked
                });

                data.save().catch(err => console.log(err));
            }
        });
    }
}