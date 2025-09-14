import { teams } from "../../data/teams";
import { simulateMatchAsync } from "./match";
import { updateStandings, initStandings, getStandings } from "../../utils/simulation/standings";

let currentRound = 0;
let seasonSchedule: [string, string][][] = []; // Ex: [[ ['BOS','LAS'], ['MIL','PHI'] ], [ ['DEN','MIA']]]

// Inicializa a temporada
export function initSeason() {
  initStandings(); // Inicializa o placar
  const teamIds = teams.map(t => t.id);
  seasonSchedule = generateSchedule(teamIds);
  currentRound = 0;
  return seasonSchedule;
}

// Executa a rodada atual
export async function playRound(callback: (roundResults: any) => void) {
  if (currentRound >= seasonSchedule.length) {
    throw new Error("Todas as rodadas já foram jogadas.");
  }

  const matches = seasonSchedule[currentRound];
  const results = [];

  for (const [homeId, awayId] of matches) {
    const home = teams.find(t => t.id === homeId)!;
    const away = teams.find(t => t.id === awayId)!;
    const result = await simulateMatchAsync(home, away, () => {});
    updateStandings(result);
    results.push(result);
  }

  currentRound++;
  callback(results);
}

// Retorna a rodada atual
export function getCurrentRound() {
  return currentRound;
}

// Gera calendário "todos contra todos", ida apenas
function generateSchedule(teamIds: string[]): [string, string][][] {
  const schedule: [string, string][][] = [];
  const totalRounds = teamIds.length - 1;

  for (let round = 0; round < totalRounds; round++) {
    const roundMatches: [string, string][] = [];
    for (let i = 0; i < teamIds.length; i++) {
      for (let j = i + 1; j < teamIds.length; j++) {
        // Evita duplicar partidas em rodadas diferentes
        if (!schedule.flat().some(([h, a]) => (h === teamIds[i] && a === teamIds[j]) || (h === teamIds[j] && a === teamIds[i]))) {
          roundMatches.push([teamIds[i], teamIds[j]]);
        }
      }
    }
    if (roundMatches.length > 0) schedule.push(roundMatches);
  }

  return schedule;
}
