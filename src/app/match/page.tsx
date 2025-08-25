'use client';
import { useState } from 'react';
import { teams } from '../../data/teams';
import { simulateMatchAsync, MatchResult } from '../../utils/simulation';

export default function MatchPage() {
  const [result, setResult] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async () => {
    setLoading(true);
    setResult(null);
    await simulateMatchAsync(teams[0], teams[1], (events, score) => {
      setResult({ events, score });
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

          <h3>Placar por Período:</h3>
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
