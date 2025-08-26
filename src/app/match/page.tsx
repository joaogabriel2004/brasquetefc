'use client';
import { useState } from 'react';
import { teams } from '../../data/teams';
import { simulateMatchAsync, MatchResult, PlayerStats } from '../../utils/simulation';

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
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Partida: {teams[0].name} vs {teams[1].name}</h1>

      <button
        onClick={handleSimulate}
        disabled={loading}
        style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}
      >
        {loading ? 'Simulando...' : 'Simular Partida'}
      </button>

      {result && (
        <div>
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
                        <td>{s.energy}</td>
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
