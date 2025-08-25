'use client';

import { useState } from 'react';
import { teams } from '../../data/teams';
import { simulateMatch } from '../../utils/simulation';

export default function MatchPage() {
  const [result, setResult] = useState<any>(null);

  const handleSimulate = () => {
    const matchResult = simulateMatch(teams[0], teams[1]); // Warriors vs Celtics
    setResult(matchResult);
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Partida: {teams[0].name} vs {teams[1].name}</h1>
      <button
        onClick={handleSimulate}
        style={{ margin: '1rem 0', padding: '0.5rem 1rem', fontSize: '1rem' }}
      >
        Simular Partida
      </button>

      {result && (
        <div>
          <h2>Resultado Final</h2>
          <p>{teams[0].name}: {result.score[teams[0].id]}</p>
          <p>{teams[1].name}: {result.score[teams[1].id]}</p>

          <h3>Placar por Período:</h3>
          <ul>
            {result.events.map((e: string, i: number) => (
              <li key={i}>{e}</li>
            ))}
          </ul>

          <h3>Energia Final dos Jogadores:</h3>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <div>
              <h4>{teams[0].name}</h4>
              <ul>
                {teams[0].players.map(p => (
                  <li key={p.id}>{p.name}: {p.energy}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4>{teams[1].name}</h4>
              <ul>
                {teams[1].players.map(p => (
                  <li key={p.id}>{p.name}: {p.energy}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}