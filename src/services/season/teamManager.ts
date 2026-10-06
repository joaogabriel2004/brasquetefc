import {
  freeAgentPool,
  type Player,
  type ShotPriorities,
  type Tactics,
  type TrainingFocus,
} from "@/data/teams";
import type { PlayerDB, TeamDB } from "@/db/brasqueteDb";
import { getBrasqueteDB } from "@/db/brasqueteDb";
import { getPlayerAttributes } from "@/utils/simulation/playerRatings";
import { evaluateTrade, type TradeEvaluation } from "./tradeEvaluation";

export type TeamManagerData = {
  team: TeamDB;
  players: PlayerDB[];
  freeAgents: PlayerDB[];
  tradeOptions: PlayerDB[];
  tradeTeams: TeamDB[];
  payroll: number;
};

function fillCareerData(player: PlayerDB): PlayerDB {
  const seed = [...player.id].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
  const age = player.age ?? 20 + (seed % 17);
  const overall = Math.round((player.attack + player.defense) / 2);

  return {
    ...player,
    attributes: player.attributes ?? getPlayerAttributes(player),
    age,
    potential:
      player.potential ??
      Math.min(99, Math.max(overall, overall + Math.max(2, (30 - age) * 0.7))),
    salary: player.salary ?? Math.max(1, Math.round(1 + (overall - 55) * 0.38)),
    contractYears: player.contractYears ?? 2,
    trainingFocus: player.trainingFocus ?? "arremesso",
  };
}

function toFreeAgent(player: Player): PlayerDB {
  return fillCareerData({
    ...player,
    statsSeason: { points: 0, rebounds: 0, assists: 0 },
  });
}

export async function loadTeamManager(
  saveId: string,
): Promise<TeamManagerData | null> {
  const db = getBrasqueteDB(saveId);
  const league = await db.league.get("main");
  if (!league) return null;

  const storedTeam = await db.teams.get(league.teamIdSelected);
  if (!storedTeam) return null;

  const [allPlayers, allTeams] = await Promise.all([
    db.players.toArray(),
    db.teams.toArray(),
  ]);
  const existingIds = new Set(allPlayers.map((player) => player.id));
  const missingFreeAgents = freeAgentPool
    .filter((player) => !existingIds.has(player.id))
    .map(toFreeAgent);
  if (missingFreeAgents.length > 0) {
    await db.players.bulkPut(missingFreeAgents);
    allPlayers.push(...missingFreeAgents);
  }

  const team = { ...storedTeam, salaryCap: storedTeam.salaryCap ?? 160 };
  const normalizedPlayers = allPlayers.map(fillCareerData);
  const players = normalizedPlayers.filter(
    (player) => player.teamId === team.id,
  );
  const freeAgents = normalizedPlayers.filter(
    (player) => player.teamId === "free-agents",
  );
  const changedPlayers = normalizedPlayers.filter((player) => {
    const stored = allPlayers.find((current) => current.id === player.id);
    return (
      stored &&
      (stored.age !== player.age ||
        stored.potential !== player.potential ||
        stored.salary !== player.salary ||
        stored.contractYears !== player.contractYears ||
        stored.trainingFocus !== player.trainingFocus ||
        !stored.attributes)
    );
  });
  await Promise.all([
    ...changedPlayers.map((player) => db.players.put(player)),
    storedTeam.salaryCap === undefined
      ? db.teams.update(team.id, { salaryCap: team.salaryCap })
      : Promise.resolve(0),
  ]);

  const tradeOptions = normalizedPlayers.filter(
    (player) => player.teamId !== team.id && player.teamId !== "free-agents",
  );
  const payroll = players.reduce(
    (total, player) => total + (player.salary ?? 0),
    0,
  );
  return {
    team,
    players,
    freeAgents,
    tradeOptions,
    tradeTeams: allTeams.filter((candidate) => candidate.id !== team.id),
    payroll,
  };
}

