import { BrasqueteDB } from "@/db/brasqueteDb";

export async function updateStandings(
  db: BrasqueteDB,
  homeTeamId: string,
  awayTeamId: string,
  score: Record<string, number>
) {
  const homeScore = score[homeTeamId];
  const awayScore = score[awayTeamId];

  const homeTeam = await db.teams.get(homeTeamId);
  const awayTeam = await db.teams.get(awayTeamId);

  if (!homeTeam || !awayTeam) return;

  if (homeScore > awayScore) {
    // vitória mandante
    await db.teams.update(homeTeamId, {
      wins: (homeTeam.wins ?? 0) + 1
    });

    await db.teams.update(awayTeamId, {
      losses: (awayTeam.losses ?? 0) + 1
    });

  } else {
    // vitória visitante
    await db.teams.update(awayTeamId, {
      wins: (awayTeam.wins ?? 0) + 1
    });

    await db.teams.update(homeTeamId, {
      losses: (homeTeam.losses ?? 0) + 1
    });
  }
}