import { Player } from "../../data/teams";

export type PlayerStats = {
  points: number;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
  energy: number;
};

export type MatchResult = {
  score: Record<string, number>;
  quarterScores: Record<string, number[]>;
  events: string[];
  boxscore: Record<string, Record<string, PlayerStats>>;
  starters: Record<string, Player[]>;
  bench: Record<string, Player[]>;
};
