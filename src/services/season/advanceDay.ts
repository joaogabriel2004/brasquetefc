import { getBrasqueteDB } from "../../db/brasqueteDb";
import { recordMatchResult } from "./matchData";
import { simulateGame } from "./simulateGame";

export async function advanceDay(saveId: string) {
  const db = getBrasqueteDB(saveId);
  const league = await db.league.get("main");
  if (!league) return;

  const games = (
    await db.games.where("round").equals(league.currentRound).toArray()
  ).filter((game) => (game.season ?? 1) === league.season);

  for (const game of games) {
    if (game.played) continue;

    const [homeTeam, awayTeam] = await Promise.all([
      db.teams.get(game.homeTeam),
      db.teams.get(game.awayTeam),
    ]);
    if (!homeTeam || !awayTeam) continue;

    const [homePlayers, awayPlayers] = await Promise.all([
      db.players.where("teamId").equals(homeTeam.id).toArray(),
      db.players.where("teamId").equals(awayTeam.id).toArray(),
    ]);

    const result = await simulateGame(
      { ...homeTeam, players: homePlayers },
      { ...awayTeam, players: awayPlayers },
    );
    await recordMatchResult(saveId, game.id, homeTeam.id, awayTeam.id, result);
  }

  const remainingGames = (
    await db.games.where("round").equals(league.currentRound).toArray()
  ).filter((game) => (game.season ?? 1) === league.season);

  if (
    remainingGames.length > 0 &&
    remainingGames.every((game) => game.played)
  ) {
    const roster = await db.players.toArray();
    await Promise.all(
      roster.map((player) =>
        db.players.update(player.id, {
          energy: Math.min(100, (player.energy ?? 100) + 18),
        }),
      ),
    );

    await db.league.update("main", {
      currentRound: league.currentRound + 1,
    });
  }
}
