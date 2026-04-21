import { Player } from "../../data/teams";

/* =========================================================
   🧠 CONTROLE DO TIME DO JOGADOR (GLOBAL EM MEMÓRIA)
   ========================================================= */

let controlledTeamId: string | null = null;

export function setControlledTeamId(id: string) {
  controlledTeamId = id;
}

export function getControlledTeamId(): string | null {
  return controlledTeamId;
}

/* =========================================================
   🏀 DEFINIÇÃO DOS TITULARES
   ========================================================= */

export function getStarters(players: Player[]): Player[] {
  const positions = ["PG", "SG", "SF", "PF", "C"];
  const starters: Player[] = [];

  // 🔹 1. Tenta recuperar lineup salvo no localStorage
  if (typeof window !== "undefined") {
    const storedLineup = localStorage.getItem("matchSetup");

    if (storedLineup) {
      try {
        const parsed = JSON.parse(storedLineup);

        if (parsed.starters && Array.isArray(parsed.starters)) {
          parsed.starters.forEach((starterId: string) => {
            const player = players.find((p) => p.id === starterId);
            if (player && !starters.includes(player)) {
              starters.push(player);
            }
          });
        }
      } catch (e) {
        console.error("Erro ao ler lineup do localStorage:", e);
      }
    }
  }

  // 🔹 2. Garante 1 jogador por posição
  positions.forEach((pos) => {
    if (starters.length >= 5) return;

    if (!starters.some((p) => p.position === pos)) {
      const player = players.find(
        (p) => p.position === pos && !starters.includes(p)
      );

      if (player) starters.push(player);
    }
  });

  // 🔹 3. Completa com melhores jogadores restantes
  while (starters.length < 5) {
    const remaining = players.filter((p) => !starters.includes(p));

    if (remaining.length === 0) break;

    remaining.sort((a, b) => b.attack - a.attack);
    starters.push(remaining[0]);
  }

  return starters;
}