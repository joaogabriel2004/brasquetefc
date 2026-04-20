"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { getBrasqueteDB } from "@/db/brasqueteDb";

import {
  simulateMatchAsync,
  MatchResult,
  PlayerStats,
  pauseSimulation,
  resumeSimulation,
  substitutePlayer,
  getControlledTeamId
} from "@/utils/simulation";

import { setTactics } from "@/utils/simulation/tacticsControl";
import { setSimulationSpeed } from "@/utils/simulation/speedSimulation";

export default function MatchPage({ params }: any) {
  const { gameId } = use(params);
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

      const database = getBrasqueteDB(saveId);
      setDb(database);

      const game = await database.games.get(gameId);
      const home = await database.teams.get(game.homeTeam);
      const away = await database.teams.get(game.awayTeam);

      const homePlayers = await database.players.where("teamId").equals(home.id).toArray();
      const awayPlayers = await database.players.where("teamId").equals(away.id).toArray();

      home.players = homePlayers;
      away.players = awayPlayers;

      setHomeTeam(home);
      setAwayTeam(away);
    }

    load();
  }, [gameId]);

  if (!homeTeam || !awayTeam) {
    return <p className="p-10 text-center">Carregando partida...</p>;
  }

  const handleSimulate = async () => {
    if (!db) return;

    setLoading(true);
    setResult(null);

    await simulateMatchAsync(
      homeTeam,
      awayTeam,
      async (events, score, quarterScores, boxscore, starters, bench) => {
        setResult({ events, score, quarterScores, boxscore, starters, bench });

        if (events[events.length - 1] === "--- Fim do Jogo ---") {
          setGameEnded(true);
          setPaused(false);

          await db.games.update(gameId, {
            played: true,
            score,
            quarterScores,
            boxscore
          });

          setTimeout(() => router.push("/season"), 1500);
        }
      }
    );

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-white to-orange-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <h1 className="text-3xl font-bold text-gray-800">
            🏀 {homeTeam.name} vs {awayTeam.name}
          </h1>
        </div>

        {/* BOTÕES */}
        <div className="text-center space-x-4">
          {!result && (
            <button
              onClick={handleSimulate}
              className="bg-orange-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-700"
            >
              Simular partida
            </button>
          )}
        </div>

        {/* RESULTADO */}
        {result && (
          <>
            {/* SCORE */}
            <div className="bg-white rounded-xl shadow p-6 text-center">
              <h2 className="text-4xl font-bold text-orange-600">
                {result.score[homeTeam.id]} x {result.score[awayTeam.id]}
              </h2>
            </div>

            {/* VELOCIDADE */}
            <div className="flex justify-center gap-2">
              {[1,2,4,8].map(v => (
                <button
                  key={v}
                  onClick={() => {
                    setSpeed(v);
                    setSimulationSpeed(v);
                  }}
                  className={`px-4 py-2 rounded ${speed === v ? "bg-orange-600 text-white" : "bg-gray-200"}`}
                >
                  {v}x
                </button>
              ))}
            </div>

            {/* EVENTOS */}
            <div className="bg-white rounded-xl shadow p-6 max-h-80 overflow-y-auto">
              {result.events.map((ev, i) => (
                <p key={i} className="text-sm text-gray-700">
                  {ev}
                </p>
              ))}
            </div>

            {/* BOXSCORE */}
            {[homeTeam, awayTeam].map(team => (
              <div key={team.id} className="bg-white rounded-xl shadow p-6">
                <h3 className="text-xl font-bold mb-4">{team.name}</h3>

                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
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
                        <tr key={player.name}>
                          <td className="p-2">{player.name}</td>
                          <td>{s.points}</td>
                          <td>{s.fgm}/{s.fga}</td>
                          <td>{s.tpm}/{s.tpa}</td>
                          <td>{s.ftm}/{s.fta}</td>
                          <td>
                            <div className="w-full bg-gray-200 h-3 rounded">
                              <div
                                className="h-3 rounded bg-green-500"
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