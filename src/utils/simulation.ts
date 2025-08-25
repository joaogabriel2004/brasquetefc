import { Team, Player } from '../data/teams';

export type MatchResult = {
  score: Record<string, number>;
  events: string[];
};

function randomChance(probability: number): boolean {
  return Math.random() < probability;
}

export function simulateMatch(teamA: Team, teamB: Team): MatchResult {
  const score: Record<string, number> = {
    [teamA.id]: 0,
    [teamB.id]: 0
  };

  const events: string[] = [];

  const quarters = 4;
  const playsPerQuarter = 10; // quantidade de jogadas por período

  // Faz uma cópia dos jogadores para atualizar energia
  const playersA: Player[] = teamA.players.map(p => ({ ...p }));
  const playersB: Player[] = teamB.players.map(p => ({ ...p }));

  for (let q = 1; q <= quarters; q++) {
    events.push(`--- Quarter ${q} ---`);

    for (let i = 0; i < playsPerQuarter; i++) {
      // Alterna entre times
      const attackingTeam = i % 2 === 0 ? playersA : playersB;
      const defendingTeam = i % 2 === 0 ? playersB : playersA;
      const teamId = i % 2 === 0 ? teamA.id : teamB.id;

      // Escolhe jogador atacante aleatório
      const attacker = attackingTeam[Math.floor(Math.random() * attackingTeam.length)];
      const defender = defendingTeam[Math.floor(Math.random() * defendingTeam.length)];

      // Escolhe tipo de arremesso: 2 pontos (70%), 3 pontos (25%), lance livre (5%)
      const rand = Math.random();
      let points = 0;
      let chance = 0;
      let shotType = '';

      if (rand < 0.70) {
        points = 2;
        shotType = '2 points';
        chance = attacker.attack / (attacker.attack + defender.defense); // probabilidade baseada em attack/defense
      } else if (rand < 0.95) {
        points = 3;
        shotType = '3 points';
        chance = (attacker.attack * 0.8) / (attacker.attack + defender.defense); // 3 pontos mais difícil
      } else {
        points = 1;
        shotType = 'Free throw';
        chance = attacker.attack / (attacker.attack + defender.defense) + 0.1; // free throw mais fácil
      }

      // Verifica se acerta
      if (randomChance(chance)) {
        score[teamId] += points;
        events.push(`${attacker.name} acertou um ${shotType} em cima de ${defender.name}! (+${points})`);
      } else {
        events.push(`${attacker.name} errou o ${shotType}.`);
      }

      // Reduz energia do jogador atacante
      attacker.energy = Math.max(attacker.energy - 1, 0);
    }
  }

  return { score, events };
}
