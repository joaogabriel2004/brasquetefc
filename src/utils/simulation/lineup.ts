import { Player } from "../../data/teams";

export function getStarters(players: Player[]): Player[] {
  const positions = ["PG", "SG", "SF", "PF", "C"];
  const starters: Player[] = [];

  // Tenta recuperar do localStorage
  if (typeof window !== "undefined") {
    const storedLineup = localStorage.getItem('matchSetup');
    if (storedLineup) {
      try {
        const parsed = JSON.parse(storedLineup);
        if (parsed.starters && Array.isArray(parsed.starters)) {
          parsed.starters.forEach((starterId: string) => {
            const player = players.find(p => p.id === starterId);
            if (player) {
              starters.push(player);
            }
          });
        }
      } catch (e) {
        console.error("Erro ao analisar a escalação armazenada:", e);
      }
    }
  }

  // Preenche as posições faltantes
  positions.forEach(pos => {
    if (starters.length >= 5) return; // já temos 5 titulares
    if (!starters.find(p => p.position === pos)) {
      const player = players.find(p => p.position === pos && !starters.includes(p));
      if (player) starters.push(player);
    }
  });

  // Se ainda faltar algum titular, preenche com os melhores disponíveis
  while (starters.length < 5) {
    const remaining = players.filter(p => !starters.includes(p));
    if (remaining.length === 0) break;
    remaining.sort((a, b) => b.attack - a.attack); // pega os jogadores de maior ataque
    starters.push(remaining[0]);
  }

  return starters;
}

export function getControlledTeamId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const setup = localStorage.getItem('matchSetup');
    if (!setup) return null;
    const parsed = JSON.parse(setup);
    return parsed.teamId || null;
  } catch (e) {
    console.error("Erro ao recuperar time controlado:", e);
    return null;
  }
}