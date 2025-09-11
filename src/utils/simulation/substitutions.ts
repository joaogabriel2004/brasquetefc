import { Player } from "../../data/teams";
import { getControlledTeamId } from './lineup';

export function substitutePlayer(
  teamId: string,
  outPlayer: Player,
  inPlayer: Player,
  starters: Record<string, Player[]>,
  bench: Record<string, Player[]>
) {
  const controlledTeamId = getControlledTeamId();
  if (teamId !== controlledTeamId) return;
  
  // remove titular
  starters[teamId] = starters[teamId].filter(p => p.name !== outPlayer.name);

  // adiciona titular
  starters[teamId].push(inPlayer);

  // atualiza reservas
  bench[teamId] = bench[teamId].filter(p => p.name !== inPlayer.name);
  bench[teamId].push(outPlayer);
}
