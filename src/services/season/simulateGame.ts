import type { Team } from "@/data/teams";
import {
  type MatchSimulationOptions,
  simulateMatchAsync,
} from "@/utils/simulation/match";

export function simulateGame(
  teamA: Team,
  teamB: Team,
  options: MatchSimulationOptions = {},
) {
  return simulateMatchAsync(teamA, teamB, options);
}
