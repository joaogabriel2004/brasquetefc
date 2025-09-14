import { teams } from "../../data/teams";

type TeamId = string;

interface TeamRecord {
  wins: number;
  losses: number;
}

let standings: Record<TeamId, TeamRecord> = {};

// Inicializa o placar de todos os times
export function initStandings() {
  standings = {};
  teams.forEach(t => {
    standings[t.id] = { wins: 0, losses: 0 };
  });
}

// Atualiza o placar após um jogo
export function updateStandings(matchResult: any) {
  const { score } = matchResult;
  const keys = Object.keys(score);
  if (keys.length !== 2) {
    throw new Error("O score deve ter exatamente 2 times.");
  }
  const [homeId, awayId] = keys;

  if (!standings[homeId] || !standings[awayId]) {
    throw new Error("Um ou mais times do score não existem no standings.");
  }

  if (score[homeId] > score[awayId]) {
    standings[homeId].wins++;
    standings[awayId].losses++;
  } else if (score[homeId] < score[awayId]) {
    standings[awayId].wins++;
    standings[homeId].losses++;
  } else {
    // Empate: pode adicionar lógica específica se necessário
  }
}

// Retorna o placar formatado e ordenado
export function getStandings() {
  return Object.entries(standings)
    .map(([teamId, rec]) => ({
      team: teams.find(t => t.id === teamId)?.name || teamId,
      wins: rec.wins,
      losses: rec.losses,
      pct: rec.wins + rec.losses > 0 ? (rec.wins / (rec.wins + rec.losses)).toFixed(3) : "0.000",
    }))
    .sort((a, b) => b.wins - a.wins);
}
