'use client';

import Link from 'next/link';
import { teams } from '../data/teams';
import { useState } from 'react';

export default function HomePage() {
  const [team] = useState(teams[0]); // Seleciona o primeiro time como padrão

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>🏀 Brasquete</h1>
      <p>Bem-vindo ao Brasquete! Assuma o comando do seu time e simule partidas.</p>

      <h2>Seu time: {team.name}</h2>
      <ul>
        {team.players.map((player) => (
          <li key={player.id}>
            {player.name} - {player.position} - Ataque: {player.attack} | Defesa: {player.defense} | Energia: {player.energy}
          </li>
        ))}
      </ul>

      <Link href="/match">
        <button style={{ marginTop: '1rem', padding: '0.5rem 1rem', fontSize: '1rem' }}>
          Iniciar Partida
        </button>
      </Link>
    </div>
  );
}
