import type { Player, PlayerAttributes } from "../../data/teams.ts";

const positionBonuses = {
  PG: {
    insideScoring: -5,
    midRangeShooting: 1,
    threePointShooting: 5,
    freeThrowShooting: 4,
    playmaking: 17,
    rebounding: -12,
    perimeterDefense: 7,
    interiorDefense: -12,
    steals: 9,
    blocks: -17,
    stamina: 8,
  },
  SG: {
    insideScoring: -1,
    midRangeShooting: 4,
    threePointShooting: 9,
    freeThrowShooting: 5,
    playmaking: 4,
    rebounding: -6,
    perimeterDefense: 8,
    interiorDefense: -8,
    steals: 8,
    blocks: -12,
    stamina: 6,
  },
  SF: {
    insideScoring: 3,
    midRangeShooting: 2,
    threePointShooting: 3,
    freeThrowShooting: 1,
    playmaking: 0,
    rebounding: 2,
    perimeterDefense: 4,
    interiorDefense: 2,
    steals: 2,
    blocks: 0,
    stamina: 4,
  },
  PF: {
    insideScoring: 9,
    midRangeShooting: 0,
    threePointShooting: -5,
    freeThrowShooting: -2,
    playmaking: -3,
    rebounding: 11,
    perimeterDefense: -2,
    interiorDefense: 10,
    steals: -1,
    blocks: 9,
    stamina: 1,
  },
  C: {
    insideScoring: 15,
    midRangeShooting: -5,
    threePointShooting: -13,
    freeThrowShooting: -9,
    playmaking: -6,
    rebounding: 18,
    perimeterDefense: -8,
    interiorDefense: 18,
    steals: -5,
    blocks: 17,
    stamina: -3,
  },
} satisfies Record<Player["position"], Omit<PlayerAttributes, never>>;

function clampRating(value: number): number {
  return Math.round(Math.min(99, Math.max(35, value)));
}

export function getPlayerAttributes(player: Player): PlayerAttributes {
  const bonus = positionBonuses[player.position];
  const attack = player.attack;
  const defense = player.defense;
  const derived: PlayerAttributes = {
    insideScoring: attack + bonus.insideScoring,
    midRangeShooting: attack - 3 + bonus.midRangeShooting,
    threePointShooting: attack - 8 + bonus.threePointShooting,
    freeThrowShooting: 63 + (attack - 65) * 0.55 + bonus.freeThrowShooting,
    playmaking: 55 + (attack - 65) * 0.45 + bonus.playmaking,
    rebounding: 55 + (defense - 65) * 0.35 + bonus.rebounding,
    perimeterDefense: defense + bonus.perimeterDefense,
    interiorDefense: defense - 4 + bonus.interiorDefense,
    steals: defense * 0.65 + 22 + bonus.steals,
    blocks: defense * 0.6 + 26 + bonus.blocks,
    stamina: 79 + bonus.stamina,
  };

  const saved = player.attributes;
  return Object.fromEntries(
    Object.entries(derived).map(([key, value]) => [
      key,
      clampRating(saved?.[key as keyof PlayerAttributes] ?? value),
    ]),
  ) as unknown as PlayerAttributes;
}

export function getFatigueFactor(player: Player): number {
  return 0.58 + (0.42 * Math.max(0, Math.min(100, player.energy))) / 100;
}

export function weightedPlayer(
  players: Player[],
  rating: (player: Player) => number,
  random: () => number = Math.random,
): Player {
  const weights = players.map((player) => Math.max(1, rating(player) - 25));
  let selection =
    random() * weights.reduce((total, weight) => total + weight, 0);

  for (let index = 0; index < players.length; index++) {
    selection -= weights[index];
    if (selection < 0) return players[index];
  }

  return players[players.length - 1];
}

export function shotAccuracy(
  shooter: Player,
  defender: Player,
  shot: "inside" | "midRange" | "threePoint",
  defensiveScheme: "homem" | "zona" | "mista",
): number {
  const shooterRatings = getPlayerAttributes(shooter);
  const defenderRatings = getPlayerAttributes(defender);
  const fatigue = getFatigueFactor(shooter);
  const schemePenalty =
    defensiveScheme === "zona" ? 0.045 : defensiveScheme === "mista" ? 0.02 : 0;

  const base =
    shot === "inside"
      ? 0.52 +
        (shooterRatings.insideScoring - 70) * 0.004 -
        (defenderRatings.interiorDefense - 70) * 0.003
      : shot === "midRange"
        ? 0.41 +
          (shooterRatings.midRangeShooting - 70) * 0.004 -
          (defenderRatings.interiorDefense - 70) * 0.0025
        : 0.34 +
          (shooterRatings.threePointShooting - 70) * 0.004 -
          (defenderRatings.perimeterDefense - 70) * 0.003;

  return Math.min(0.78, Math.max(0.16, (base - schemePenalty) * fatigue));
}
