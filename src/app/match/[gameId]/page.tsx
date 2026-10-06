"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  DEFAULT_TACTICS,
  type ShotPriorities,
  type ShotPriority,
  type Tactics,
} from "@/data/teams";
import {
  isGamePlayed,
  loadMatchData,
  type MatchTeamData,
  recordMatchResult,
  saveMatchShotPriorities,
  saveMatchTactics,
} from "@/services/season/matchData";

import {
  type MatchResult,
  type PlayerStats,
  simulateMatchAsync,
  substitutePlayer,
} from "@/utils/simulation";

import { sleep } from "@/utils/simulation/utils";

export default function MatchPage() {
  const params = useParams();
  const gameId = params.gameId as string;
  const router = useRouter();

  const [homeTeam, setHomeTeam] = useState<MatchTeamData | null>(null);
  const [awayTeam, setAwayTeam] = useState<MatchTeamData | null>(null);

  const [result, setResult] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [paused, setPaused] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [timeoutsRemaining, setTimeoutsRemaining] = useState<
    Record<string, number>
  >({});
  const [alreadyPlayed, setAlreadyPlayed] = useState(false);
  const [showSubs, setShowSubs] = useState<string | null>(null);
  const simulationStarted = useRef(false);
  const pauseController = useRef<{
    paused: boolean;
    speed: number;
    resume: (() => void) | null;
  }>({ paused: false, speed: 1, resume: null });

  const [controlledTeamId, setMatchControlledTeamId] = useState<string | null>(
    null,
  );
  const [ritmo, setRitmo] = useState<Tactics["ritmo"]>("medio");
  const [foco, setFoco] = useState<Tactics["foco"]>("perimetro");
  const [defesa, setDefesa] = useState<Tactics["defesa"]>("homem");
  const [shotPriorities, setShotPriorities] = useState<ShotPriorities>({});
  const tacticsRef = useRef<Tactics>(DEFAULT_TACTICS);
  const shotPrioritiesRef = useRef<ShotPriorities>({});
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    async function load() {
      const saveId = localStorage.getItem("currentSaveId");
      if (!saveId) return router.push("/");

      const matchData = await loadMatchData(saveId, gameId);
      if (!matchData) {
        console.error("❌ Jogo não encontrado:", gameId);
        return;
      }

      if (matchData.game.played) {
        setAlreadyPlayed(true);
        router.replace("/season");
        return;
      }

      const { homeTeam: home, awayTeam: away, save } = matchData;
      const controlledTeam = home.id === save?.teamId ? home : away;
      setTimeoutsRemaining({ [home.id]: 7, [away.id]: 7 });
      const savedTactics = { ...DEFAULT_TACTICS, ...controlledTeam.tactics };
      setMatchControlledTeamId(save?.teamId ?? null);
      setRitmo(savedTactics.ritmo);
      setFoco(savedTactics.foco);
      setDefesa(savedTactics.defesa);
      tacticsRef.current = savedTactics;
      const savedShotPriorities = controlledTeam.shotPriorities ?? {};
      setShotPriorities(savedShotPriorities);
      shotPrioritiesRef.current = savedShotPriorities;

      setHomeTeam(home);
      setAwayTeam(away);
    }

    load();
  }, [gameId, router]);

  if (alreadyPlayed) {
    return (
      <p className="p-10 text-center text-orange-600 font-bold text-xl">
        Esta partida já foi concluída. Voltando à temporada...
      </p>
    );
  }

  if (!homeTeam || !awayTeam) {
    return (
      <p className="p-10 text-center text-orange-600 font-bold text-xl">
        Carregando partida...
      </p>
    );
  }

  const controlledTeam = homeTeam.id === controlledTeamId ? homeTeam : awayTeam;

  function requestTimeout() {
    if (!controlledTeamId || (timeoutsRemaining[controlledTeamId] ?? 0) <= 0)
      return;
    setTimeoutsRemaining({
      ...timeoutsRemaining,
      [controlledTeamId]: timeoutsRemaining[controlledTeamId] - 1,
    });
    pauseController.current.paused = true;
    setPaused(true);
  }

  async function updateMatchTactics(nextTactics: Tactics) {
    setRitmo(nextTactics.ritmo);
    setFoco(nextTactics.foco);
    setDefesa(nextTactics.defesa);
    tacticsRef.current = nextTactics;

    const saveId = localStorage.getItem("currentSaveId");
    if (saveId && controlledTeamId) {
      await saveMatchTactics(saveId, controlledTeamId, nextTactics);
    }
  }

  async function updateShotPriority(playerId: string, priority: ShotPriority) {
    const nextPriorities = { ...shotPriorities, [playerId]: priority };
    setShotPriorities(nextPriorities);
    shotPrioritiesRef.current = nextPriorities;

    const saveId = localStorage.getItem("currentSaveId");
    if (saveId && controlledTeamId) {
      await saveMatchShotPriorities(saveId, controlledTeamId, nextPriorities);
    }
  }

  const handleSimulate = async () => {
    const saveId = localStorage.getItem("currentSaveId");
    if (!saveId || simulationStarted.current) return;
    simulationStarted.current = true;

    if (await isGamePlayed(saveId, gameId)) {
      setAlreadyPlayed(true);
      router.replace("/season");
      return;
    }

    setLoading(true);
    setResult(null);
    setGameEnded(false);

    await simulateMatchAsync(homeTeam, awayTeam, {
      getTactics: (teamId) =>
        teamId === controlledTeamId ? tacticsRef.current : undefined,
      getShotPriorities: (teamId) =>
        teamId === controlledTeamId ? shotPrioritiesRef.current : undefined,
      beforePossession: async () => {
        if (pauseController.current.paused) {
          await new Promise<void>((resolve) => {
            pauseController.current.resume = resolve;
          });
        }
        await sleep(500 / pauseController.current.speed);
      },
      onUpdate: async (snapshot) => {
        setResult(snapshot);

        if (
          snapshot.events[snapshot.events.length - 1] === "--- Fim do Jogo ---"
        ) {
          setPaused(false);
          pauseController.current.paused = false;

          if (gameEnded) return;

          const recorded = await recordMatchResult(
            saveId,
            gameId,
            homeTeam.id,
            awayTeam.id,
            snapshot,
          );
          if (recorded) setGameEnded(true);
        }
      },
    });

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-white to-orange-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="bg-white rounded-xl shadow-lg p-6 text-center border-2 border-orange-300">
          <h1 className="text-3xl font-extrabold text-orange-600">
            🏀 {homeTeam.name} vs {awayTeam.name}
          </h1>
        </div>

        {/* BOTÕES */}
        <div className="text-center space-x-4">
          {!result && (
            <button
              type="button"
              onClick={handleSimulate}
              className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg"
            >
              🔥 Simular partida
            </button>
          )}
          {gameEnded && (
            <a
              href="/season"
              className="inline-block bg-gray-800 hover:bg-black text-white px-6 py-3 rounded-xl font-bold shadow"
            >
              Voltar à temporada
            </a>
          )}
        </div>

        {(controlledTeamId === homeTeam.id ||
          controlledTeamId === awayTeam.id) && (
          <section className="bg-white rounded-xl shadow-lg p-6 border-2 border-orange-300">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
              <div>
                <h2 className="text-xl font-bold text-orange-600">
                  Plano de jogo
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  As mudanças valem na próxima posse e ficam salvas para os
                  próximos jogos.
                </p>
              </div>
              {loading && (
                <span className="text-sm font-semibold text-green-700">
                  Ajustes ao vivo
                </span>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-sm font-semibold text-gray-700">
                Ritmo
                <select
                  value={ritmo}
                  onChange={(event) =>
                    updateMatchTactics({
                      ritmo: event.target.value as Tactics["ritmo"],
                      foco: foco as Tactics["foco"],
                      defesa: defesa as Tactics["defesa"],
                    })
                  }
                  className="mt-1 w-full border border-gray-300 rounded-lg p-2 font-normal"
                >
                  <option value="lento">Controlado</option>
                  <option value="medio">Equilibrado</option>
                  <option value="rapido">Acelerado</option>
                </select>
              </label>
              <label className="text-sm font-semibold text-gray-700">
                Foco ofensivo
                <select
                  value={foco}
                  onChange={(event) =>
                    updateMatchTactics({
                      ritmo: ritmo as Tactics["ritmo"],
                      foco: event.target.value as Tactics["foco"],
                      defesa: defesa as Tactics["defesa"],
                    })
                  }
                  className="mt-1 w-full border border-gray-300 rounded-lg p-2 font-normal"
                >
                  <option value="garrafao">Garrafão</option>
                  <option value="perimetro">Perímetro</option>
                </select>
              </label>
              <label className="text-sm font-semibold text-gray-700">
                Defesa
                <select
                  value={defesa}
                  onChange={(event) =>
                    updateMatchTactics({
                      ritmo: ritmo as Tactics["ritmo"],
                      foco: foco as Tactics["foco"],
                      defesa: event.target.value as Tactics["defesa"],
                    })
                  }
                  className="mt-1 w-full border border-gray-300 rounded-lg p-2 font-normal"
                >
                  <option value="homem">Individual</option>
                  <option value="zona">Por zona</option>
                  <option value="mista">Mista</option>
                </select>
              </label>
            </div>

            <div className="mt-6 border-t border-gray-200 pt-4">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-700">
                Volume de arremessos
              </h3>
              <div className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
                {controlledTeam.players.map(
                  (player: { id: string; name: string; position: string }) => (
                    <label
                      key={player.id}
                      className="flex items-center justify-between gap-3 border-b border-gray-100 py-2 text-sm"
                    >
                      <span className="min-w-0 truncate font-medium text-gray-700">
                        {player.position} · {player.name}
                      </span>
                      <select
                        aria-label={`Prioridade de arremesso para ${player.name}`}
                        value={shotPriorities[player.id] ?? "normal"}
                        onChange={(event) =>
                          updateShotPriority(
                            player.id,
                            event.target.value as ShotPriority,
                          )
                        }
                        className="shrink-0 border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="less">Menos</option>
                        <option value="normal">Normal</option>
                        <option value="more">Mais</option>
                      </select>
                    </label>
                  ),
                )}
              </div>
            </div>
          </section>
        )}

        {result && (
          <>
            {/* SCORE */}
            <div className="bg-white rounded-xl shadow-lg p-6 text-center border-2 border-orange-300">
              <h2 className="text-5xl font-extrabold text-orange-600">
                {homeTeam.id.toUpperCase()} {result.score[homeTeam.id]} x{" "}
                {result.score[awayTeam.id]} {awayTeam.id.toUpperCase()}
              </h2>
            </div>

            {/* CONTROLES */}
            <div className="flex justify-center gap-3 flex-wrap">
              {!paused ? (
                <button
                  type="button"
                  onClick={() => {
                    pauseController.current.paused = true;
                    setPaused(true);
                  }}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-bold"
                >
                  ⏸️ Pausar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    pauseController.current.paused = false;
                    pauseController.current.resume?.();
                    pauseController.current.resume = null;
                    setPaused(false);
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-bold"
                >
                  ▶️ Continuar
                </button>
              )}

              {controlledTeamId && (
                <button
                  type="button"
                  disabled={
                    paused || (timeoutsRemaining[controlledTeamId] ?? 0) === 0
                  }
                  onClick={requestTimeout}
                  className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50"
                >
                  Tempo técnico ({timeoutsRemaining[controlledTeamId] ?? 0})
                </button>
              )}

              {[1, 2, 4, 8].map((v) => (
                <button
                  type="button"
                  key={v}
                  onClick={() => {
                    setSpeed(v);
                    pauseController.current.speed = v;
                  }}
                  className={`px-4 py-2 rounded-lg font-bold ${
                    speed === v
                      ? "bg-orange-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  {v}x
                </button>
              ))}
            </div>

            {/* EVENTOS */}
            <div className="bg-white rounded-xl shadow-lg p-6 max-h-80 overflow-y-auto border border-orange-200">
              {(() => {
                const occurrences = new Map<string, number>();
                return result.events.map((event) => {
                  const occurrence = occurrences.get(event) ?? 0;
                  occurrences.set(event, occurrence + 1);
                  return (
                    <p
                      key={`${event}-${occurrence}`}
                      className="text-sm text-gray-700"
                    >
                      {event}
                    </p>
                  );
                });
              })()}
            </div>

            {/* BOXSCORE */}
            {[homeTeam, awayTeam].map((team) => (
              <div
                key={team.id}
                className="bg-white rounded-xl shadow-lg p-6 border-2 border-orange-300"
              >
                <h3 className="text-xl font-bold text-orange-600 mb-4">
                  {team.name}
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-sm">
                    <thead className="bg-orange-100 text-orange-700">
                      <tr>
                        <th className="p-2 text-left">Jogador</th>
                        <th>PTS</th>
                        <th>REB</th>
                        <th>AST</th>
                        <th>2PT</th>
                        <th>3PT</th>
                        <th>FT</th>
                        <th>TOV</th>
                        <th>STL</th>
                        <th>BLK</th>
                        <th>PF</th>
                        <th>Energia</th>
                      </tr>
                    </thead>

                    <tbody>
                      {result.starters[team.id].map((player) => {
                        const s = result.boxscore[team.id][
                          player.name
                        ] as PlayerStats;

                        return (
                          <tr
                            key={player.name}
                            className="border-b border-gray-200 text-orange-500"
                          >
                            <td className="p-2">
                              {player.position} {player.name}
                              {team.id === controlledTeamId && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowSubs(
                                      showSubs === player.name
                                        ? null
                                        : player.name,
                                    )
                                  }
                                  className="ml-2 text-blue-600"
                                >
                                  ⇆
                                </button>
                              )}
                              {showSubs === player.name && (
                                <div className="absolute bg-white border rounded shadow p-2 mt-1 z-50">
                                  <select
                                    className="border p-1 rounded"
                                    defaultValue=""
                                    onChange={(e) => {
                                      const subName = e.target.value;
                                      if (!subName || !result) return;
                                      const inPlayer = result.bench[
                                        team.id
                                      ].find((p) => p.name === subName);
                                      if (!inPlayer) return;

                                      substitutePlayer(
                                        team.id,
                                        player,
                                        inPlayer,
                                        result.starters,
                                        result.bench,
                                      );

                                      setResult({ ...result });
                                      setShowSubs(null); // fecha menu
                                    }}
                                  >
                                    <option value="" disabled>
                                      Selecione um substituto
                                    </option>

                                    {result.bench[team.id].map((sub) => (
                                      <option key={sub.name} value={sub.name}>
                                        {sub.name} ({sub.position})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </td>

                            <td className="font-bold text-orange-600">
                              {s.points}
                            </td>
                            <td>{s.rebounds}</td>
                            <td>{s.assists}</td>
                            <td>
                              {s.twoPM ?? Math.max(0, s.fgm - s.tpm)}/
                              {s.twoPA ?? Math.max(0, s.fga - s.tpa)}
                            </td>
                            <td>
                              {s.tpm}/{s.tpa}
                            </td>
                            <td>
                              {s.ftm}/{s.fta}
                            </td>
                            <td>{s.turnovers}</td>
                            <td>{s.steals}</td>
                            <td>{s.blocks}</td>
                            <td>{s.fouls}</td>
                            <td>
                              <div className="w-full bg-gray-200 h-3 rounded">
                                <div
                                  className="h-3 bg-green-500 rounded"
                                  style={{ width: `${s.energy}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {result.bench[team.id].map((player) => {
                        const s = result.boxscore[team.id][
                          player.name
                        ] as PlayerStats;

                        return (
                          <tr
                            key={player.name}
                            className="border-b border-gray-200 text-gray-500"
                          >
                            <td className="p-2">
                              {player.position} {player.name}
                            </td>
                            <td className="font-bold text-gray-600">
                              {s.points}
                            </td>
                            <td>{s.rebounds}</td>
                            <td>{s.assists}</td>
                            <td>
                              {s.twoPM ?? Math.max(0, s.fgm - s.tpm)}/
                              {s.twoPA ?? Math.max(0, s.fga - s.tpa)}
                            </td>
                            <td>
                              {s.tpm}/{s.tpa}
                            </td>
                            <td>
                              {s.ftm}/{s.fta}
                            </td>
                            <td>{s.turnovers}</td>
                            <td>{s.steals}</td>
                            <td>{s.blocks}</td>
                            <td>{s.fouls}</td>
                            <td>
                              <div className="w-full bg-gray-200 h-3 rounded">
                                <div
                                  className="h-3 bg-green-500 rounded"
                                  style={{ width: `${s.energy}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
