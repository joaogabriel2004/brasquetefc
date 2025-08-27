'use client';
import { useState } from 'react';
import { teams } from '../../data/teams';
<<<<<<< Updated upstream
import { simulateMatchAsync, MatchResult, PlayerStats } from '../../utils/simulation';
=======
import { simulateMatchAsync, MatchResult, PlayerStats, pauseSimulation, resumeSimulation, substitutePlayer } from '../../utils/simulation';
import Link from 'next/link';
>>>>>>> Stashed changes

export default function MatchPage() {
  const [result, setResult] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showSubs, setShowSubs] = useState<string | null>(null);
  const [gameEnded, setGameEnded] = useState(false);

  const handleSimulate = async () => {
    setLoading(true);
    setResult(null);
<<<<<<< Updated upstream
    await simulateMatchAsync(teams[0], teams[1], (events, score, quarterScores, boxscore) => {
      setResult({ events, score, quarterScores, boxscore });
=======
    await simulateMatchAsync(teams[0], teams[1], (events, score, quarterScores, boxscore, starters, bench) => {
      setResult({ events, score, quarterScores, boxscore, starters, bench });

      // Detecta fim de jogo
      if (events[events.length - 1] === '--- Fim do Jogo ---') {
        setGameEnded(true);
        setPaused(false); 
      }
>>>>>>> Stashed changes
    });
    setLoading(false);
  };

  const handlePause = () => {
    pauseSimulation();
    setPaused(true);
  };

  const handleResume = () => {
    resumeSimulation();
    setPaused(false);
  };

  const handleSubstitute = (teamId: string, outPlayer: string, inPlayer: string) => {
    if (!result) return;

    const outP = result.starters[teamId].find(p => p.name === outPlayer);
    const inP = result.bench[teamId].find(p => p.name === inPlayer);

    if (!outP || !inP) return;

    substitutePlayer(teamId, outP, inP, result.starters, result.bench);
    setResult({ ...result }); // força atualização visual
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Partida: {teams[0].name} vs {teams[1].name}</h1>

      <button
        onClick={handleSimulate}
        disabled={loading}
        style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}
      >
        {loading ? 'Simulando...' : 'Simular Partida'}
      </button>

<<<<<<< Updated upstream
      {result && (
        <div>
          <h2>Resultado Final</h2>
          <p>{teams[0].name}: {result.score[teams[0].id]}</p>
          <p>{teams[1].name}: {result.score[teams[1].id]}</p>
=======
        {/* Buttons Area */}
        <div className="text-center mb-8">
          {!result && (
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
          )}

          {!paused && !gameEnded ? (
            <button 
              onClick={handlePause} 
              className={`font-bold py-4 px-8 rounded-xl text-xl transition-all duration-200 shadow-lg mr-4 bg-yellow-500 hover:bg-yellow-600 text-white hover:shadow-xl transform hover:scale-105`}
            >
              ⏸️ Pausar
            </button>
          ) : gameEnded ? (
            <button 
              disabled
              className={`font-bold py-4 px-8 rounded-xl text-xl transition-all duration-200 shadow-lg mr-4 bg-gray-400 cursor-not-allowed text-white`}
            >
              🏁 Encerrado
            </button>
          ) : (
            <>
              <button 
                onClick={handleResume}
                className={`font-bold py-4 px-8 rounded-xl text-xl transition-all duration-200 shadow-lg mr-4 bg-green-500 hover:bg-green-600 text-white hover:shadow-xl transform hover:scale-105`}
              >
                ▶️ Continuar
              </button>
            </>
          )}
        </div>
>>>>>>> Stashed changes

          <h3>Placar por Período</h3>
          <ul>
            {result.quarterScores[teams[0].id].map((_, i) => (
              <li key={i}>
                Q{i+1} - {teams[0].name}: {result.quarterScores[teams[0].id][i]} | {teams[1].name}: {result.quarterScores[teams[1].id][i]}
              </li>
            ))}
          </ul>
          <br/>
          <h3>Boxscore</h3>
          {[teams[0], teams[1]].map(team => (
            <div key={team.id} style={{ marginTop: '1rem' }}>
              <h4>{team.name}</h4>
              <table border={1} cellPadding={4} style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr>
                    <th>Jogador</th>
                    <th>PTS</th>
                    <th>FG</th>
                    <th>3PT</th>
                    <th>FT</th>
                    <th>Energy</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(result.boxscore[team.id]).map(([player, stats]) => {
                    const s = stats as PlayerStats;
                    return (
                      <tr key={player}>
                        <td>{player}</td>
                        <td>{s.points}</td>
                        <td>{s.fgm}/{s.fga}</td>
                        <td>{s.tpm}/{s.tpa}</td>
                        <td>{s.ftm}/{s.fta}</td>
                        <td>{s.energy}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
<<<<<<< Updated upstream
          ))}
          <br/>
          <h3>Eventos:</h3>
          <ul>
            {result.events.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}
=======

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
                        {/* Titulares */}
                        {result.starters[team.id].map((player, index) => {
                          const s = result.boxscore[team.id][player.name] as PlayerStats;
                          return (
                            <tr key={player.name} className="bg-white">
                              <td className="border border-gray-200 px-3 py-2 font-medium text-gray-800">
                                <span className="font-bold text-green-600">● </span>
                                <span>{player.name}</span>
                                {/* Botão de substituição */}
                                <button
                                  onClick={() => setShowSubs(prev => prev === player.name ? null : player.name)}
                                  className="ml-2 text-blue-600 hover:text-blue-800 text-sm cursor-pointer"
                                >
                                  ⇆
                                </button>

                                {/* Select que aparece ao clicar */}
                                {showSubs === player.name && (
                                  <select
                                    className="ml-2 border rounded p-1 text-sm"
                                    onChange={(e) => {
                                      handleSubstitute(team.id, player.name, e.target.value);
                                      setShowSubs(null); // fecha o select depois
                                    }}
                                    defaultValue=""
                                  >
                                    <option value="" disabled>Escolher reserva</option>
                                    {result.bench[team.id]
                                      .filter(p => p.position === player.position)
                                      .map(p => (
                                        <option key={p.name} value={p.name}>{p.name} ({p.position})</option>
                                      ))}
                                  </select>
                                )}
                              </td>
                              <td className="border border-gray-200 px-3 py-2 text-center font-bold text-orange-600 ">{s.points}</td>
                              <td className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-800">{s.fgm}/{s.fga}</td>
                              <td className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-800">{s.tpm}/{s.tpa}</td>
                              <td className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-800">{s.ftm}/{s.fta}</td>
                              <td className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-800">{s.energy}</td>
                            </tr>
                          );
                        })}

                        {/* Linha divisória */}
                        <tr>
                          <td colSpan={6} className="border border-gray-200 px-3 py-2 bg-gray-100 text-center font-medium text-gray-800">
                            Reservas
                          </td>
                        </tr>

                        {/* Reservas */}
                        {result.bench[team.id].map((player, index) => {
                          const s = result.boxscore[team.id][player.name] as PlayerStats;
                          return (
                            <tr key={player.name} className="bg-gray-50">
                              <td className="border border-gray-200 px-3 py-2 font-medium text-gray-800">{player.name}</td>
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
>>>>>>> Stashed changes
    </div>
  );
}
