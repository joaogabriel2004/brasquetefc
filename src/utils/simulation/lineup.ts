import { Player } from "../../data/teams";

export function getStarters(players: Player[]): Player[] {
  const positions = ["PG", "SG", "SF", "PF", "C"];
  const starters: Player[] = [];

  positions.forEach(pos => {
    const p = players.find(pl => pl.position === pos && !starters.includes(pl));
    if (p) starters.push(p);
  });

  // completa se faltar alguém
  if (starters.length < 5) {
    const remaining = players.filter(p => !starters.includes(p));
    starters.push(...remaining.slice(0, 5 - starters.length));
  }

  return starters;
}
