import { Team, Player } from '../data/teams';

export type PlayerStats = {
  points: number;
  fgm: number; // Field Goals Made
  fga: number; // Field Goals Attempted
  tpm: number; // 3 Points Made
  tpa: number; // 3 Points Attempted
  ftm: number; // Free Throws Made
  fta: number; // Free Throws Attempted
  energy: number; // Energy level (0-100)
};

export type MatchResult = {
  score: Record<string, number>;
  quarterScores: Record<string, number[]>;
  events: string[];
  boxscore: Record<string, Record<string, PlayerStats>>;
};

function randomChance(probability: number): boolean {
  return Math.random() < probability;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// titulares (1 por posição)
function getStarters(players: Player[]): Player[] {
  const positions = ["PG", "SG", "SF", "PF", "C"];
  return positions.map(pos => players.find(p => p.position === pos)!).filter(Boolean);
}

// substituição automática
function substitutePlayer(
  teamPlayers: Player[],
  onCourt: Player[],
  position: string,
  events: string[],
  minute: number,
  second: number
) {
  const tiredPlayer = onCourt.find(p => p.position === position);
  const benchPlayer = teamPlayers.find(p => p.position === position && !onCourt.includes(p));

  if (tiredPlayer && benchPlayer) {
    const idx = onCourt.indexOf(tiredPlayer);
    onCourt[idx] = benchPlayer;

    events.push(
      `[${minute}:${second < 10 ? '0' : ''}${second}] Substituição: ${tiredPlayer.name} sai, ${benchPlayer.name} entra (${position}).`
    );
  }
}

export async function simulateMatchAsync(
  teamA: Team,
  teamB: Team,
  onUpdate?: (
    events: string[],
    score: Record<string, number>,
    quarterScores: Record<string, number[]>,
    boxscore: Record<string, Record<string, PlayerStats>>
  ) => void
): Promise<MatchResult> {
  const score: Record<string, number> = {
    [teamA.id]: 0,
    [teamB.id]: 0
  };

  const quarterScores: Record<string, number[]> = {
    [teamA.id]: [0, 0, 0, 0],
    [teamB.id]: [0, 0, 0, 0]
  };

  const boxscore: Record<string, Record<string, PlayerStats>> = {
    [teamA.id]: {},
    [teamB.id]: {}
  };

  const events: string[] = [];

  const quarters = 4;
  const quarterTime = 12 * 60;

  const playersA: Player[] = teamA.players.map(p => ({ ...p }));
  const playersB: Player[] = teamB.players.map(p => ({ ...p }));

  let onCourtA = getStarters(playersA);
  let onCourtB = getStarters(playersB);

  // inicializa stats
  [...playersA, ...playersB].forEach(p => {
    boxscore[p.teamId] = boxscore[p.teamId] || {};
    boxscore[p.teamId][p.name] = {
      points: 0,
      fgm: 0,
      fga: 0,
      tpm: 0,
      tpa: 0,
      ftm: 0,
      fta: 0,
      energy: p.energy

    };
  });

  for (let q = 1; q <= quarters; q++) {
    events.push(`--- Quarter ${q} ---`);
    if (onUpdate) onUpdate([...events], { ...score }, { ...quarterScores }, { ...boxscore });

    let remainTime = quarterTime;

    while (remainTime > 0) {
      const possessionTime = Math.random() * (24 - 5) + 5;
      remainTime -= possessionTime;

      await sleep(1);
      if (remainTime < 0) break;

      const minute = Math.floor(remainTime / 60);
      const second = Math.floor(remainTime % 60);

      // Recuperação de energia dos jogadores no banco
      const benchA = playersA.filter(p => !onCourtA.includes(p));
      const benchB = playersB.filter(p => !onCourtB.includes(p));
      [...benchA, ...benchB].forEach(p => {
        p.energy = Math.min(100, p.energy + (10 * possessionTime) / 60);
      });

      if (Math.random() < 0.1) continue;

      const isTeamA = Math.random() < 0.5;
      const attackingTeam = isTeamA ? onCourtA : onCourtB;
      const defendingTeam = isTeamA ? onCourtB : onCourtA;
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

<<<<<<< Updated upstream
      if (shotType === 'FT') {
        for (let ft = 1; ft <= 2; ft++) {
          if (randomChance(chance)) {
            score[teamId] += 1;
            quarterScores[teamId][q - 1] += 1;
            stats.points += 1;
            stats.ftm += 1;
            stats.fta += 1;
            events.push(`[${minute}:${second < 10 ? '0' : ''}${second}] ${attacker.name} acerta um ${shotType}!`);
          } else {
            stats.fta += 1;
            events.push(`[${minute}:${second < 10 ? '0' : ''}${second}] ${attacker.name} erra um ${shotType}.`);
          }
=======
        while (remainTime > 0) {
            if (paused) {
                await new Promise<void>(resolve => { resolvePause = resolve });
            }
            const possessionTime = Math.random() * (24 - 5) + 5;
            remainTime -= possessionTime;

            await sleep(500);
            if (remainTime < 0) break;

            const minute = Math.floor(remainTime / 60);
            const second = Math.floor(remainTime % 60);

            if (Math.random() < 0.1) continue;

            const isTeamA = Math.random() < 0.5;
            const attackingTeam = isTeamA ? starters[teamA.id] : starters[teamB.id];
            const defendingTeam = isTeamA ? starters[teamB.id] : starters[teamA.id];
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
                        stats.ftm += 1;
                        stats.fta += 1;
                        events.push(`[${minute}:${second < 10 ? '0' : ''}${second}] ${attacker.name} acerta um ${shotType}!`);
                    } else {
                        stats.fta += 1;
                        events.push(`[${minute}:${second < 10 ? '0' : ''}${second}] ${attacker.name} erra um ${shotType}.`);
                    }
                }
            } else {
                if (randomChance(chance)) {
                    score[teamId] += points;
                    quarterScores[teamId][q - 1] += points;
                    stats.points += points;
                    stats.fgm++;
                    if (points === 3) stats.tpm++;
                    events.push(`[${minute}:${second < 10 ? '0' : ''}${second}] ${attacker.name} marca ${points} pontos (${shotType}).`);
                } else {
                    events.push(`[${minute}:${second < 10 ? '0' : ''}${second}] ${attacker.name} erra um ${shotType}.`);
                }
            }
            
            // Reduz energia do atacante
            attacker.energy = Math.max(attacker.energy - 5, 0);
            stats.energy = attacker.energy;

            // Recuperação de energia dos jogadores no banco
            const benchA = bench[teamA.id];
            const benchB = bench[teamB.id];
            [...benchA, ...benchB].forEach(p => {
                p.energy = Math.min(100, p.energy + 0.25);
                boxscore[p.teamId][p.name].energy = p.energy;
            });

            // Reduz energia dos jogadores em quadra
            const onCourtA = starters[teamA.id];
            const onCourtB = starters[teamB.id];
            [...onCourtA, ...onCourtB].forEach(p => {
                p.energy = Math.max(0, p.energy - 1);
                boxscore[p.teamId][p.name].energy = p.energy;
            });

            if (onUpdate) onUpdate([...events], { ...score }, { ...quarterScores }, { ...boxscore }, starters, bench);
>>>>>>> Stashed changes
        }
      } else {
        if (randomChance(chance)) {
          score[teamId] += points;
          quarterScores[teamId][q - 1] += points;
          stats.points += points;
          stats.fgm++;
          if (points === 3) stats.tpm++;
          events.push(`[${minute}:${second < 10 ? '0' : ''}${second}] ${attacker.name} marca ${points} pontos (${shotType}).`);
        } else {
          events.push(`[${minute}:${second < 10 ? '0' : ''}${second}] ${attacker.name} erra um ${shotType}.`);
        }
      }

      attacker.energy = Math.max(attacker.energy - 5, 0);

      // Substituição automática
      if (attacker.energy < 40) {
        substitutePlayer(isTeamA ? playersA : playersB, isTeamA ? onCourtA : onCourtB, attacker.position, events, minute, second);
      }

      stats.energy = attacker.energy;

      if (onUpdate) onUpdate([...events], { ...score }, { ...quarterScores }, { ...boxscore });
    }
  }

  return { score, quarterScores, events, boxscore };
}
