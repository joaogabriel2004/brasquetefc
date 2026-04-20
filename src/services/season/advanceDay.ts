import { getBrasqueteDB } from "../../db/brasqueteDb";

export async function advanceDay(saveId: string) {
  const db = getBrasqueteDB(saveId);

  const league = await db.league.get("current");
  if (!league) return;

  const games = await db.games
    .where("round")
    .equals(league.currentRound)
    .toArray();

  for (const g of games) {
    if (g.played) continue;

    // simulação rápida (placeholder)
    const home = Math.round(Math.random() * 120);
    const away = Math.round(Math.random() * 120);

    await db.games.update(g.id, {
      played: true,
      score: { home, away }
    });
  }

  // Avança rodada
  await db.league.update("current", {
    currentRound: league.currentRound + 1
  });
}
