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

    const homeTeamFull = {
      ...homeTeam,
      players: homePlayers
    };

    const awayTeamFull = {
      ...awayTeam,
      players: awayPlayers
    };

    const result = await simulateGame(homeTeamFull, awayTeamFull);

    if (!result) {
      console.error("Simulação falhou", g.id);
      continue;
    }

    await db.games.update(g.id, {
      played: true,
      score: {
        home: result.score[homeTeam.id],
        away: result.score[awayTeam.id]
      },
      quarterScores: result.quarterScores,
      boxscore: result.boxscore
    });

    await updateStandings(db, homeTeam.id, awayTeam.id, result.score);

        const teamsData = [
      { team: homeTeam, players: homePlayers },
      { team: awayTeam, players: awayPlayers }
    ];

    for (const { team, players } of teamsData) {
      for (const player of players) {
        const stats = result.boxscore[team.id][player.name];
        if (!stats) continue;

        await db.players.update(player.id, {
          statsSeason: {
            points: (player.statsSeason?.points ?? 0) + stats.points,
            rebounds: (player.statsSeason?.rebounds ?? 0) + (stats.rebounds ?? 0),
            assists: (player.statsSeason?.assists ?? 0) + (stats.assists ?? 0),
          },
          energy: stats.energy
        });
      }
    }

  // 🔁 avança rodada
  await db.league.update("main", {
    currentRound: league.currentRound + 1
  });

  console.log("Rodada avançada com sucesso");
  }
}