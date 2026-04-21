// src/services/season/scheduleService.ts
import { GameDB } from '../../db/brasqueteDb';

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}


export function generateDoubleRoundRobinSchedule(
  teamIds: string[]
): GameDB[] {
  const shuffledTeams = shuffle(teamIds);

  const games: GameDB[] = [];

  let round = 1;

  for (let i = 0; i < shuffledTeams.length; i++) {
    for (let j = i + 1; j < shuffledTeams.length; j++) {
      // ida
      games.push({
        id: `${round}-${shuffledTeams[i]}-${shuffledTeams[j]}`,
        round,
        homeTeam: shuffledTeams[i],
        awayTeam: shuffledTeams[j],
        played: false,
      });
      round++;

      // volta
      games.push({
        id: `${round}-${shuffledTeams[j]}-${shuffledTeams[i]}`,
        round,
        homeTeam: shuffledTeams[j],
        awayTeam: shuffledTeams[i],
        played: false,
      });
      round++;
    }
  }

  // embaralha ordem dos jogos e redistribui rounds
  const shuffledGames = shuffle(games);

  const matchdays = (teamIds.length - 1) * 2;
  const gamesPerRound = teamIds.length / 2;

  const finalGames: GameDB[] = [];
  let idx = 0;

  for (let r = 1; r <= matchdays; r++) {
    for (let g = 0; g < gamesPerRound; g++) {
      const game = shuffledGames[idx++];
      finalGames.push({
        ...game,
        round: r,
        id: `${r}-${game.homeTeam}-${game.awayTeam}`,
      });
    }
  }

  return finalGames;
}
