import type { GameDB, LeagueDB, PlayerDB, TeamDB } from "@/db/brasqueteDb";
import { getBrasqueteDB } from "@/db/brasqueteDb";

export type SeasonDashboardData = {
  league: LeagueDB;
  games: GameDB[];
  teams: TeamDB[];
  players: PlayerDB[];
  latestGame: GameDB | null;
  seasonGames: GameDB[];
};

export async function loadSeasonDashboard(
  saveId: string,
): Promise<SeasonDashboardData | null> {
  const db = getBrasqueteDB(saveId);
  const league = await db.league.get("main");
  if (!league) return null;

  const [games, teams, players, seasonGames] = await Promise.all([
    db.games
      .where("round")
      .equals(league.currentRound)
      .toArray()
      .then((items) =>
        items.filter(
          (game) => (game.season ?? league.season) === league.season,
        ),
      ),
    db.teams.toArray(),
    db.players.toArray(),
    db.games
      .filter(
        (game) =>
          game.played &&
          (game.homeTeam === league.teamIdSelected ||
            game.awayTeam === league.teamIdSelected),
      )
      .toArray(),
  ]);

  seasonGames.sort(
    (left, right) =>
      (right.season ?? league.season) - (left.season ?? league.season) ||
      right.round - left.round,
  );

  return {
    league,
    games,
    teams,
    players,
    latestGame: seasonGames[0] ?? null,
    seasonGames,
  };
}
