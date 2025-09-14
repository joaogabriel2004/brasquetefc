'use client';
import { useEffect, useState } from "react";
import { initSeason, playRound, getCurrentRound } from "../../utils/simulation/season";
import { initStandings, getStandings } from "../../utils/simulation/standings";

export default function SeasonPage() {
  const [round, setRound] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const [table, setTable] = useState<any[]>([]);

  useEffect(() => {
    initSeason();
    initStandings();
  }, []);

  const handlePlayRound = async () => {
    await playRound((roundResults) => {
      setResults(roundResults);
      setTable(getStandings());
      setRound(getCurrentRound());
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">🏀 Temporada</h1>
      <button
        onClick={handlePlayRound}
        className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg mb-6"
      >
        Jogar Rodada {round + 1}
      </button>

      <h2 className="text-xl font-bold">Resultados da Rodada {round}</h2>
      <ul>
        {results.map((r, i) => (
          <li key={i}>{Object.values(r.score).join(" - ")}</li>
        ))}
      </ul>

      <h2 className="text-xl font-bold mt-6">Classificação</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th>Time</th>
            <th>Vitórias</th>
            <th>Derrotas</th>
            <th>Aproveitamento</th>
          </tr>
        </thead>
        <tbody>
          {table.map((t, i) => (
            <tr key={i}>
              <td>{t.team}</td>
              <td>{t.wins}</td>
              <td>{t.losses}</td>
              <td>{t.pct}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
