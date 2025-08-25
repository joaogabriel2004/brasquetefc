import { Team, Player } from '../data/teams';

export type MatchResult = {
  score: Record<string, number>;
  events: string[];
};

function randomChance(probability: number): boolean {
  return Math.random() < probability;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function simulateMatchAsync(
  teamA: Team,
  teamB: Team,
  onUpdate?: (events: string[], score: Record<string, number>) => void
): Promise<MatchResult> {

  const score: Record<string, number> = {
    [teamA.id]: 0,
    [teamB.id]: 0
  };

  const events: string[] = [];

  const quarters = 4;
  const quarterTime = 12 * 60; // 12 minutos por quarto em segundos

  const playersA: Player[] = teamA.players.map(p => ({ ...p }));
  const playersB: Player[] = teamB.players.map(p => ({ ...p }));

  for (let q = 1; q <= quarters; q++) {
    events.push(`--- Quarter ${q} ---`);
    if (onUpdate) onUpdate([...events], { ...score });

    let remainTime = quarterTime;

    while (remainTime > 0) {
      // Tempo de posse aleatório (5 a 24 segundos)
      const possessionTime = Math.random() * (24 - 5) + 5;
      remainTime -= possessionTime;

      // Delay entre lances
      const delay = 1
      await sleep(delay);

      if (remainTime < 0) break;

      // Chance de nada acontecer
      if (Math.random() < 0.1) {
        const minute = Math.floor(remainTime / 60);
        const second = Math.floor(remainTime % 60);
        events.push(`[${minute}:${second < 10 ? '0' : ''}${second}] Nenhum lance ocorreu...`);
        if (onUpdate) onUpdate([...events], { ...score });
        continue;
      }

      // Escolhe equipe atacante aleatoriamente
      const isTeamA = Math.random() < 0.5;
      const attackingTeam = isTeamA ? playersA : playersB;
      const defendingTeam = isTeamA ? playersB : playersA;
      const teamId = isTeamA ? teamA.id : teamB.id;

      // Escolhe jogadores aleatoriamente
      const attacker = attackingTeam[Math.floor(Math.random() * attackingTeam.length)];
      const defender = defendingTeam[Math.floor(Math.random() * defendingTeam.length)];

      // Escolhe tipo de arremesso
      const rand = Math.random();
      let points = 0;
      let chance = 0;
      let shotType = '';

      if (rand < 0.70) {
        points = 2;
        shotType = '2 points';
        chance = attacker.attack / (attacker.attack + defender.defense) * (attacker.energy / 50);
      } else if (rand < 0.95) {
        points = 3;
        shotType = '3 points';
        chance = (attacker.attack * 0.8) / (attacker.attack + defender.defense) * (attacker.energy / 60);
      } else {
        points = 1;
        shotType = 'Free throw';
        chance = attacker.energy / 100;
      }

      // Atualiza pontuação e eventos
      const minute = Math.floor(remainTime / 60);
      const second = Math.floor(remainTime % 60);

      if(shotType === 'Free throw') {
        for(let ft=1; ft<=2; ft++) {
            if (randomChance(chance)) {
              score[teamId] += points;
              events.push(`[${minute}:${second < 10 ? '0' : ''}${second}] ${attacker.name} acertou um ${shotType}! (+${points})`);
            } else {
              events.push(`[${minute}:${second < 10 ? '0' : ''}${second}] ${attacker.name} errou o ${shotType}.`);
            }
        }
      } else {
        if (randomChance(chance)) {
          score[teamId] += points;
          events.push(`[${minute}:${second < 10 ? '0' : ''}${second}] ${attacker.name} acertou um ${shotType} em cima de ${defender.name}! (+${points}`);
        } else {
          events.push(`[${minute}:${second < 10 ? '0' : ''}${second}] ${attacker.name} errou o ${shotType}.`);
        }
      }

      attacker.energy = Math.max(attacker.energy - 5, 0);

      // Atualiza callback
      if (onUpdate) onUpdate([...events], { ...score });
    }
  }

  return { score, events };
}