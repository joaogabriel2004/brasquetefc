import { Player } from "../../data/teams";

export function substitutePlayer(
  teamId: string,
  outPlayer: Player,
  inPlayer: Player,
  starters: Record<string, Player[]>,
  bench: Record<string, Player[]>
) {
  // remove titular
  starters[teamId] = starters[teamId].filter(p => p.name !== outPlayer.name);

  // adiciona titular
  starters[teamId].push(inPlayer);

  // atualiza reservas
  bench[teamId] = bench[teamId].filter(p => p.name !== inPlayer.name);
  bench[teamId].push(outPlayer);
}
