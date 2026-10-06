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
  const skillValue =
    attributes.insideScoring * 0.14 +
    attributes.midRangeShooting * 0.09 +
    attributes.threePointShooting * 0.12 +
    attributes.freeThrowShooting * 0.05 +
    attributes.playmaking * 0.13 +
    attributes.rebounding * 0.12 +
    attributes.perimeterDefense * 0.1 +
    attributes.interiorDefense * 0.1 +
    attributes.steals * 0.06 +
    attributes.blocks * 0.05 +
    attributes.stamina * 0.04;
  const age = player.age ?? 27;
  const ageMultiplier =
    age <= 22
      ? 1.1
      : age <= 27
        ? 1.04
        : age <= 30
          ? 0.97
          : age <= 33
            ? 0.89
            : 0.78;
  const currentRating =
    player.attack * 0.45 + player.defense * 0.25 + skillValue * 0.3;
  const potentialPremium =
    Math.max(0, (player.potential ?? currentRating) - currentRating) * 0.28;
  const contractAdjustment =
    (player.contractYears ?? 1) >= 3
      ? 2
      : (player.contractYears ?? 1) <= 1
        ? -2
        : 0;
  const salaryAdjustment = Math.min(
    8,
    Math.max(-12, (10 - (player.salary ?? 10)) * 0.5),
  );

  return Math.max(
    1,
    currentRating * ageMultiplier +
      potentialPremium +
      contractAdjustment +
      salaryAdjustment,
  );
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

  return {
    outgoingValue,
    incomingValue,
    valueDifference,
    valueDifferencePercent,
    outgoingSalary,
    incomingSalary,
    verdict,
    aiLikelyAccepts: valueDifferencePercent <= 12,
    reasons,
  };
}
