import {
  DEFAULT_TACTICS,
  type Player,
  type ShotPriorities,
  type Tactics,
  type Team,
} from "../../data/teams";
import { getStarters, selectShooter } from "./lineup";
import {
  getFatigueFactor,
  getPlayerAttributes,
  shotAccuracy,
  weightedPlayer,
} from "./playerRatings";
import type { MatchResult, PlayerStats } from "./types";
import { randomChance } from "./utils";

export type MatchSimulationOptions = {
  getTactics?: (teamId: string) => Partial<Tactics> | undefined;
  getShotPriorities?: (teamId: string) => ShotPriorities | undefined;
  random?: () => number;
  beforePossession?: () => Promise<void>;
  onUpdate?: (snapshot: MatchResult) => void | Promise<void>;
};

export async function simulateMatchAsync(
  teamA: Team,
  teamB: Team,
  options: MatchSimulationOptions = {},
): Promise<MatchResult> {
  const random = options.random ?? Math.random;
  // --- Pontuações e Estatísticas ---
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

  // --- Clonagem dos jogadores ---
  const playersA = teamA.players.map((p) => ({ ...p }));
  const playersB = teamB.players.map((p) => ({ ...p }));

  // --- Titulares e reservas ---
  const starters: Record<string, Player[]> = {
    [teamA.id]: getStarters(playersA, teamA.starterIds),
    [teamB.id]: getStarters(playersB, teamB.starterIds),
  };

  const bench: Record<string, Player[]> = {
    [teamA.id]: playersA.filter((p) => !starters[teamA.id].includes(p)),
    [teamB.id]: playersB.filter((p) => !starters[teamB.id].includes(p)),
  };

  // --- Inicializa estatísticas ---
  [...playersA, ...playersB].forEach((p) => {
    boxscore[p.teamId] = boxscore[p.teamId] || {};
    boxscore[p.teamId][p.name] = {
      points: 0,
      fgm: 0,
      fga: 0,
      twoPM: 0,
      twoPA: 0,
      tpm: 0,
      tpa: 0,
      ftm: 0,
      fta: 0,
      energy: p.energy,
      assists: 0,
      rebounds: 0,
      turnovers: 0,
      steals: 0,
      blocks: 0,
      fouls: 0,
    };
  });

  // --- Loop principal dos quartos ---
  for (let q = 1; q <= quarters; q++) {
    events.push(`--- Quarter ${q} ---`);

    await options.onUpdate?.({
      events: [...events],
      score: { ...score },
      quarterScores: { ...quarterScores },
      boxscore: { ...boxscore },
      starters,
      bench,
    });

    let remainTime = quarterTime;

    while (remainTime > 0) {
      await options.beforePossession?.();

      // --- Seleciona time de ataque/defesa ---
      const isTeamA = random() < 0.5;
      const attackingTeam = isTeamA ? starters[teamA.id] : starters[teamB.id];
      const defendingTeam = isTeamA ? starters[teamB.id] : starters[teamA.id];
      const teamId = isTeamA ? teamA.id : teamB.id;

      // --- Táticas ---
      const attackingTeamData = teamId === teamA.id ? teamA : teamB;
      const teamTactics = {
        ...DEFAULT_TACTICS,
        ...attackingTeamData.tactics,
        ...options.getTactics?.(teamId),
      };

      // --- Controle de tempo ---
      const possessionTime =
        teamTactics.ritmo === "rapido"
          ? random() * 14 + 5
          : teamTactics.ritmo === "lento"
            ? random() * 16 + 8
            : random() * 19 + 5;
      remainTime -= possessionTime;
      if (remainTime < 0) break;

      // --- Cálculo de tempo ---
      const minute = Math.floor(remainTime / 60);
      const second = Math.floor(remainTime % 60);
      const averagePlaymaking =
        attackingTeam.reduce(
          (total, player) => total + getPlayerAttributes(player).playmaking,
          0,
        ) / attackingTeam.length;
      const averageSteals =
        defendingTeam.reduce(
          (total, player) => total + getPlayerAttributes(player).steals,
          0,
        ) / defendingTeam.length;
      const turnoverChance = Math.min(
        0.2,
        Math.max(
          0.06,
          0.12 +
            (70 - averagePlaymaking) * 0.0012 +
            (averageSteals - 70) * 0.0007,
        ),
      );

      if (random() < turnoverChance) {
        const turnoverPlayer = weightedPlayer(
          attackingTeam,
          (player) => 110 - getPlayerAttributes(player).playmaking,
          random,
        );
        boxscore[teamId][turnoverPlayer.name].turnovers++;
        const stealingPlayer = weightedPlayer(
          defendingTeam,
          (player) => getPlayerAttributes(player).steals,
          random,
        );
        const stealChance = Math.min(
          0.78,
          Math.max(
            0.12,
            0.38 + (getPlayerAttributes(stealingPlayer).steals - 70) * 0.009,
          ),
        );
        if (random() < stealChance) {
          boxscore[stealingPlayer.teamId][stealingPlayer.name].steals++;
        }
        continue;
      }

      // --- Escolhe atacante e defensor ---
      const shotPriorities =
        options.getShotPriorities?.(teamId) ??
        attackingTeamData.shotPriorities ??
        {};
      const attacker = selectShooter(attackingTeam, shotPriorities, random);
      const defendingTeamData = teamId === teamA.id ? teamB : teamA;
      const defenseTactics: Tactics = {
        ...DEFAULT_TACTICS,
        ...defendingTeamData.tactics,
        ...options.getTactics?.(defendingTeamData.id),
      };
      const defender = weightedPlayer(
        defendingTeam,
        (player) => {
          const attributes = getPlayerAttributes(player);
          return attributes.perimeterDefense + attributes.interiorDefense;
        },
        random,
      );
      const stats = boxscore[teamId][attacker.name];

      // --- Define arremesso ou falta ---
      const rand = random();
      let points = 0;
      let chance = 0;
      let shotType = "";

      const attackerRatings = getPlayerAttributes(attacker);
      const foulChance = Math.min(
        0.16,
        0.08 + attackerRatings.insideScoring * 0.0007,
      );
      const threePointShare = teamTactics.foco === "perimetro" ? 0.38 : 0.24;

      if (rand < foulChance) {
        shotType = "FT";
        boxscore[defender.teamId][defender.name].fouls++;
        events.push(
          `[${minute}:${second.toString().padStart(2, "0")}] Falta de ${defender.name} em ${attacker.name}.`,
        );
        chance = Math.min(
          0.92,
          Math.max(
            0.4,
            (0.68 + (attackerRatings.freeThrowShooting - 70) * 0.004) *
              getFatigueFactor(attacker),
          ),
        );
      } else if (rand < foulChance + (1 - foulChance) * threePointShare) {
        points = 3;
        shotType = "3PT";
        chance = shotAccuracy(
          attacker,
          defender,
          "threePoint",
          defenseTactics.defesa,
        );
        stats.fga++;
        stats.tpa++;
      } else {
        const insideShare = teamTactics.foco === "garrafao" ? 0.72 : 0.48;
        const shotLocation = random() < insideShare ? "inside" : "midRange";
        points = 2;
        shotType = "2PT";
        chance = shotAccuracy(
          attacker,
          defender,
          shotLocation,
          defenseTactics.defesa,
        );
        stats.fga++;
        stats.twoPA++;
      }

      // --- Execução do lance ---
      let shotMade = false;
      let blockedShot = false;
      if (shotType === "FT") {
        for (let ft = 1; ft <= 2; ft++) {
          if (randomChance(chance)) {
            score[teamId] += 1;
            quarterScores[teamId][q - 1] += 1;
            stats.points += 1;
            stats.ftm += 1;
            stats.fta += 1;
            events.push(
              `[${minute}:${second.toString().padStart(2, "0")}] ${attacker.name} acerta um ${shotType}!`,
            );
          } else {
            stats.fta += 1;
            events.push(
              `[${minute}:${second.toString().padStart(2, "0")}] ${attacker.name} erra um ${shotType}.`,
            );
          }
        }
      } else {
        const blockChance =
          shotType === "2PT"
            ? Math.min(
                0.16,
                Math.max(
                  0.015,
                  (getPlayerAttributes(defender).blocks - 55) * 0.002,
                ),
              )
            : Math.min(
                0.07,
                Math.max(
                  0.005,
                  (getPlayerAttributes(defender).blocks - 70) * 0.001,
                ),
              );
        blockedShot = random() < blockChance;
        if (!blockedShot && randomChance(chance)) {
          shotMade = true;
          score[teamId] += points;
          quarterScores[teamId][q - 1] += points;
          stats.points += points;
          stats.fgm++;
          if (points === 3) stats.tpm++;
          else stats.twoPM++;

          const assistCandidates = attackingTeam.filter(
            (player) => player.id !== attacker.id,
          );
          if (assistCandidates.length > 0) {
            const assister = weightedPlayer(
              assistCandidates,
              (player) => getPlayerAttributes(player).playmaking,
              random,
            );
            const assistChance = Math.min(
              0.82,
              Math.max(
                0.22,
                0.2 + getPlayerAttributes(assister).playmaking * 0.006,
              ),
            );
            if (random() < assistChance) {
              boxscore[teamId][assister.name].assists++;
            }
          }
          events.push(
            `[${minute}:${second.toString().padStart(2, "0")}] ${attacker.name} marca ${points} pontos.`,
          );
        } else {
          events.push(
            `[${minute}:${second.toString().padStart(2, "0")}] ${attacker.name} erra um ${shotType}.`,
          );
        }
      }

      if (!shotMade && shotType !== "FT") {
        if (blockedShot) {
          boxscore[defender.teamId][defender.name].blocks++;
        }
        const reboundTeam = random() < 0.72 ? defendingTeam : attackingTeam;
        const rebounder = weightedPlayer(
          reboundTeam,
          (player) => getPlayerAttributes(player).rebounding,
          random,
        );
        boxscore[rebounder.teamId][rebounder.name].rebounds++;
      }

      [...starters[teamA.id], ...starters[teamB.id]].forEach((player) => {
        const stamina = getPlayerAttributes(player).stamina;
        const fastPace =
          player.teamId === teamId && teamTactics.ritmo === "rapido" ? 1.45 : 1;
        const fatigue = (0.18 + random() * 0.22) * (100 / stamina) * fastPace;
        player.energy = Math.max(0, player.energy - fatigue);
        boxscore[player.teamId][player.name].energy = player.energy;
      });
      attacker.energy = Math.max(
        0,
        attacker.energy - (100 / getPlayerAttributes(attacker).stamina) * 0.35,
      );
      boxscore[attacker.teamId][attacker.name].energy = attacker.energy;

      // Recuperação de energia no banco
      [...bench[teamA.id], ...bench[teamB.id]].forEach((p) => {
        const recovery = 0.45 + getPlayerAttributes(p).stamina * 0.006;
        p.energy = Math.min(100, p.energy + recovery);
        boxscore[p.teamId][p.name].energy = p.energy;
      });

      // -- Substituição automática de jogadores cansados --
      [teamA.id, teamB.id].forEach((rotatingTeamId) => {
        for (const tiredPlayer of [...starters[rotatingTeamId]]) {
          const fouledOut =
            boxscore[tiredPlayer.teamId][tiredPlayer.name].fouls >= 6;
          if (
            (!fouledOut && tiredPlayer.energy >= 60) ||
            bench[rotatingTeamId].length === 0
          )
            continue;
          const restedPlayer = weightedPlayer(
            bench[rotatingTeamId],
            (player) =>
              player.energy + getPlayerAttributes(player).stamina * 0.3,
            random,
          );
          if (!fouledOut && restedPlayer.energy < tiredPlayer.energy + 12)
            continue;

          bench[rotatingTeamId] = bench[rotatingTeamId].filter(
            (player) => player.id !== restedPlayer.id,
          );
          bench[rotatingTeamId].push(tiredPlayer);
          starters[rotatingTeamId] = starters[rotatingTeamId].filter(
            (player) => player.id !== tiredPlayer.id,
          );
          starters[rotatingTeamId].push(restedPlayer);
          events.push(
            fouledOut
              ? `* ${tiredPlayer.name} cometeu a 6ª falta e está fora. Entra ${restedPlayer.name}. *`
              : `* ${tiredPlayer.name} sai por cansaço. Entra ${restedPlayer.name}. *`,
          );
        }
      });

      // --- Atualização visual ---
      await options.onUpdate?.({
        events: [...events],
        score: { ...score },
        quarterScores: { ...quarterScores },
        boxscore: { ...boxscore },
        starters,
        bench,
      });
    }
  }

  // --- Fim do jogo ---
  events.push("--- Fim do Jogo ---");
  const result = { score, quarterScores, events, boxscore, starters, bench };
  await options.onUpdate?.(result);

  return result;
}