export async function saveTeamManager(
  saveId: string,
  teamId: string,
  configuration: {
    starterIds: string[];
    tactics: Tactics;
    shotPriorities: ShotPriorities;
    trainingFocuses: Record<string, TrainingFocus>;
  },
): Promise<void> {
  const db = getBrasqueteDB(saveId);
  await db.transaction("rw", db.teams, db.players, async () => {
    const { trainingFocuses, ...teamConfiguration } = configuration;
    await db.teams.update(teamId, teamConfiguration);
    const players = await db.players.where("teamId").equals(teamId).toArray();
    await Promise.all(
      players.map((player) =>
        db.players.update(player.id, {
          trainingFocus: trainingFocuses[player.id] ?? player.trainingFocus,
        }),
      ),
    );
  });
}

export async function signFreeAgent(
  saveId: string,
  teamId: string,
  playerId: string,
): Promise<boolean> {
  const db = getBrasqueteDB(saveId);
  return db.transaction("rw", db.teams, db.players, async () => {
    const [team, player, roster] = await Promise.all([
      db.teams.get(teamId),
      db.players.get(playerId),
      db.players.where("teamId").equals(teamId).toArray(),
    ]);
    if (!team || !player || player.teamId !== "free-agents") return false;
    if (roster.length >= 15) return false;

    const payroll = roster.reduce(
      (total, current) => total + (current.salary ?? 0),
      0,
    );
    if (payroll + (player.salary ?? 0) > (team.salaryCap ?? 160)) return false;

    await db.players.update(player.id, { teamId, contractYears: 2 });
    await db.teams.update(teamId, {
      playerIds: [...team.playerIds, player.id],
    });
    return true;
  });
}

export async function releasePlayer(
  saveId: string,
  teamId: string,
  playerId: string,
): Promise<boolean> {
  const db = getBrasqueteDB(saveId);
  return db.transaction("rw", db.teams, db.players, async () => {
    const [team, player] = await Promise.all([
      db.teams.get(teamId),
      db.players.get(playerId),
    ]);
    if (!team || !player || player.teamId !== teamId) return false;
    if (team.playerIds.length <= 5) return false;

    await db.players.update(playerId, {
      teamId: "free-agents",
      contractYears: 0,
    });
    await db.teams.update(teamId, {
      playerIds: team.playerIds.filter((id) => id !== playerId),
      starterIds: team.starterIds?.filter((id) => id !== playerId),
    });
    return true;
  });
}

export async function renewPlayerContract(
  saveId: string,
  teamId: string,
  playerId: string,
): Promise<{ renewed: boolean; salary?: number }> {
  const db = getBrasqueteDB(saveId);
  return db.transaction("rw", db.teams, db.players, async () => {
    const [team, player, roster] = await Promise.all([
      db.teams.get(teamId),
      db.players.get(playerId),
      db.players.where("teamId").equals(teamId).toArray(),
    ]);
    if (!team || !player || player.teamId !== teamId) return { renewed: false };

    const currentSalary = player.salary ?? 1;
    const renewedSalary = Math.max(
      currentSalary + 1,
      Math.ceil(currentSalary * 1.1),
    );
    const payroll = roster.reduce(
      (total, current) => total + (current.salary ?? 0),
      0,
    );
    if (payroll - currentSalary + renewedSalary > (team.salaryCap ?? 160)) {
      return { renewed: false };
    }

    await db.players.update(playerId, {
      salary: renewedSalary,
      contractYears: 2,
    });
    return { renewed: true, salary: renewedSalary };
  });
}

export type TradeResult = {
  accepted: boolean;
  reason?: "invalid_proposal" | "ai_rejected" | "salary_cap" | "roster_size";
  evaluation?: TradeEvaluation;
};

