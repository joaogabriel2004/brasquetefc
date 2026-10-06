"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { GameDB, LeagueDB, PlayerDB, TeamDB } from "@/db/brasqueteDb";
import { advanceDay } from "@/services/season/advanceDay";
import { loadSeasonDashboard } from "@/services/season/seasonData";
import { startNextSeason } from "@/services/season/startNextSeason";
import type { PlayerStats } from "@/utils/simulation/types";

function getCurrentSaveId() {
  return localStorage.getItem("currentSaveId");
}

function getGameScore(game: GameDB, teamId: string, side: "home" | "away") {
  return game.score?.[teamId] ?? game.score?.[side] ?? 0;
}

export default function SeasonPage() {
  const router = useRouter();

  const [league, setLeague] = useState<LeagueDB | null>(null);
  const [games, setGames] = useState<GameDB[]>([]);
  const [teams, setTeams] = useState<TeamDB[]>([]);
  const [players, setPlayers] = useState<PlayerDB[]>([]);
  const [teamId, setTeamId] = useState<string>("");
  const [latestGame, setLatestGame] = useState<GameDB | null>(null);
  const [seasonGames, setSeasonGames] = useState<GameDB[]>([]);
  const [historySeason, setHistorySeason] = useState<number | null>(null);
  const [seasonActionBusy, setSeasonActionBusy] = useState(false);

  const loadSeason = useCallback(async () => {
    const saveId = getCurrentSaveId();
    if (!saveId) {
      router.push("/");
      return;
    }

    const data = await loadSeasonDashboard(saveId);
    if (!data) return;

    setLeague(data.league);
    setTeamId(data.league.teamIdSelected);
    setGames(data.games);
    setTeams(data.teams);
    setPlayers(data.players);
    setLatestGame(data.latestGame);
    setSeasonGames(data.seasonGames);
    setHistorySeason((currentSeason) => currentSeason ?? data.league.season);
  }, [router]);

  useEffect(() => {
    void loadSeason();
  }, [loadSeason]);

  async function handleAdvanceDay() {
    const saveId = getCurrentSaveId();
    if (!saveId || seasonActionBusy) return;

    setSeasonActionBusy(true);
    await advanceDay(saveId);
    await loadSeason();
    setSeasonActionBusy(false);
  }

  async function handleStartNextSeason() {
    const saveId = getCurrentSaveId();
    if (!saveId || seasonActionBusy) return;

    setSeasonActionBusy(true);
    await startNextSeason(saveId);
    await loadSeason();
    setSeasonActionBusy(false);
  }

  if (!league) {
    return <p className="p-10 text-center">Carregando...</p>;
  }

  const myGame = games.find(
    (g) => g.homeTeam === teamId || g.awayTeam === teamId,
  );

  const latestPlayerStats = Object.entries(latestGame?.boxscore?.[teamId] ?? {})
    .map(([name, stats]) => ({ name, stats: stats as PlayerStats }))
    .sort((a, b) => b.stats.points - a.stats.points);
  const latestHomeTeam = teams.find((team) => team.id === latestGame?.homeTeam);
  const latestAwayTeam = teams.find((team) => team.id === latestGame?.awayTeam);

  const standings = [...teams].sort((a, b) => b.wins - a.wins);

  const topScorers = [...players]
    .sort((a, b) => (b.statsSeason?.points ?? 0) - (a.statsSeason?.points ?? 0))
    .slice(0, 10);
  const topRebounders = [...players]
    .sort(
      (left, right) =>
        (right.statsSeason?.rebounds ?? 0) - (left.statsSeason?.rebounds ?? 0),
    )
    .slice(0, 5);
  const topAssisters = [...players]
    .sort(
      (left, right) =>
        (right.statsSeason?.assists ?? 0) - (left.statsSeason?.assists ?? 0),
    )
    .slice(0, 5);
  const offseason = league.currentRound > league.totalRounds;
  const historySeasons = [
    ...new Set(seasonGames.map((game) => game.season ?? 1)),
  ].sort((left, right) => right - left);
  const visibleHistoryGames = seasonGames.filter(
    (game) => (game.season ?? 1) === (historySeason ?? league.season),
  );

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
          <button
            type="button"
            onClick={() => router.push("/team")}
            className="mt-4 rounded bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
          >
            Escalação e táticas
          </button>
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
              <div
                key={p.id}
                className="flex justify-between p-2 text-orange-600"
              >
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

          {myGame?.played ? (
            <p className="font-bold text-green-700">
              Partida concluída: {getGameScore(myGame, myGame.homeTeam, "home")}{" "}
              x {getGameScore(myGame, myGame.awayTeam, "away")}
            </p>
          ) : myGame ? (
            <button
              type="button"
              onClick={() => router.push(`/match/${myGame.id}`)}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-bold shadow cursor-pointer"
            >
              Jogar partida
            </button>
          ) : (
            <p>Nenhum jogo nesta rodada.</p>
          )}
        </div>

        {/* ESTATÍSTICAS DO ÚLTIMO JOGO */}
        <section className="bg-white p-6 rounded-xl shadow border border-orange-200">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-orange-600">
                Estatísticas do último jogo
              </h2>
              {latestGame && (
                <p className="mt-1 text-sm text-gray-600">
                  Rodada {latestGame.round} ·{" "}
                  {latestHomeTeam?.name ?? latestGame.homeTeam}{" "}
                  {getGameScore(latestGame, latestGame.homeTeam, "home")} x{" "}
                  {getGameScore(latestGame, latestGame.awayTeam, "away")}{" "}
                  {latestAwayTeam?.name ?? latestGame.awayTeam}
                </p>
              )}
            </div>
          </div>

          {latestPlayerStats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
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
                  </tr>
                </thead>
                <tbody>
                  {latestPlayerStats.map(({ name, stats }) => (
                    <tr
                      key={name}
                      className="border-b border-gray-100 text-gray-700"
                    >
                      <td className="p-2 font-semibold">{name}</td>
                      <td className="text-center font-bold">
                        {stats.points ?? 0}
                      </td>
                      <td className="text-center">{stats.rebounds ?? 0}</td>
                      <td className="text-center">{stats.assists ?? 0}</td>
                      <td className="text-center">
                        {stats.twoPM ??
                          Math.max(0, (stats.fgm ?? 0) - (stats.tpm ?? 0))}
                        /
                        {stats.twoPA ??
                          Math.max(0, (stats.fga ?? 0) - (stats.tpa ?? 0))}
                      </td>
                      <td className="text-center">
                        {stats.tpm ?? 0}/{stats.tpa ?? 0}
                      </td>
                      <td className="text-center">
                        {stats.ftm ?? 0}/{stats.fta ?? 0}
                      </td>
                      <td className="text-center">{stats.turnovers ?? 0}</td>
                      <td className="text-center">{stats.steals ?? 0}</td>
                      <td className="text-center">{stats.blocks ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Ainda não há estatísticas de uma partida concluída.
            </p>
          )}
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          {[
            {
              title: "Líderes em rebotes",
              players: topRebounders,
              value: "rebounds",
              suffix: "REB",
            },
            {
              title: "Líderes em assistências",
              players: topAssisters,
              value: "assists",
              suffix: "AST",
            },
          ].map((leaderboard) => (
            <section
              key={leaderboard.title}
              className="bg-white p-5 rounded-xl shadow border border-orange-200"
            >
              <h2 className="mb-3 text-lg font-bold text-orange-600">
                {leaderboard.title}
              </h2>
              {leaderboard.players.map((player, index) => (
                <div
                  key={player.id}
                  className="flex justify-between border-b border-gray-100 py-2 text-sm"
                >
                  <span>
                    {index + 1}. {player.name}
                  </span>
                  <span className="font-bold">
                    {player.statsSeason?.[
                      leaderboard.value as "rebounds" | "assists"
                    ] ?? 0}{" "}
                    {leaderboard.suffix}
                  </span>
                </div>
              ))}
            </section>
          ))}
        </div>

        <section className="bg-white p-6 rounded-xl shadow border border-orange-200">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-xl font-bold text-orange-600">
              Histórico da temporada
            </h2>
            {historySeasons.length > 1 && (
              <label className="text-sm font-semibold text-gray-700">
                Temporada
                <select
                  value={historySeason ?? league.season}
                  onChange={(event) =>
                    setHistorySeason(Number(event.target.value))
                  }
                  className="ml-2 border border-gray-300 bg-white px-3 py-2 font-normal"
                >
                  {historySeasons.map((season) => (
                    <option key={season} value={season}>
                      {season}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          {visibleHistoryGames.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm">
                <thead className="bg-orange-100 text-orange-700">
                  <tr>
                    <th className="p-2 text-left">Rodada</th>
                    <th className="text-left">Adversário</th>
                    <th>Placar</th>
                    <th>PTS</th>
                    <th>REB</th>
                    <th>AST</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleHistoryGames.map((game) => {
                    const isHome = game.homeTeam === teamId;
                    const opponentId = isHome ? game.awayTeam : game.homeTeam;
                    const gameStats = Object.values(
                      game.boxscore?.[teamId] ?? {},
                    );
                    const sum = (key: "points" | "rebounds" | "assists") =>
                      gameStats.reduce(
                        (total, stats) => total + (stats[key] ?? 0),
                        0,
                      );
                    return (
                      <tr
                        key={game.id}
                        className="border-b border-gray-100 text-gray-700"
                      >
                        <td className="p-2">{game.round}</td>
                        <td>
                          {teams.find((team) => team.id === opponentId)?.name ??
                            opponentId}
                        </td>
                        <td className="text-center font-bold">
                          {getGameScore(game, teamId, isHome ? "home" : "away")}{" "}
                          x{" "}
                          {getGameScore(
                            game,
                            opponentId,
                            isHome ? "away" : "home",
                          )}{" "}
                          {isHome ? "(C)" : "(F)"}
                        </td>
                        <td className="text-center">{sum("points")}</td>
                        <td className="text-center">{sum("rebounds")}</td>
                        <td className="text-center">{sum("assists")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Seu histórico desta temporada começa após a primeira partida.
            </p>
          )}
        </section>

        {/* JOGOS DA RODADA */}
        <div className="bg-white p-6 rounded-xl shadow border border-orange-200">
          <h2 className="text-xl font-bold text-orange-600 mb-3">
            📅 Jogos da rodada
          </h2>

          {games.map((g) => (
            <div
              key={g.id}
              className="flex justify-between p-2 border-b border-gray-200 text-orange-600"
            >
              <span>
                {g.homeTeam.toUpperCase()} vs {g.awayTeam.toUpperCase()}
              </span>
              <span>
                {g.played
                  ? `${getGameScore(g, g.homeTeam, "home")} x ${getGameScore(g, g.awayTeam, "away")}`
                  : "A jogar"}
              </span>
            </div>
          ))}
        </div>

        {/* BOTÃO AVANÇAR */}
        <div className="text-center">
          {offseason ? (
            <div className="space-y-3">
              <p className="font-semibold text-gray-700">
                Temporada encerrada. Os jogadores podem evoluir, envelhecer ou
                ficar livres no mercado.
              </p>
              <button
                type="button"
                disabled={seasonActionBusy}
                onClick={handleStartNextSeason}
                className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg disabled:opacity-50"
              >
                {seasonActionBusy
                  ? "Preparando temporada..."
                  : "Iniciar próxima temporada"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={seasonActionBusy}
              onClick={handleAdvanceDay}
              className="bg-gray-800 hover:bg-black text-white px-8 py-3 rounded-xl font-bold shadow-lg disabled:opacity-50"
            >
              {seasonActionBusy ? "Simulando rodada..." : "⏭️ Avançar rodada"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
