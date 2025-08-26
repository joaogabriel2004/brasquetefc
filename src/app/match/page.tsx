'use client';
import { useState } from 'react';
import { teams } from '../../data/teams';
import { simulateMatchAsync, MatchResult, PlayerStats, pauseSimulation, resumeSimulation, substitutePlayer } from '../../utils/simulation';

export default function MatchPage() {
  const [result, setResult] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showSubs, setShowSubs] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);

  const handleSimulate = async () => {
    setLoading(true);
    setResult(null);
    setGameEnded(false);

    await simulateMatchAsync(teams[0], teams[1], (events, score, quarterScores, boxscore, starters, bench) => {
      setResult({ events, score, quarterScores, boxscore, starters, bench });
      
      // Detecta fim de jogo
      if (events[events.length - 1] === '--- Fim do Jogo ---') {
        setGameEnded(true);
        setPaused(false); 
      }
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
    setShowSubs(false);
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

      {!result && (
        <button
          onClick={handleSimulate}
          disabled={loading}
          style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}
        >
          {loading ? 'Simulando...' : 'Simular Partida'}
        </button>
      )}

      {result && (
        <div>
          <div style={{ margin: '1rem 0' }}>
            {!paused && !gameEnded ? (
              <button onClick={handlePause} style={{ marginRight: '1rem' }}>⏸️ Pausar</button>
            ) : gameEnded ? (
              <button disabled style={{ marginRight: '1rem' }}>🏁 Encerrado</button>
            ) : (
              <>
                <button onClick={() => setShowSubs(true)} style={{ marginRight: '1rem' }}>🔄 Substituições</button>
                <button onClick={handleResume}>▶️ Continuar</button>
              </>
            )}
          </div>

          {showSubs && (
            <div style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' }}>
              <h3>Gerenciar Substituições</h3>
              {[teams[0], teams[1]].map(team => (
                <div key={team.id} style={{ marginBottom: '1rem' }}>
                  <h4>{team.name}</h4>
                  <p><b>Titulares</b></p>
                  <ul>
                    {result.starters[team.id].map(p => (
                      <li key={p.name}>
                        {p.name} ({p.position})
                        <select
                          defaultValue=""
                          onChange={e => {
                            if (e.target.value) {
                              handleSubstitute(team.id, p.name, e.target.value);
                              e.target.value = "";
                            }
                          }}
                        >
                          <option value="" disabled>Substituir por...</option>
                          {result.bench[team.id].map(b => (
                            <option key={b.name} value={b.name}>{b.name} ({b.position})</option>
                          ))}
                        </select>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <button onClick={() => setShowSubs(false)}>Fechar</button>
            </div>
          )}

          <h2>Resultado Final</h2>
          <p>{teams[0].name}: {result.score[teams[0].id]}</p>
          <p>{teams[1].name}: {result.score[teams[1].id]}</p>

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
                        <td>{Math.round(s.energy)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
    </div>
  );
}
