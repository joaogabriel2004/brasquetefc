import Dexie, { type Table } from "dexie";
import type {
  PlayerAttributes,
  ShotPriorities,
  Tactics,
  TrainingFocus,
} from "../data/teams";

/* =======================
   TYPES
======================= */

export type PlayerDB = {
  id: string;
  name: string;
  position: "PG" | "SG" | "SF" | "PF" | "C";
  attack: number;
  defense: number;
  energy: number;
  teamId: string;
  attributes?: PlayerAttributes;
  age?: number;
  potential?: number;
  salary?: number;
  contractYears?: number;
  trainingFocus?: TrainingFocus;
  statsSeason?: {
    points: number;
    rebounds: number;
    assists: number;
  };
};

export type TeamDB = {
  id: string;
  name: string;
  playerIds: string[];
  wins: number;
  losses: number;
  starterIds?: string[];
  tactics?: Tactics;
  shotPriorities?: ShotPriorities;
  salaryCap?: number;
};

export type GameDB = {
  id: string;
  season?: number;
  round: number;
  homeTeam: string;
  awayTeam: string;
  played: boolean;

  score?: Record<string, number>;

  quarterScores?: Record<string, number[]>;

  boxscore?: Record<
    string,
    Record<
      string,
      {
        points: number;
        fgm: number;
        fga: number;
        twoPM: number;
        twoPA: number;
        tpm: number;
        tpa: number;
        ftm: number;
        fta: number;
        energy: number;
        rebounds: number;
        assists: number;
        turnovers: number;
        steals: number;
        blocks: number;
        fouls?: number;
      }
    >
  >;
};

export type LeagueDB = {
  id: string; // sempre 'main'
  season: number;
  coachName: string;
  teamIdSelected: string;
  currentRound: number;
  totalRounds: number;
  teamIds: string[];
};

/* =======================
   DATABASE (1 SAVE)
======================= */

export class BrasqueteDB extends Dexie {
  teams!: Table<TeamDB, string>;
  players!: Table<PlayerDB, string>;
  games!: Table<GameDB, string>;
  league!: Table<LeagueDB, string>;

  constructor(saveId: string) {
    super(`BrasqueteDB_${saveId}`);

    this.version(1).stores({
      teams: "id, name",
      players: "id, teamId, name",
      games: "id, round, homeTeam, awayTeam",
      league: "id",
    });

    this.version(2).stores({
      teams: "id, name",
      players: "id, teamId, name",
      games: "id, round, season, homeTeam, awayTeam",
      league: "id",
    });
  }
}

export function getBrasqueteDB(saveId: string) {
  return new BrasqueteDB(saveId);
}
