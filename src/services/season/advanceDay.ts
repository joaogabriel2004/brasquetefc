import { getBrasqueteDB } from "../../db/brasqueteDb";
import { simulateGame } from "../season/simulateGame";
import { updateStandings } from "../season/updateStandings";

export async function advanceDay(saveId: string) {
  const db = getBrasqueteDB(saveId);

  const league = await db.league.get("main");
  if (!league) {
    console.error("League não encontrada");
    return;
  }

  const games = await db.games
    .where("round")
    .equals(league.currentRound)
    .toArray();

  for (const g of games) {
    if (g.played) continue;

    const homeTeam = await db.teams.get(g.homeTeam);
    const awayTeam = await db.teams.get(g.awayTeam);

    if (!homeTeam || !awayTeam) continue;

    const homePlayers = await db.players.where("teamId").equals(homeTeam.id).toArray();
    const awayPlayers = await db.players.where("teamId").equals(awayTeam.id).toArray();

    homeTeam.players = homePlayers;
    awayTeam.players = awayPlayers;

    const result = await simulateGame(homeTeam, awayTeam);

    if (!result) {
      console.error("Simulação falhou", g.id);
      continue;
    }

    // salva jogo
    await db.games.update(g.id, {
      played: true,
      score: result.score,
      quarterScores: result.quarterScores,
      boxscore: result.boxscore
    });

    await db.games.update(g.id, {
      played: true,
      score: result.score,
      quarterScores: result.quarterScores,
      boxscore: result.boxscore
    });

await updateStandings(db, homeTeam.id, awayTeam.id, result.score);

    for (const team of [homeTeam, awayTeam]) {
      for (const player of team.players) {
        const stats = result.boxscore[team.id][player.name];
        if (!stats) continue;

        const current = await db.players.get(player.id);

        await db.players.update(player.id, {
          statsSeason: {
            points: (current?.statsSeason?.points ?? 0) + stats.points,
            rebounds: (current?.statsSeason?.rebounds ?? 0) + (stats.rebounds ?? 0),
            assists: (current?.statsSeason?.assists ?? 0) + (stats.assists ?? 0),
          },
          energy: stats.energy
        });
      }
    }
  }

  // 🔁 avança rodada
  await db.league.update("main", {
    currentRound: league.currentRound + 1
  });

  console.log("Rodada avançada com sucesso");
}