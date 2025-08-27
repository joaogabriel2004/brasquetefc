import { Team, Player } from "../../data/teams";
import { MatchResult, PlayerStats } from "./types";
import { randomChance, sleep } from "./utils";
import { getStarters } from "./lineup";
import { isPaused, waitWhilePaused } from "./pauseControl";

export async function simulateMatchAsync(
  teamA: Team,
  teamB: Team,
  onUpdate?: (
    events: string[],
    score: Record<string, number>,
    quarterScores: Record<string, number[]>,
    boxscore: Record<string, Record<string, PlayerStats>>,
    starters: Record<string, Player[]>,
    bench: Record<string, Player[]>
  ) => void
): Promise<MatchResult> {
  const score: Record<string, number> = {
    [teamA.id]: 0,
    [teamB.id]: 0,
  };

  const quarterScores: Record<string, number[]> = {
    [teamA.id]: [0, 0, 0, 0],
    [teamB.id]: [0, 0, 0, 0],
  };

  const boxscore: Record<string, Record<string, PlayerStats>> = {
    [teamA.id]: {},
    [teamB.id]: {},
  };

  const events: string[] = [];
  const quarters = 4;
  const quarterTime = 12 * 60;

  const playersA: Player[] = teamA.players.map((p) => ({ ...p }));
  const playersB: Player[] = teamB.players.map((p) => ({ ...p }));

  const starters: Record<string, Player[]> = {
    [teamA.id]: getStarters(playersA),
    [teamB.id]: getStarters(playersB),
  };

  const bench: Record<string, Player[]> = {
    [teamA.id]: playersA.filter((p) => !starters[teamA.id].includes(p)),
    [teamB.id]: playersB.filter((p) => !starters[teamB.id].includes(p)),
  };

  // inicializa stats
  [...playersA, ...playersB].forEach((p) => {
    boxscore[p.teamId] = boxscore[p.teamId] || {};
    boxscore[p.teamId][p.name] = {
      points: 0,
      fgm: 0,
      fga: 0,
      tpm: 0,
      tpa: 0,
      ftm: 0,
      fta: 0,
      energy: p.energy,
    };
  });

  for (let q = 1; q <= quarters; q++) {
    events.push(`--- Quarter ${q} ---`);
    if (onUpdate)
      onUpdate(
        [...events],
        { ...score },
        { ...quarterScores },
        { ...boxscore },
        starters,
        bench
      );

    let remainTime = quarterTime;

    while (remainTime > 0) {
      // respeita pausa
      if (isPaused()) {
        await waitWhilePaused();
      }

      const possessionTime = Math.random() * (24 - 5) + 5;
      remainTime -= possessionTime;

      await sleep(1);
      if (remainTime < 0) break;

      const minute = Math.floor(remainTime / 60);
      const second = Math.floor(remainTime % 60);

      if (Math.random() < 0.1) continue; // posse desperdiçada

      const isTeamA = Math.random() < 0.5;
      const attackingTeam = isTeamA ? starters[teamA.id] : starters[teamB.id];
      const defendingTeam = isTeamA ? starters[teamB.id] : starters[teamA.id];
      const teamId = isTeamA ? teamA.id : teamB.id;

      const attacker =
        attackingTeam[Math.floor(Math.random() * attackingTeam.length)];
      const defender =
        defendingTeam[Math.floor(Math.random() * defendingTeam.length)];
      const stats = boxscore[teamId][attacker.name];

      const rand = Math.random();
      let points = 0;
      let chance = 0;
      let shotType = "";
      const base = attacker.attack / (attacker.attack + defender.defense);

      if (rand < 0.55) {
        // 2 pontos
        points = 2;
        shotType = "2PT";
        const eFactor = 0.6 + 0.7 * (attacker.energy / 100); 
        chance = (0.35 + 0.4 * base) * eFactor;
        chance = Math.min(Math.max(chance, 0), 0.99); // clamp 0–99%
        stats.fga++;
      } else if (rand < 0.85) {
        // 3 pontos
        points = 3;
        shotType = "3PT";
        const eFactor = 0.55 + 0.6 * (attacker.energy / 100);
        chance = (0.18 + 0.25 * base) * eFactor;
        chance = Math.min(Math.max(chance, 0), 0.99); // clamp 0–99%
        stats.fga++;
        stats.tpa++;
      } else {
        // FT
        points = 1;
        shotType = "FT";
        const eFactor = 0.7 + 0.3 * (attacker.energy / 100);
        chance = (0.65 + (attacker.attack - 75) / 300) * eFactor;
        chance = Math.min(Math.max(chance, 0.40), 0.90);
      }

      if (shotType === "FT") {
        for (let ft = 1; ft <= 2; ft++) {
          if (randomChance(chance)) {
            score[teamId] += 1;
            quarterScores[teamId][q - 1] += 1;
            stats.points += 1;
            stats.ftm += 1;
            stats.fta += 1;
            events.push(`[${minute}:${second < 10 ? "0" : ""}${second}] ${attacker.name} acerta um ${shotType}!`);
          } else {
            stats.fta += 1;
            events.push(`[${minute}:${second < 10 ? "0" : ""}${second}] ${attacker.name} erra um ${shotType}.`);
          }
        }
      } else {
        if (randomChance(chance)) {
          score[teamId] += points;
          quarterScores[teamId][q - 1] += points;
          stats.points += points;
          stats.fgm++;
          if (points === 3) stats.tpm++;
          events.push(`[${minute}:${second < 10 ? "0" : ""}${second}] ${attacker.name} marca ${points} pontos. {${chance*100}%}`);
        } else {
          events.push(`[${minute}:${second < 10 ? "0" : ""}${second}] ${attacker.name} erra um ${shotType}. {${chance*100}%}`);
        }
      }

      // Reduz energia do atacante
      attacker.energy = Math.floor(attacker.energy - Math.random() * 3 - 1);
      stats.energy = attacker.energy;

      // Recuperação de energia no banco
      [...bench[teamA.id], ...bench[teamB.id]].forEach((p) => {
        p.energy = Math.min(100, p.energy + Math.floor(Math.random() * 2.75) + 0.25);
        boxscore[p.teamId][p.name].energy = p.energy;
      });

      [...starters[teamA.id], ...starters[teamB.id]].forEach((p) => {
        if (p.energy < 30 && bench[p.teamId].length > 0) {
          // substituição por cansaço (se houver banco)
          const subInIndex = Math.floor(Math.random() * bench[p.teamId].length);
          const subIn = bench[p.teamId][subInIndex];
          bench[p.teamId].splice(subInIndex, 1);
          bench[p.teamId].push(p);
          starters[p.teamId] = starters[p.teamId].filter((pl) => pl !== p);
          starters[p.teamId].push(subIn);
          events.push(`* ${p.name} sai por cansaço. Entra ${subIn.name}. *`);
        }
      });

      // Reduz energia dos titulares em quadra
      [...starters[teamA.id], ...starters[teamB.id]].forEach((p) => {
        p.energy = Math.max(0, p.energy - Math.floor(Math.random() * 1.75));
        boxscore[p.teamId][p.name].energy = p.energy;
      });

      if (onUpdate)
        onUpdate(
          [...events],
          { ...score },
          { ...quarterScores },
          { ...boxscore },
          starters,
          bench
        );
    }
  }

  // fim de jogo
  events.push("--- Fim do Jogo ---");
  if (onUpdate)
    onUpdate(
      [...events],
      { ...score },
      { ...quarterScores },
      { ...boxscore },
      starters,
      bench
    );

  return { score, quarterScores, events, boxscore, starters, bench };
}
