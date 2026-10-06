import type { ShotPriorities, Tactics } from "@/data/teams";
import type { PlayerDB, TeamDB } from "@/db/brasqueteDb";
import { type GameDB, getBrasqueteDB } from "@/db/brasqueteDb";
import { type SaveMetaDB, savesDb } from "@/db/savesDb";
import type { MatchResult } from "@/utils/simulation/types";
import { updateStandings } from "./updateStandings";

export type MatchTeamData = TeamDB & { players: PlayerDB[] };

export type LoadedMatchData = {
  game: GameDB;
  save: SaveMetaDB | undefined;
  homeTeam: MatchTeamData;
  awayTeam: MatchTeamData;
};

export async function loadMatchData(
  saveId: string,
  gameId: string,
): Promise<LoadedMatchData | null> {
  const db = getBrasqueteDB(saveId);
  const [save, game] = await Promise.all([
    savesDb.saves.get(saveId),
    db.games.get(gameId),
  ]);
  if (!game) return null;

  const [homeTeam, awayTeam] = await Promise.all([
    db.teams.get(game.homeTeam),
    db.teams.get(game.awayTeam),
  ]);
  if (!homeTeam || !awayTeam) return null;

  const [homePlayers, awayPlayers] = await Promise.all([
    db.players.where("teamId").equals(homeTeam.id).toArray(),
    db.players.where("teamId").equals(awayTeam.id).toArray(),
  ]);

  return {
    game,
    save,
    homeTeam: { ...homeTeam, players: homePlayers },
    awayTeam: { ...awayTeam, players: awayPlayers },
  };
}

export async function recordMatchResult(
  saveId: string,
  gameId: string,
  homeTeamId: string,
  awayTeamId: string,
  result: MatchResult,
): Promise<boolean> {
  const db = getBrasqueteDB(saveId);
  return db.transaction("rw", db.games, db.teams, db.players, async () => {
    const game = await db.games.get(gameId);
    if (!game || game.played) return false;

    await db.games.update(gameId, {
      played: true,
      score: result.score,
      quarterScores: result.quarterScores,
      boxscore: result.boxscore,
    });
    await updateStandings(db, homeTeamId, awayTeamId, result.score);

    for (const teamId of [homeTeamId, awayTeamId]) {
      const players = await db.players.where("teamId").equals(teamId).toArray();
      const playerStats = result.boxscore[teamId];

      for (const player of players) {
        const stats = playerStats[player.name];
        if (!stats) continue;

        await db.players.update(player.id, {
          statsSeason: {
            points: (player.statsSeason?.points ?? 0) + stats.points,
            rebounds: (player.statsSeason?.rebounds ?? 0) + stats.rebounds,
            assists: (player.statsSeason?.assists ?? 0) + stats.assists,
          },
          energy: stats.energy,
        });
      }
    }

    return true;
  });
}

export async function isGamePlayed(
  saveId: string,
  gameId: string,
): Promise<boolean> {
  const game = await getBrasqueteDB(saveId).games.get(gameId);
  return game?.played ?? false;
}

export async function saveMatchTactics(
  saveId: string,
  teamId: string,
  tactics: Tactics,
): Promise<void> {
  await getBrasqueteDB(saveId).teams.update(teamId, { tactics });
}

export async function saveMatchShotPriorities(
  saveId: string,
  teamId: string,
  shotPriorities: ShotPriorities,
): Promise<void> {
  await getBrasqueteDB(saveId).teams.update(teamId, { shotPriorities });
}
