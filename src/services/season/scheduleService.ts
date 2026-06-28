import { GameDB } from "../../db/brasqueteDb";

export function generateDoubleRoundRobinSchedule(teamIds: string[]): GameDB[] {
  const teams = [...teamIds];

  if (teams.length % 2 !== 0) {
    teams.push("DESCANSO");
  }

  const totalTeams = teams.length;
  const roundsPerTurn = totalTeams - 1;
  const gamesPerRound = totalTeams / 2;

  const firstTurn: GameDB[] = [];
  let rotation = [...teams];

  for (let round = 1; round <= roundsPerTurn; round++) {
    for (let i = 0; i < gamesPerRound; i++) {
      const teamA = rotation[i];
      const teamB = rotation[totalTeams - 1 - i];

      if (teamA !== "DESCANSO" && teamB !== "DESCANSO") {
        const shouldSwapHome = round % 2 === 0;
        const homeTeam = shouldSwapHome ? teamB : teamA;
        const awayTeam = shouldSwapHome ? teamA : teamB;

        firstTurn.push({
          id: `R${round}-${homeTeam}-${awayTeam}`,
          round,
          homeTeam,
          awayTeam,
          played: false
        });
      }
    }

    rotation = [
      rotation[0],
      rotation[totalTeams - 1],
      ...rotation.slice(1, totalTeams - 1)
    ];
  }

  const secondTurn: GameDB[] = firstTurn.map((game) => {
    const round = game.round + roundsPerTurn;

    return {
      id: `R${round}-${game.awayTeam}-${game.homeTeam}`,
      round,
      homeTeam: game.awayTeam,
      awayTeam: game.homeTeam,
      played: false
    };
  });

  return [...firstTurn, ...secondTurn];
}