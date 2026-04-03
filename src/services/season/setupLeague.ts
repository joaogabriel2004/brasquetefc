import {
  getBrasqueteDB,
  TeamDB,
  PlayerDB,
  GameDB,
  LeagueDB
} from '../../db/brasqueteDb';

import { teamsReal, Team, Player } from '../../data/teams';
import { generateDoubleRoundRobinSchedule } from './scheduleService';
import { savesDb } from '../../db/savesDb';

/* =======================
   MAPPERS
======================= */

function toPlayerDB(p: Player): PlayerDB {
  return {
    id: p.id,
    name: p.name,
    position: p.position,
    attack: p.attack,
    defense: p.defense,
    energy: p.energy,
    teamId: p.teamId,
    statsSeason: {
      points: 0,
      rebounds: 0,
      assists: 0
    }
  };
}

function toTeamDB(t: Team): TeamDB {
  return {
    id: t.id,
    name: t.name,
    playerIds: t.players.map(p => p.id),
    wins: 0,
    losses: 0
  };
}

/* =======================
   SETUP NEW LEAGUE
======================= */

export async function setupNewLeague(
  selectedTeamId: string,
  coachName: string,
  saveId: string
) {
  const db = getBrasqueteDB(saveId);

  /* ===== TUDO FORA DA TRANSACTION ===== */
  const teamDBs: TeamDB[] = teamsReal.map(toTeamDB);

  const playerDBs: PlayerDB[] =
    teamsReal.flatMap(team =>
      team.players.map(toPlayerDB)
    );

  const teamIds = teamDBs.map(t => t.id);

  const games: GameDB[] =
    generateDoubleRoundRobinSchedule(teamIds);

  const totalRounds = (teamIds.length - 1) * 2;

  const league: LeagueDB = {
    id: 'main',
    season: 1,
    coachName,
    teamIdSelected: selectedTeamId,
    currentRound: 1,
    totalRounds,
    teamIds
  };

  /* ===== TRANSACTION LIMPA ===== */
  await db.transaction(
    'rw',
    db.teams,
    db.players,
    db.games,
    db.league,
    () => {
      return Promise.all([
        db.teams.bulkPut(teamDBs),
        db.players.bulkPut(playerDBs),
        db.games.bulkPut(games),
        db.league.put(league)
      ]);
    }
  );

  /* ===== OUTRO BANCO ===== */
  await savesDb.saves.put({
    saveId,
    coachName,
    teamId: selectedTeamId,
    teamName: teamDBs.find(t => t.id === selectedTeamId)!.name,
    season: 1,
    createdAt: Date.now(),
    lastPlayedAt: Date.now()
  });

  console.log(`🏀 League criada com sucesso | save=${saveId}`);
}