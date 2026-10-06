import type { PlayerAttributes, TrainingFocus } from "@/data/teams";
import type { PlayerDB } from "@/db/brasqueteDb";
import { getPlayerAttributes } from "@/utils/simulation/playerRatings";

const focusedAttributes: Record<TrainingFocus, (keyof PlayerAttributes)[]> = {
  arremesso: [
    "insideScoring",
    "midRangeShooting",
    "threePointShooting",
    "freeThrowShooting",
  ],
  criacao: ["playmaking", "midRangeShooting"],
  defesa: ["perimeterDefense", "interiorDefense", "steals", "blocks"],
  rebote: ["rebounding", "insideScoring", "blocks"],
  condicionamento: ["stamina"],
};

function clampRating(value: number): number {
  return Math.max(35, Math.min(99, Math.round(value)));
}

export function developPlayer(player: PlayerDB): PlayerDB {
  const seed = [...player.id].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
  const age = player.age ?? 20 + (seed % 17);
  const attributes = getPlayerAttributes(player);
  const overall = (player.attack + player.defense) / 2;
  const potential =
    player.potential ??
    Math.min(99, Math.max(overall, overall + Math.max(2, (30 - age) * 0.7)));
  const growth =
    age < 28
      ? Math.min(3, Math.max(0, Math.round((potential - overall) * 0.12)))
      : 0;
  const decline = age >= 34 ? 2 : age >= 31 ? 1 : 0;
  const change = growth - decline;
  const focus = player.trainingFocus ?? "arremesso";
  const improvedAttributes = { ...attributes };

  for (const attribute of focusedAttributes[focus]) {
    improvedAttributes[attribute] = clampRating(
      improvedAttributes[attribute] + change,
    );
  }

  return {
    ...player,
    age: age + 1,
    potential,
    salary: player.salary ?? Math.max(1, Math.round(1 + (overall - 55) * 0.38)),
    contractYears: player.contractYears ?? 2,
    trainingFocus: focus,
    attributes: improvedAttributes,
    attack: clampRating(
      player.attack +
        (focus === "arremesso" || focus === "criacao" ? change : 0),
    ),
    defense: clampRating(
      player.defense + (focus === "defesa" || focus === "rebote" ? change : 0),
    ),
    energy: 100,
  };
}
