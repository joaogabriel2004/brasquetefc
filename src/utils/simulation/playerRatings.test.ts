import assert from "node:assert/strict";
import test from "node:test";
import type { Player, Team } from "../../data/teams.ts";
import type { PlayerDB } from "../../db/brasqueteDb.ts";
import { developPlayer } from "../../services/season/playerDevelopment.ts";
import { getStarters, selectShooter } from "./lineup.ts";
import { simulateMatchAsync } from "./match.ts";
import {
  getFatigueFactor,
  getPlayerAttributes,
  shotAccuracy,
} from "./playerRatings.ts";

function createPlayer(
  id: string,
  position: Player["position"],
  energy = 100,
): Player {
  return {
    id,
    name: id,
    position,
    attack: 75,
    defense: 75,
    energy,
    teamId: "test",
  };
}

function createTeam(id: string): Team {
  const positions: Player["position"][] = ["PG", "SG", "SF", "PF", "C", "SG"];
  return {
    id,
    name: id,
    players: positions.map((position, index) => ({
      ...createPlayer(`${id}-${index}`, position),
      teamId: id,
    })),
  };
}

function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 48271) % 2147483647;
    return state / 2147483647;
  };
}

test("player ratings use position profiles and remain inside the rating scale", () => {
  const pointGuard = getPlayerAttributes(createPlayer("pg", "PG"));
  const center = getPlayerAttributes(createPlayer("c", "C"));

  assert.ok(pointGuard.playmaking > center.playmaking);
  assert.ok(center.rebounding > pointGuard.rebounding);
  assert.ok(center.blocks > pointGuard.blocks);
  assert.ok(
    Object.values(center).every((rating) => rating >= 35 && rating <= 99),
  );
});

test("fatigue reduces shooting accuracy", () => {
  const defender = createPlayer("defender", "SG");
  const freshShooter = createPlayer("fresh", "SG", 100);
  const tiredShooter = createPlayer("tired", "SG", 0);

  assert.equal(getFatigueFactor(freshShooter), 1);
  assert.ok(getFatigueFactor(tiredShooter) < getFatigueFactor(freshShooter));
  assert.ok(
    shotAccuracy(tiredShooter, defender, "threePoint", "homem") <
      shotAccuracy(freshShooter, defender, "threePoint", "homem"),
  );
});

test("lineups contain five distinct players when the roster allows it", () => {
  const roster = [
    createPlayer("pg", "PG"),
    createPlayer("sg", "SG"),
    createPlayer("sf", "SF"),
    createPlayer("pf", "PF"),
    createPlayer("c", "C"),
    createPlayer("bench", "SG"),
  ];

  const starters = getStarters(roster);

  assert.equal(starters.length, 5);
  assert.equal(new Set(starters.map((player) => player.id)).size, 5);
});

test("shot priority changes weighted shooter selection", () => {
  const players = [
    createPlayer("low", "PG"),
    createPlayer("normal", "SG"),
    createPlayer("high", "SF"),
  ];
  const originalRandom = Math.random;

  try {
    Math.random = () => 0;
    assert.equal(
      selectShooter(players, { low: "less", normal: "normal", high: "more" })
        .id,
      "low",
    );

    Math.random = () => 0.99;
    assert.equal(
      selectShooter(players, { low: "less", normal: "normal", high: "more" })
        .id,
      "high",
    );
  } finally {
    Math.random = originalRandom;
  }
});

test("shared match engine preserves player boxscore arithmetic", async () => {
  const result = await simulateMatchAsync(
    createTeam("home"),
    createTeam("away"),
    {
      random: createRandom(41),
    },
  );

  assert.equal(result.events.at(-1), "--- Fim do Jogo ---");

  for (const teamId of ["home", "away"]) {
    const players = Object.values(result.boxscore[teamId]);
    const teamPoints = players.reduce(
      (total, stats) => total + stats.points,
      0,
    );

    assert.equal(teamPoints, result.score[teamId]);
    for (const stats of players) {
      assert.equal(stats.fga, stats.twoPA + stats.tpa);
      assert.equal(stats.fgm, stats.twoPM + stats.tpm);
      assert.equal(stats.points, stats.ftm + stats.twoPM * 2 + stats.tpm * 3);
      assert.ok(stats.ftm <= stats.fta);
      assert.ok(stats.energy >= 0 && stats.energy <= 100);
    }
  }
});

test("training develops a young player without exceeding potential", () => {
  const player: PlayerDB = {
    ...createPlayer("prospect", "SF"),
    age: 20,
    potential: 90,
    salary: 8,
    contractYears: 2,
    trainingFocus: "defesa",
  };

  const developed = developPlayer(player);

  assert.equal(developed.age, 21);
  assert.ok(developed.defense >= player.defense);
  assert.equal(developed.potential, 90);
  assert.ok((developed.attributes?.perimeterDefense ?? 0) >= player.defense);
});

test("veteran players decline and age during offseason progression", () => {
  const veteran: PlayerDB = {
    ...createPlayer("veteran", "SG"),
    age: 34,
    potential: 82,
    salary: 12,
    contractYears: 1,
    trainingFocus: "arremesso",
  };

  const developed = developPlayer(veteran);

  assert.equal(developed.age, 35);
  assert.equal(developed.attack, veteran.attack - 2);
  assert.equal(developed.contractYears, 1);
});
