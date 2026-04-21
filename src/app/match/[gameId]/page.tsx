"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { getBrasqueteDB } from "@/db/brasqueteDb";
import { savesDb } from "@/db/savesDb";
import { updateStandings } from "@/services/season/updateStandings";
import { useParams } from "next/navigation";

import {
  simulateMatchAsync,
  MatchResult,
  PlayerStats,
  pauseSimulation,
  resumeSimulation,
  substitutePlayer,
} from "@/utils/simulation";

import {
  getControlledTeamId,
  setControlledTeamId
} from "@/utils/simulation/lineup";

import { setTactics } from "@/utils/simulation/tacticsControl";
import { setSimulationSpeed } from "@/utils/simulation/speedSimulation";

export default function MatchPage() {
  const params = useParams();
  const gameId = params.gameId as string;
  const router = useRouter();

  const [db, setDb] = useState<any>(null);
  const [homeTeam, setHomeTeam] = useState<any>(null);
  const [awayTeam, setAwayTeam] = useState<any>(null);

  const [result, setResult] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [paused, setPaused] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [showSubs, setShowSubs] = useState<string | null>(null);

  const [ritmo, setRitmo] = useState("medio");
  const [foco, setFoco] = useState("perimetro");
  const [defesa, setDefesa] = useState("homem");
  const [speed, setSpeed] = useState(1);

  const controlledTeamId = getControlledTeamId();

  useEffect(() => {
    async function load() {
      const saveId = localStorage.getItem("currentSaveId");
      if (!saveId) return router.push("/");

      const save = await savesDb.saves.get(saveId);
      if (save) {
        setControlledTeamId(save.teamId);
      }

      const database = getBrasqueteDB(saveId);
      setDb(database);

      const game = await database.games.get(gameId);

      if (!game) {
        console.error("❌ Jogo não encontrado:", gameId);
        return;
      }

      const home = await database.teams.get(game.homeTeam);
      const away = await database.teams.get(game.awayTeam);

      if (!home || !away) {
        console.error("❌ Times não encontrados");
        return;
      }

      const homePlayers = await database.players
        .where("teamId")
        .equals(home.id)
        .toArray();

      const awayPlayers = await database.players
        .where("teamId")
        .equals(away.id)
        .toArray();

      const homeTeam = { ...home, players: homePlayers };
      const awayTeam = { ...away, players: awayPlayers };

      setHomeTeam({ ...home, players: homePlayers });
      setAwayTeam({ ...away, players: awayPlayers });
    }

    load();
  }, [gameId]); 

  if (!homeTeam || !awayTeam) {
    return (
      <p className="p-10 text-center text-orange-600 font-bold text-xl">
        Carregando partida...
      </p>
    );
  }

  const handleSimulate = async () => {
    if (!db) return;

    setLoading(true);
    setResult(null);
    setGameEnded(false);

    await simulateMatchAsync(
    homeTeam,
    awayTeam,
    async (events, score, quarterScores, boxscore, starters, bench) => {
        setResult({ events, score, quarterScores, boxscore, starters, bench });

        if (events[events.length - 1] === "--- Fim do Jogo ---") {
        setGameEnded(true);
        setPaused(false);

        if (gameEnded) return;

        await db.games.update(gameId, {
            played: true,
            score,
            quarterScores,
            boxscore
        });

        await db.games.update(gameId, {
        played: true,
        score,
        quarterScores,
        boxscore
      });

      await updateStandings(db, homeTeam.id, awayTeam.id, score);

        // atualiza stats dos jogadores no banco de dados
        for (const teamId of [homeTeam.id, awayTeam.id]) {
            const teamBoxscore = boxscore[teamId];

            for (const playerName in teamBoxscore) {
            const stats = teamBoxscore[playerName];

            const player = await db.players
                .where({ teamId, name: playerName })
                .first();

            if (!player) continue;

            await db.players.update(player.id, {
                statsSeason: {
                    points: (player.statsSeason?.points ?? 0) + stats.points,
                    rebounds: (player.statsSeason?.rebounds ?? 0) + (stats.rebounds ?? 0),
                    assists: (player.statsSeason?.assists ?? 0) + (stats.assists ?? 0),
                }
            });
            }
        }
        }
    }
    );

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
              onClick={handleSimulate}
              className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg"
            >
              🔥 Simular partida
            </button>
          )}
        </div>

        {result && (
          <>
            {/* SCORE */}
            <div className="bg-white rounded-xl shadow-lg p-6 text-center border-2 border-orange-300">
              <h2 className="text-5xl font-extrabold text-orange-600">
                {homeTeam.id.toUpperCase()} {result.score[homeTeam.id]} x {result.score[awayTeam.id]} {awayTeam.id.toUpperCase()}
              </h2>
            </div>

            {/* CONTROLES */}
            <div className="flex justify-center gap-3 flex-wrap">

            
              {!paused ? (
                <button
                  onClick={() => {
                    pauseSimulation();
                    setPaused(true);
                  }}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-bold"
                >
                  ⏸️ Pausar
                </button>
              ) : (
                <button
                  onClick={() => {
                    resumeSimulation();
                    setPaused(false);
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-bold"
                >
                  ▶️ Continuar
                </button>
              )}

              {[1, 2, 4, 8].map(v => (
                <button
                  key={v}
                  onClick={() => {
                    setSpeed(v);
                    setSimulationSpeed(v);
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

            {/* TÁTICAS */}
            {controlledTeamId === homeTeam.id && (
              <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-orange-300">
                <h3 className="text-xl font-bold text-orange-600 mb-3">🎯 Táticas</h3>

                <div className="flex gap-3 text-orange-500">
                  <select
                    value={ritmo}
                    onChange={(e) => {
                      setRitmo(e.target.value);
                      setTactics({ ritmo: e.target.value });
                    }}
                    className="p-2 border rounded-lg"
                  >
                    <option value="lento">Lento</option>
                    <option value="medio">Médio</option>
                    <option value="rapido">Rápido</option>
                  </select>

                  <select
                    value={foco}
                    onChange={(e) => {
                      setFoco(e.target.value);
                      setTactics({ foco: e.target.value });
                    }}
                    className="p-2 border rounded-lg"
                  >
                    <option value="garrafao">Garrafão</option>
                    <option value="perimetro">Perímetro</option>
                  </select>

                  <select
                    value={defesa}
                    onChange={(e) => {
                      setDefesa(e.target.value);
                      setTactics({ defesa: e.target.value });
                    }}
                    className="p-2 border rounded-lg"
                  >
                    <option value="homem">Homem</option>
                    <option value="zona">Zona</option>
                    <option value="mista">Mista</option>
                  </select>
                </div>
              </div>
            )}

            {/* EVENTOS */}
            <div className="bg-white rounded-xl shadow-lg p-6 max-h-80 overflow-y-auto border border-orange-200">
              {result.events.map((ev, i) => (
                <p key={i} className="text-sm text-gray-700">
                  {ev}
                </p>
              ))}
            </div>

            {/* BOXSCORE */}
            {[homeTeam, awayTeam].map(team => (
              <div key={team.id} className="bg-white rounded-xl shadow-lg p-6 border-2 border-orange-300">
                <h3 className="text-xl font-bold text-orange-600 mb-4">{team.name}</h3>

                <table className="w-full text-sm">
                  <thead className="bg-orange-100 text-orange-700">
                    <tr>
                      <th className="p-2 text-left">Jogador</th>
                      <th>PTS</th>
                      <th>FG</th>
                      <th>3PT</th>
                      <th>FT</th>
                      <th>Energia</th>
                    </tr>
                  </thead>

                  <tbody>
                    {result.starters[team.id].map(player => {
                      const s = result.boxscore[team.id][player.name] as PlayerStats;

                      return (
                        <tr key={player.name} className="border-b border-gray-200 text-orange-500">
                          <td className="p-2">
                            {player.position} {player.name}

                            {team.id === controlledTeamId && (
                              <button
                                onClick={() =>
                                  setShowSubs(showSubs === player.name ? null : player.name)
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
                                        const inPlayer = result.bench[team.id].find(p => p.name === subName);
                                        if (!inPlayer) return;

                                        substitutePlayer(
                                        team.id,
                                        player,
                                        inPlayer,
                                        result.starters,
                                        result.bench
                                        );

                                        setResult({ ...result }); 
                                        setShowSubs(null); // fecha menu
                                    }}
                                    >
                                    <option value="" disabled>
                                        Selecione um substituto
                                    </option>

                                    {result.bench[team.id]
                                        .map(sub => (
                                        <option key={sub.name} value={sub.name}>
                                            {sub.name} ({sub.position})
                                        </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            </td>

                          <td className="font-bold text-orange-600">{s.points}</td>
                          <td>{s.fgm}/{s.fga}</td>
                          <td>{s.tpm}/{s.tpa}</td>
                          <td>{s.ftm}/{s.fta}</td>
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
            ))}
          </>
        )}
      </div>
    </div>
  );
}   