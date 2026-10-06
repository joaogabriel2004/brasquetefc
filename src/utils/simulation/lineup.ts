import type { Player, ShotPriorities } from "../../data/teams";

/* =========================================================
   🏀 DEFINIÇÃO DOS TITULARES
   ========================================================= */

export function getStarters(
  players: Player[],
  starterIds?: string[],
): Player[] {
  const positions = ["PG", "SG", "SF", "PF", "C"];
  const starters = (starterIds ?? [])
    .map((starterId) => players.find((player) => player.id === starterId))
    .filter((player): player is Player => player !== undefined);

  // 🔹 2. Garante 1 jogador por posição
  positions.forEach((pos) => {
    if (starters.length >= 5) return;

    if (!starters.some((p) => p.position === pos)) {
      const player = players.find(
        (p) => p.position === pos && !starters.includes(p),
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

export function selectShooter(
  players: Player[],
  priorities: ShotPriorities = {},
  random: () => number = Math.random,
): Player {
  const weights: Record<string, number> = {
    less: 0.55,
    normal: 1,
    more: 1.6,
  };
  const totalWeight = players.reduce(
    (total, player) => total + weights[priorities[player.id] ?? "normal"],
    0,
  );
  let selection = random() * totalWeight;

  for (const player of players) {
    selection -= weights[priorities[player.id] ?? "normal"];
    if (selection < 0) return player;
  }

  return players[players.length - 1];
}
