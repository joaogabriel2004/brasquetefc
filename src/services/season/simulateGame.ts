import { Team, Player } from "../../data/teams";
import { MatchResult, PlayerStats } from "@/utils/simulation/types";
import { randomChance, sleep } from "@/utils/simulation/utils";
import { getStarters, getControlledTeamId } from "@/utils/simulation/lineup";
import { isPaused, waitWhilePaused } from "@/utils/simulation/pauseControl";
import { getTactics } from "@/utils/simulation/tacticsControl";
import { getSimulationSpeed } from "@/utils/simulation/speedSimulation";

export async function simulateGame(
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

  const controlledTeamId = getControlledTeamId();

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

  const playersA = teamA.players.map((p) => ({ ...p }));
  const playersB = teamB.players.map((p) => ({ ...p }));

  const starters: Record<string, Player[]> = {
    [teamA.id]: getStarters(playersA),
    [teamB.id]: getStarters(playersB),
  };

  const bench: Record<string, Player[]> = {
    [teamA.id]: playersA.filter((p) => !starters[teamA.id].includes(p)),
    [teamB.id]: playersB.filter((p) => !starters[teamB.id].includes(p)),
  };

  [...playersA, ...playersB].forEach((p) => {
    boxscore[p.teamId] = boxscore[p.teamId] || {};
    boxscore[p.teamId][p.name] = {
      points: 0,
      rebounds: 0,
      assists: 0,
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

    let remainTime = quarterTime;

    while (remainTime > 0) {
      if (isPaused()) await waitWhilePaused();

      const isTeamA = Math.random() < 0.5;
      const attackingTeam = isTeamA ? starters[teamA.id] : starters[teamB.id];
      const defendingTeam = isTeamA ? starters[teamB.id] : starters[teamA.id];
      const teamId = isTeamA ? teamA.id : teamB.id;

      const teamTactics =
        teamId === controlledTeamId
          ? getTactics()
          : { ritmo: "medio", foco: "garrafao", defesa: "homem" };

      const possessionTime = Math.random() * 19 + 5;
      remainTime -= possessionTime;

      // await sleep(200 / getSimulationSpeed());
      if (remainTime < 0) break;

      if (Math.random() < 0.1) continue;

      const attacker = attackingTeam[Math.floor(Math.random() * attackingTeam.length)];
      const defender = defendingTeam[Math.floor(Math.random() * defendingTeam.length)];
      const stats = boxscore[teamId][attacker.name];

      let points = 2;
      let chance = attacker.attack / (attacker.attack + defender.defense);

      if (Math.random() < 0.3) {
        points = 3;
        chance *= 0.8;
        stats.tpa++;
      }

      stats.fga++;

      if (randomChance(chance)) {
        score[teamId] += points;
        quarterScores[teamId][q - 1] += points;
        stats.points += points;
        stats.fgm++;
        if (points === 3) stats.tpm++;
      }

      attacker.energy -= 2;
      defender.energy -= 1;

      onUpdate?.([...events], { ...score }, { ...quarterScores }, { ...boxscore }, starters, bench);
    }
  }

  events.push("--- Fim do Jogo ---");

  return { score, quarterScores, events, boxscore, starters, bench };
}