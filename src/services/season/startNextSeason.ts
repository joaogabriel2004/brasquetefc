import { getBrasqueteDB } from "@/db/brasqueteDb";
import { savesDb } from "@/db/savesDb";
import { developPlayer } from "./playerDevelopment";
import { generateDoubleRoundRobinSchedule } from "./scheduleService";

export async function startNextSeason(saveId: string): Promise<boolean> {
  const db = getBrasqueteDB(saveId);
  const league = await db.league.get("main");
  if (!league || league.currentRound <= league.totalRounds) return false;

  const nextSeason = league.season + 1;
  const teams = await db.teams.toArray();
  const players = await db.players.toArray();
  const untaggedGames = await db.games
    .filter((game) => game.season === undefined)
    .toArray();
  const updatedPlayers = new Map<string, (typeof players)[number]>();
  const updatedTeams = new Map(
    teams.map((team) => [team.id, { ...team, wins: 0, losses: 0 }]),
  );

  for (const player of players) {
    if (player.teamId === "free-agents") {
      updatedPlayers.set(player.id, {
        ...player,
        statsSeason: { points: 0, rebounds: 0, assists: 0 },
      });
      continue;
    }

    const developed = developPlayer(player);
    if ((developed.contractYears ?? 0) <= 1) {
      const previousTeam = updatedTeams.get(player.teamId);
      if (previousTeam) {
        previousTeam.playerIds = previousTeam.playerIds.filter(
          (id) => id !== player.id,
        );
        previousTeam.starterIds = previousTeam.starterIds?.filter(
          (id) => id !== player.id,
        );
      }
      updatedPlayers.set(player.id, {
        ...developed,
        teamId: "free-agents",
        contractYears: 0,
        statsSeason: { points: 0, rebounds: 0, assists: 0 },
      });
    } else {
      updatedPlayers.set(player.id, {
        ...developed,
        contractYears: (developed.contractYears ?? 2) - 1,
        statsSeason: { points: 0, rebounds: 0, assists: 0 },
      });
    }
  }

  const freeAgents = [...updatedPlayers.values()]
    .filter((player) => player.teamId === "free-agents")
    .sort(
      (left, right) =>
        right.attack + right.defense - left.attack - left.defense,
    );

  for (const team of updatedTeams.values()) {
    if (team.id === league.teamIdSelected) continue;
    const roster = [...updatedPlayers.values()].filter(
      (player) => player.teamId === team.id,
    );

    while (roster.length < 10) {
      const payroll = roster.reduce(
        (total, player) => total + (player.salary ?? 0),
        0,
      );
      const candidateIndex = freeAgents.findIndex(
        (player) => payroll + (player.salary ?? 0) <= (team.salaryCap ?? 160),
      );
      if (candidateIndex < 0) break;

      const [candidate] = freeAgents.splice(candidateIndex, 1);
      const signedPlayer = { ...candidate, teamId: team.id, contractYears: 2 };
      updatedPlayers.set(candidate.id, signedPlayer);
      team.playerIds.push(candidate.id);
      roster.push(signedPlayer);
    }
  }

  const teamIds = teams.map((team) => team.id);
  const games = generateDoubleRoundRobinSchedule(teamIds).map((game) => ({
    ...game,
    id: `S${nextSeason}-${game.id}`,
    season: nextSeason,
  }));

  await db.transaction(
    "rw",
    db.league,
    db.games,
    db.teams,
    db.players,
    async () => {
      await Promise.all([
        ...[...updatedTeams.values()].map((team) => db.teams.put(team)),
        ...[...updatedPlayers.values()].map((player) => db.players.put(player)),
        ...untaggedGames.map((game) =>
          db.games.update(game.id, { season: league.season }),
        ),
        ...games.map((game) => db.games.put(game)),
        db.league.update("main", {
          season: nextSeason,
          currentRound: 1,
          totalRounds: (teamIds.length - 1) * 2,
        }),
      ]);
    },
  );

  await savesDb.saves.update(saveId, { season: nextSeason });
  return true;
}
