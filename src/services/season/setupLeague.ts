import {
  freeAgentPool,
  type Player,
  type Team,
  teamsReal,
} from "../../data/teams";
import {
  type GameDB,
  getBrasqueteDB,
  type LeagueDB,
  type PlayerDB,
  type TeamDB,
} from "../../db/brasqueteDb";
import { savesDb } from "../../db/savesDb";
import { getPlayerAttributes } from "../../utils/simulation/playerRatings";
import { generateDoubleRoundRobinSchedule } from "./scheduleService";

/* =======================
   MAPPERS
======================= */

function toPlayerDB(p: Player): PlayerDB {
  const stableSeed = [...p.id].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
  const age = p.age ?? 20 + (stableSeed % 17);
  const overall = Math.round((p.attack + p.defense) / 2);

  return {
    id: p.id,
    name: p.name,
    position: p.position,
    attack: p.attack,
    defense: p.defense,
    energy: p.energy,
    teamId: p.teamId,
    attributes: getPlayerAttributes(p),
    age,
    potential:
      p.potential ??
      Math.min(99, Math.max(overall, overall + Math.max(2, (30 - age) * 0.7))),
    salary: p.salary ?? Math.max(1, Math.round(1 + (overall - 55) * 0.38)),
    contractYears: p.contractYears ?? 1 + (stableSeed % 4),
    trainingFocus: p.trainingFocus ?? "arremesso",
    statsSeason: {
      points: 0,
      rebounds: 0,
      assists: 0,
    },
  };
}

function toTeamDB(t: Team): TeamDB {
  return {
    id: t.id,
    name: t.name,
    playerIds: t.players.map((p) => p.id),
    wins: 0,
    losses: 0,
    salaryCap: t.salaryCap ?? 160,
  };
}

/* =======================
   SETUP NEW LEAGUE
======================= */

export async function setupNewLeague(
  selectedTeamId: string,
  coachName: string,
  saveId: string,
) {
  const db = getBrasqueteDB(saveId);

  /* ===== TUDO FORA DA TRANSACTION ===== */
  const teamDBs: TeamDB[] = teamsReal.map(toTeamDB);

  const playerDBs: PlayerDB[] = [
    ...teamsReal.flatMap((team) => team.players.map(toPlayerDB)),
    ...freeAgentPool.map(toPlayerDB),
  ];

  const teamIds = teamDBs.map((t) => t.id);

  const games: GameDB[] = generateDoubleRoundRobinSchedule(teamIds).map(
    (game) => ({
      ...game,
      season: 1,
    }),
  );

  const totalRounds = (teamIds.length - 1) * 2;

  const league: LeagueDB = {
    id: "main",
    season: 1,
    coachName,
    teamIdSelected: selectedTeamId,
    currentRound: 1,
    totalRounds,
    teamIds,
  };

  /* ===== TRANSACTION LIMPA ===== */
  await db.transaction("rw", db.teams, db.players, db.games, db.league, () => {
    return Promise.all([
      db.teams.bulkPut(teamDBs),
      db.players.bulkPut(playerDBs),
      db.games.bulkPut(games),
      db.league.put(league),
    ]);
  });

  /* ===== OUTRO BANCO ===== */
  await savesDb.saves.put({
    saveId,
    coachName,
    teamId: selectedTeamId,
    teamName: teamDBs.find((team) => team.id === selectedTeamId)?.name ?? "",
    season: 1,
    createdAt: Date.now(),
    lastPlayedAt: Date.now(),
  });

  console.log(`🏀 League criada com sucesso | save=${saveId}`);
}