export async function tradePlayers(
  saveId: string,
  userTeamId: string,
  otherTeamId: string,
  outgoingPlayerIds: string[],
  incomingPlayerIds: string[],
): Promise<TradeResult> {
  const db = getBrasqueteDB(saveId);
  if (
    outgoingPlayerIds.length < 1 ||
    incomingPlayerIds.length < 1 ||
    outgoingPlayerIds.length > 3 ||
    incomingPlayerIds.length > 3
  )
    return { accepted: false, reason: "invalid_proposal" };

  return db.transaction("rw", db.teams, db.players, async () => {
    const [
      userTeam,
      otherTeam,
      userRoster,
      otherRoster,
      outgoingResults,
      incomingResults,
    ] = await Promise.all([
      db.teams.get(userTeamId),
      db.teams.get(otherTeamId),
      db.players.where("teamId").equals(userTeamId).toArray(),
      db.players.where("teamId").equals(otherTeamId).toArray(),
      Promise.all(outgoingPlayerIds.map((id) => db.players.get(id))),
      Promise.all(incomingPlayerIds.map((id) => db.players.get(id))),
    ]);
    if (!userTeam || !otherTeam) {
      return { accepted: false, reason: "invalid_proposal" };
    }

    const outgoingPlayers = outgoingResults.filter(
      (player): player is PlayerDB => player?.teamId === userTeamId,
    );
    const incomingPlayers = incomingResults.filter(
      (player): player is PlayerDB => player?.teamId === otherTeamId,
    );
    if (
      outgoingPlayers.length !== outgoingPlayerIds.length ||
      incomingPlayers.length !== incomingPlayerIds.length ||
      new Set(outgoingPlayerIds).size !== outgoingPlayerIds.length ||
      new Set(incomingPlayerIds).size !== incomingPlayerIds.length
    )
      return { accepted: false, reason: "invalid_proposal" };

    const evaluation = evaluateTrade(outgoingPlayers, incomingPlayers);
    if (!evaluation.aiLikelyAccepts) {
      return { accepted: false, reason: "ai_rejected", evaluation };
    }

    const userPayroll = userRoster.reduce(
      (total, player) => total + (player.salary ?? 0),
      0,
    );
    const otherPayroll = otherRoster.reduce(
      (total, player) => total + (player.salary ?? 0),
      0,
    );
    const outgoingSalary = evaluation.outgoingSalary;
    const incomingSalary = evaluation.incomingSalary;
    const userRosterSize =
      userRoster.length - outgoingPlayers.length + incomingPlayers.length;
    const otherRosterSize =
      otherRoster.length - incomingPlayers.length + outgoingPlayers.length;
    if (
      userRosterSize < 5 ||
      otherRosterSize < 5 ||
      userRosterSize > 15 ||
      otherRosterSize > 15
    )
      return { accepted: false, reason: "roster_size", evaluation };

    const newUserPayroll = userPayroll - outgoingSalary + incomingSalary;
    const newOtherPayroll = otherPayroll - incomingSalary + outgoingSalary;
    if (
      newUserPayroll > (userTeam.salaryCap ?? 160) ||
      newOtherPayroll > (otherTeam.salaryCap ?? 160)
    )
      return { accepted: false, reason: "salary_cap", evaluation };

    await Promise.all([
      ...outgoingPlayers.map((player) =>
        db.players.update(player.id, { teamId: otherTeam.id }),
      ),
      ...incomingPlayers.map((player) =>
        db.players.update(player.id, { teamId: userTeam.id }),
      ),
      db.teams.update(userTeam.id, {
        playerIds: userTeam.playerIds
          .filter((id) => !outgoingPlayerIds.includes(id))
          .concat(incomingPlayerIds),
        starterIds: userTeam.starterIds?.filter(
          (id) => !outgoingPlayerIds.includes(id),
        ),
      }),
      db.teams.update(otherTeam.id, {
        playerIds: otherTeam.playerIds
          .filter((id) => !incomingPlayerIds.includes(id))
          .concat(outgoingPlayerIds),
        starterIds: otherTeam.starterIds?.filter(
          (id) => !incomingPlayerIds.includes(id),
        ),
      }),
    ]);
    return { accepted: true, evaluation };
  });
}
