import {
    Team,
    Player
} from '../data/teams';

export type PlayerStats = {
    points: number;
    fgm: number; // Field Goals Made
    fga: number; // Field Goals Attempted
    tpm: number; // 3 Points Made
    tpa: number; // 3 Points Attempted
    ftm: number; // Free Throws Made
    fta: number; // Free Throws Attempted
};

export type MatchResult = {
    score: Record < string,
    number > ;
    quarterScores: Record < string,
    number[] > ;
    events: string[];
    boxscore: Record < string,
    Record < string,
    PlayerStats >> ;
};

function randomChance(probability: number): boolean {
    return Math.random() < probability;
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function simulateMatchAsync(
    teamA: Team,
    teamB: Team,
    onUpdate ? : (
        events: string[],
        score: Record < string, number > ,
        quarterScores: Record < string, number[] > ,
        boxscore: Record < string, Record < string, PlayerStats >>
    ) => void
): Promise < MatchResult > {

    const score: Record < string, number > = {
        [teamA.id]: 0,
        [teamB.id]: 0
    };

    const quarterScores: Record < string, number[] > = {
        [teamA.id]: [0, 0, 0, 0],
        [teamB.id]: [0, 0, 0, 0]
    };

    const boxscore: Record < string, Record < string, PlayerStats >> = {
        [teamA.id]: {},
        [teamB.id]: {}
    };

    const events: string[] = [];

    const quarters = 4;
    const quarterTime = 12 * 60; // 12 minutos por quarto em segundos

    const playersA: Player[] = teamA.players.map(p => ({
        ...p
    }));
    const playersB: Player[] = teamB.players.map(p => ({
        ...p
    }));

    // inicializa stats dos jogadores
    [...playersA, ...playersB].forEach(p => {
        boxscore[p.teamId] = boxscore[p.teamId] || {};
        boxscore[p.teamId][p.name] = {
            points: 0,
            fgm: 0,
            fga: 0,
            tpm: 0,
            tpa: 0,
            ftm: 0,
            fta: 0
        };
    });

    for (let q = 1; q <= quarters; q++) {
        events.push(`--- Quarter ${q} ---`);
        if (onUpdate) onUpdate([...events], {...score}, { ...quarterScores }, { ...boxscore });

        let remainTime = quarterTime;

        while (remainTime > 0) {
            const possessionTime = Math.random() * (24 - 5) + 5;
            remainTime -= possessionTime;

            await sleep(1);
            if (remainTime < 0) break;

            const minute = Math.floor(remainTime / 60);
            const second = Math.floor(remainTime % 60);

            if (Math.random() < 0.1) continue;

            const isTeamA = Math.random() < 0.5;
            const attackingTeam = isTeamA ? playersA : playersB;
            const defendingTeam = isTeamA ? playersB : playersA;
            const teamId = isTeamA ? teamA.id : teamB.id;

            const attacker = attackingTeam[Math.floor(Math.random() * attackingTeam.length)];
            const defender = defendingTeam[Math.floor(Math.random() * defendingTeam.length)];
            const stats = boxscore[teamId][attacker.name];

            const rand = Math.random();
            let points = 0;
            let chance = 0;
            let shotType = '';

            if (rand < 0.70) {
                points = 2;
                shotType = '2PT';
                chance = attacker.attack / (attacker.attack + defender.defense) * (attacker.energy / 55);
                stats.fga++;
            } else if (rand < 0.95) {
                points = 3;
                shotType = '3PT';
                chance = (attacker.attack * 0.8) / (attacker.attack + defender.defense) * (attacker.energy / 70);
                stats.fga++;
                stats.tpa++;
            } else {
                points = 1;
                shotType = 'FT';
                chance = attacker.energy / 100;
            }

            if (shotType === 'FT') {
                for (let ft = 1; ft <= 2; ft++) {
                    if (randomChance(chance)) {
                        score[teamId] += 1;
                        quarterScores[teamId][q - 1] += 1;
                        stats.points += 1;
                        stats.ftm += 1
                        stats.fta += 1;
                        events.push(`[${minute}:${second < 10 ? '0' : ''}${second}] ${attacker.name} acertou um ${shotType}! (+${points})`);
                    } else {
                        stats.fta += 1;
                        events.push(`[${minute}:${second < 10 ? '0' : ''}${second}] ${attacker.name} (FT) desperdiça o lance livre.`);
                    }
                }
            } else {
                if (randomChance(chance)) {
                    score[teamId] += points;
                    quarterScores[teamId][q - 1] += points;
                    stats.points += points;
                    stats.fgm++;
                    events.push(`[${minute}:${second < 10 ? '0' : ''}${second}] ${attacker.name} marca ${points} pontos com um ${shotType}!`);
                    if (points === 3) stats.tpm++;
                } else {
                    events.push(`[${minute}:${second < 10 ? '0' : ''}${second}] ${attacker.name} erra um ${shotType}.`);
                }
            }

            attacker.energy = Math.max(attacker.energy - 5, 0);

            if (onUpdate) onUpdate([...events], {...score}, {...quarterScores}, {...boxscore});
        }
    }

    return {
        score,
        quarterScores,
        events,
        boxscore
    };
}