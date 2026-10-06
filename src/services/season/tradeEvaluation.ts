import type { PlayerDB } from "@/db/brasqueteDb";
import { getPlayerAttributes } from "@/utils/simulation/playerRatings";

export type TradeVerdict =
  | "muito_vantajosa"
  | "vantajosa"
  | "equilibrada"
  | "desvantajosa"
  | "muito_desvantajosa";

export type TradeEvaluation = {
  outgoingValue: number;
  incomingValue: number;
  valueDifference: number;
  valueDifferencePercent: number;
  outgoingSalary: number;
  incomingSalary: number;
  verdict: TradeVerdict;
  aiLikelyAccepts: boolean;
  reasons: string[];
};

export function playerTradeValue(player: PlayerDB): number {
  const attributes = getPlayerAttributes(player);
  
  // Habilidades detalhadas pesam menos, servindo apenas de complemento técnico
  const skillValue =
    attributes.insideScoring * 0.12 +
    attributes.midRangeShooting * 0.08 +
    attributes.threePointShooting * 0.10 +
    attributes.freeThrowShooting * 0.04 +
    attributes.playmaking * 0.12 +
    attributes.rebounding * 0.10 +
    attributes.perimeterDefense * 0.09 +
    attributes.interiorDefense * 0.09 +
    attributes.steals * 0.05 +
    attributes.blocks * 0.05 +
    attributes.stamina * 0.04;

  const age = player.age ?? 27;
  
  // Multiplicador de idade ajustado: jovens estrelas valem muito mais pelo teto de carreira
  const ageMultiplier =
    age <= 22
      ? 1.25 // Super valorização para jovens talentos de elite
      : age <= 27
        ? 1.10
        : age <= 30
          ? 1.00
          : age <= 33
            ? 0.85
            : 0.70;

  // O Overall bruto passa a ser o coração absoluto do valor do jogador (escala exponencial leve)
  const currentRating = player.attack * 0.55 + player.defense * 0.25 + skillValue * 0.20;
  const starPower = currentRating >= 88 ? Math.pow(currentRating - 85, 1.4) * 4 : 0;

  // Potencial real impacta muito mais se o jogador for jovem
  const potentialPremium =
    Math.max(0, (player.potential ?? currentRating) - currentRating) * (age <= 23 ? 0.45 : 0.20);

  // Ajustes de contrato mais suaves para não distorcer o valor esportivo puro
  const contractAdjustment =
    (player.contractYears ?? 1) >= 3
      ? 3
      : (player.contractYears ?? 1) <= 1
        ? -3
        : 0;

  const baseVal = (currentRating * starPower ? currentRating + starPower : currentRating) * ageMultiplier + potentialPremium + contractAdjustment;

  return Math.max(5, baseVal);
}

function totalValue(players: PlayerDB[]): number {
  return players.reduce((total, player) => total + playerTradeValue(player), 0);
}

function totalSalary(players: PlayerDB[]): number {
  return players.reduce((total, player) => total + (player.salary ?? 0), 0);
}

export function evaluateTrade(
  outgoingPlayers: PlayerDB[],
  incomingPlayers: PlayerDB[],
): TradeEvaluation {
  const outgoingValue = totalValue(outgoingPlayers);
  const incomingValue = totalValue(incomingPlayers);
  const valueDifference = incomingValue - outgoingValue;
  const valueDifferencePercent =
    (valueDifference / Math.max(outgoingValue, incomingValue, 1)) * 100;

  const verdict: TradeVerdict =
    valueDifferencePercent >= 15
      ? "muito_vantajosa"
      : valueDifferencePercent >= 5
        ? "vantajosa"
        : valueDifferencePercent > -5
          ? "equilibrada"
          : valueDifferencePercent > -15
            ? "desvantajosa"
            : "muito_desvantajosa";

  const reasons: string[] = [];

  if (valueDifferencePercent >= 5) {
    reasons.push("Você recebe mais valor esportivo do que oferece.");
  } else if (valueDifferencePercent <= -5) {
    reasons.push("Você oferece mais valor esportivo do que recebe.");
  } else {
    reasons.push("O valor esportivo recebido e oferecido é parecido.");
  }

  const outgoingYoungPlayers = outgoingPlayers.filter(
    (player) => (player.age ?? 27) <= 23 && (player.potential ?? 0) >= 80,
  ).length;
  const incomingYoungPlayers = incomingPlayers.filter(
    (player) => (player.age ?? 27) <= 23 && (player.potential ?? 0) >= 80,
  ).length;

  if (incomingYoungPlayers > outgoingYoungPlayers) {
    reasons.push("A proposta traz mais potencial de desenvolvimento.");
  } else if (outgoingYoungPlayers > incomingYoungPlayers) {
    reasons.push("A proposta abre mão de mais potencial jovem.");
  }

  const outgoingSalary = totalSalary(outgoingPlayers);
  const incomingSalary = totalSalary(incomingPlayers);
  reasons.push(
    incomingSalary <= outgoingSalary
      ? `A folha salarial cai ${outgoingSalary - incomingSalary}M.`
      : `A folha salarial sobe ${incomingSalary - outgoingSalary}M.`,
  );

  // REGRA RIGOROSA DA IA:
  // 1. A IA nunca aceita se a diferença de valor for muito desfavorável para ela (ex: você ganhando mais de 5% de vantagem líquida em cima dela).
  // 2. A IA rejeita imediatamente se você estiver mandando um pacote fraco por uma estrela (Overall 88+).
  const maxOutgoingRating = Math.max(...outgoingPlayers.map(p => p.attack * 0.5 + p.defense * 0.5), 0);
  const maxIncomingRating = Math.max(...incomingPlayers.map(p => p.attack * 0.5 + p.defense * 0.5), 0);
  
  const isStealingSuperstar = maxOutgoingRating >= 88 && (maxOutgoingRating - maxIncomingRating > 5);
  const aiLikelyAccepts = valueDifferencePercent <= 5 && !isStealingSuperstar;

  if (isStealingSuperstar) {
    reasons.unshift("O outro time jamais negociará sua principal estrela por esse pacote.");
  }

  return {
    outgoingValue,
    incomingValue,
    valueDifference,
    valueDifferencePercent,
    outgoingSalary,
    incomingSalary,
    verdict,
    aiLikelyAccepts,
    reasons,
  };
}