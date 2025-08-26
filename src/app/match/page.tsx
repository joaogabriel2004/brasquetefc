'use client';
import { useState } from 'react';
import { teams } from '../../data/teams';
import { simulateMatchAsync, MatchResult, PlayerStats } from '../../utils/simulation';
import Link from 'next/link';

export default function MatchPage() {
  const [result, setResult] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async () => {
    setLoading(true);
    setResult(null);
    await simulateMatchAsync(teams[0], teams[1], (events, score, quarterScores, boxscore) => {
      setResult({ events, score, quarterScores, boxscore });
    });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-white to-orange-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4 text-orange-600 hover:text-orange-700 transition-colors">
            ← Voltar ao Menu
          </Link>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🏀 Arena de Partidas
          </h1>
        </div>

        {/* Match Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between text-center">
            <div className="flex-1 mb-4 md:mb-0">
              <h2 className="text-2xl font-bold text-gray-800">{teams[0].name}</h2>
              <p className="text-gray-600">{teams[0].players.length} jogadores</p>
            </div>
            <div className="text-4xl font-bold text-orange-600 mx-8">VS</div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800">{teams[1].name}</h2>
              <p className="text-gray-600">{teams[1].players.length} jogadores</p>
            </div>
          </div>
        </div>

        {/* Simulate Button */}
        <div className="text-center mb-8">
          <button
            onClick={handleSimulate}
            disabled={loading}
            className={`font-bold py-4 px-8 rounded-xl text-xl transition-all duration-200 shadow-lg ${
              loading
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-orange-600 hover:bg-orange-700 text-white hover:shadow-xl transform hover:scale-105'
            }`}
          >
            {loading ? '🔄 Simulando Partida...' : '🏀 Simular Partida'}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-8">
            {/* Final Score */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
                🏆 Resultado Final
              </h2>
              <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-700">{teams[0].name}</h3>
                  <p className="text-4xl font-bold text-orange-600">{result.score[teams[0].id]}</p>
                </div>
                <div className="text-2xl font-bold text-gray-400">-</div>
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-700">{teams[1].name}</h3>
                  <p className="text-4xl font-bold text-blue-600">{result.score[teams[1].id]}</p>
                </div>
              </div>
            </div>

            {/* Quarter Scores */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">📊 Placar por Período</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">Time</th>
                      <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Q1</th>
                      <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Q2</th>
                      <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Q3</th>
                      <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Q4</th>
                      <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700 bg-orange-50">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[teams[0], teams[1]].map((team, index) => (
                      <tr key={team.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}>
                        <td className="border border-gray-200 px-4 py-3 font-semibold text-gray-800">{team.name}</td>
                        {result.quarterScores[team.id].map((score, i) => (
                          <td key={i} className="border border-gray-200 px-4 py-3 text-center font-bold text-gray-800">
                            {score}
                          </td>
                        ))}
                        <td className="border border-gray-200 px-4 py-3 text-center font-bold text-lg bg-orange-50 text-orange-700">
                          {result.score[team.id]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Boxscore */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">📈 Estatísticas dos Jogadores</h3>
              {[teams[0], teams[1]].map(team => (
                <div key={team.id} className="mb-8 last:mb-0">
                  <h4 className="text-xl font-bold text-gray-700 mb-4">{team.name}</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-700">Jogador</th>
                          <th className="border border-gray-200 px-3 py-2 text-center font-semibold text-gray-700">PTS</th>
                          <th className="border border-gray-200 px-3 py-2 text-center font-semibold text-gray-700">FG</th>
                          <th className="border border-gray-200 px-3 py-2 text-center font-semibold text-gray-700">3PT</th>
                          <th className="border border-gray-200 px-3 py-2 text-center font-semibold text-gray-700">FT</th>
                          <th className="border border-gray-200 px-3 py-2 text-center font-semibold text-gray-700">Energia</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(result.boxscore[team.id]).map(([player, stats], index) => {
                          const s = stats as PlayerStats;
                          return (
                            <tr key={player} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}>
                              <td className="border border-gray-200 px-3 py-2 font-medium text-gray-800">{player}</td>
                              <td className="border border-gray-200 px-3 py-2 text-center font-bold text-orange-600">{s.points}</td>
                              <td className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-800">{s.fgm}/{s.fga}</td>
                              <td className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-800">{s.tpm}/{s.tpa}</td>
                              <td className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-800">{s.ftm}/{s.fta}</td>
                              <td className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-800">{s.energy}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>

            {/* Events Log */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">📝 Relato da Partida</h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {result.events.map((event, i) => (
                    <div key={i} className="flex items-start space-x-2">
                      <span className="text-orange-600 font-mono text-sm flex-shrink-0">#{i + 1}</span>
                      <p className="text-gray-700 text-sm">{event}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* New Match Button */}
            <div className="text-center">
              <button
                onClick={handleSimulate}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                🔄 Nova Partida
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
