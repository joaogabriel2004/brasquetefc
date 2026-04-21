"use client";

import { useEffect, useState } from "react";
import { getBrasqueteDB } from "@/db/brasqueteDb";
import { advanceDay } from "@/services/season/advanceDay";
import { useRouter } from "next/navigation";

export default function SeasonPage() {
  const router = useRouter();

  const [league, setLeague] = useState<any>(null);
  const [games, setGames] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [teamId, setTeamId] = useState<string>("");

  function getSaveId() {
    return localStorage.getItem("currentSaveId");
  }

  async function loadSeason() {
    const saveId = getSaveId();
    if (!saveId) return router.push("/");

    const db = getBrasqueteDB(saveId);

    const lg = await db.league.get("main");
    if (!lg) return;

    setLeague(lg);
    setTeamId(lg.teamIdSelected);

    const g = await db.games
      .where("round")
      .equals(lg.currentRound)
      .toArray();

    const t = await db.teams.toArray();
    const p = await db.players.toArray();

    setGames(g);
    setTeams(t);
    setPlayers(p);
  }

  useEffect(() => {
    loadSeason();
  }, []);

  async function handleAdvanceDay() {
    const saveId = getSaveId();
    if (!saveId) return;

    await advanceDay(saveId);
    await loadSeason();
  }

  if (!league) {
    return <p className="p-10 text-center">Carregando...</p>;
  }

  const myGame = games.find(
    (g) => g.homeTeam === teamId || g.awayTeam === teamId
  );

  const standings = [...teams].sort((a, b) => b.wins - a.wins);

  const topScorers = [...players]
    .sort((a, b) => (b.statsSeason?.points ?? 0) - (a.statsSeason?.points ?? 0))
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-white to-orange-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="bg-white p-6 rounded-xl shadow border border-orange-200">
          <h1 className="text-3xl font-bold text-orange-600">
            🏀 Temporada {league.season}
          </h1>
          <p className="text-gray-600">
            Técnico: <span className="font-semibold">{league.coachName}</span>
          </p>
          <p className="text-gray-600">
            Rodada {league.currentRound} / {league.totalRounds}
          </p>
        </div>

        {/* GRID PRINCIPAL */}
        <div className="grid md:grid-cols-3 gap-6">

          {/* CLASSIFICAÇÃO */}
          <div className="bg-white p-4 rounded-xl shadow border border-orange-200">
            <h2 className="text-lg font-bold text-orange-600 mb-3">
              📊 Classificação
            </h2>

            {standings.map((t, i) => (
              <div
                key={t.id}
                className={`flex justify-between p-2 rounded text-orange-600 ${
                  t.id === teamId ? "bg-orange-100 font-bold" : ""
                }`}
              >
                <span>
                  {i + 1}. {t.name}
                </span>
                <span>
                  {t.wins}-{t.losses}
                </span>
              </div>
            ))}
          </div>

          {/* LÍDERES */}
          <div className="bg-white p-4 rounded-xl shadow border border-orange-200">
            <h2 className="text-lg font-bold text-orange-600 mb-3">
              ⭐ Maiores Pontuadores
            </h2>

            {topScorers.map((p, i) => (
              <div key={p.id} className="flex justify-between p-2 text-orange-600">
                <span>
                  {i + 1}. {p.name}
                </span>
                <span className="font-bold text-orange-600">
                  {p.statsSeason?.points ?? 0} pts
                </span>
              </div>
            ))}
          </div>

          {/* SEU TIME */}
          <div className="bg-white p-4 rounded-xl shadow border border-orange-200">
            <h2 className="text-lg font-bold text-orange-600 mb-3">
              🏀 Seu Time
            </h2>

            {teams
              .filter((t) => t.id === teamId)
              .map((t) => (
                <div key={t.id}>
                  <p className="text-xl font-bold text-orange-600">{t.name}</p>
                  <p className="text-gray-600">
                    {t.wins} vitórias - {t.losses} derrotas
                  </p>
                </div>
              ))}
          </div>
        </div>

        {/* JOGO DO USUÁRIO */}
        <div className="bg-white p-6 rounded-xl shadow border border-orange-200">
          <h2 className="text-xl font-bold text-orange-600 mb-3">
            🎮 Seu jogo
          </h2>

          {myGame ? (
            <button
              onClick={() => router.push(`/match/${myGame.id}`)}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-bold shadow"
            >
              Jogar partida
            </button>
          ) : (
            <p>Nenhum jogo nesta rodada.</p>
          )}
        </div>

        {/* JOGOS DA RODADA */}
        <div className="bg-white p-6 rounded-xl shadow border border-orange-200">
          <h2 className="text-xl font-bold text-orange-600 mb-3">
            📅 Jogos da rodada
          </h2>

          {games.map((g) => (
            <div key={g.id} className="flex justify-between p-2 border-b border-gray-200 text-orange-600">
              <span>
                {g.homeTeam.toUpperCase()} vs {g.awayTeam.toUpperCase()}
              </span>
              <span>
                {g.played
                  ? `${g.score[g.homeTeam]} x ${g.score[g.awayTeam]}`
                  : "A jogar"}
              </span>
            </div>
          ))}
        </div>

        {/* BOTÃO AVANÇAR */}
        <div className="text-center">
          <button
            onClick={handleAdvanceDay}
            className="bg-gray-800 hover:bg-black text-white px-8 py-3 rounded-xl font-bold shadow-lg"
          >
            ⏭️ Avançar rodada
          </button>
        </div>
      </div>
    </div>
  );
}