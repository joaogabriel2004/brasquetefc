    import { db } from "../../db/brasqueteDb";

export async function simulateGame(gameId: string) {
  const game = await db.games.get(gameId);
  if (!game) return;

  // aqui entra seu match.ts e o resultado real calculado no final
  const result = {
    home: Math.round(Math.random() * 120),
    away: Math.round(Math.random() * 120),
  };

  await db.games.update(gameId, {
    played: true,
    score: result,
  });

  // atualizar standings
  if (result.home > result.away) {
    await db.teams.update(game.homeTeam, (t) => ({ wins: t.wins + 1 }));
    await db.teams.update(game.awayTeam, (t) => ({ losses: t.losses + 1 }));
  } else {
    await db.teams.update(game.awayTeam, (t) => ({ wins: t.wins + 1 }));
    await db.teams.update(game.homeTeam, (t) => ({ losses: t.losses + 1 }));
  }
}
