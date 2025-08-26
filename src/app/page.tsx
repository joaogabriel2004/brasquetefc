'use client';

import Link from 'next/link';
import { teams } from '../data/teams';
import { useState } from 'react';

export default function HomePage() {
  const [selectedTeamIndex, setSelectedTeamIndex] = useState(0);
  const [starters, setStarters] = useState<string[]>([]);
  const [showStarterSelection, setShowStarterSelection] = useState(false);
  const selectedTeam = teams[selectedTeamIndex];

  // Função para obter jogadores por posição
  const getPlayersByPosition = (position: string) => {
    return selectedTeam.players.filter(player => player.position === position);
  };

  // Função para verificar se todos os titulares foram selecionados
  const isStarterLineupComplete = () => {
    const positions = ['PG', 'SG', 'SF', 'PF', 'C'];
    return positions.every(pos => 
      starters.some(starterId => 
        selectedTeam.players.find(p => p.id === starterId)?.position === pos
      )
    );
  };

  // Função para selecionar/deselecionar titular
  const toggleStarter = (playerId: string) => {
    const player = selectedTeam.players.find(p => p.id === playerId);
    if (!player) return;

    const currentStartersInPosition = starters.filter(starterId => {
      const starterPlayer = selectedTeam.players.find(p => p.id === starterId);
      return starterPlayer?.position === player.position;
    });

    if (starters.includes(playerId)) {
      // Remover dos titulares
      setStarters(starters.filter(id => id !== playerId));
    } else if (currentStartersInPosition.length === 0) {
      // Adicionar aos titulares (apenas se não há titular nesta posição)
      setStarters([...starters, playerId]);
    }
  };

  // Função para resetar titulares automaticamente
  const autoSelectStarters = () => {
    const positions = ['PG', 'SG', 'SF', 'PF', 'C'];
    const autoStarters = positions.map(pos => {
      const playersInPosition = getPlayersByPosition(pos);
      // Selecionar o jogador com maior ataque + defesa
      return playersInPosition.sort((a, b) => 
        (b.attack + b.defense) - (a.attack + a.defense)
      )[0]?.id;
    }).filter(Boolean);
    
    setStarters(autoStarters);
  };

  // Resetar titulares quando mudar de time
  const handleTeamChange = (index: number) => {
    setSelectedTeamIndex(index);
    setStarters([]);
    setShowStarterSelection(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-white to-orange-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-orange-600 mb-4">
            🏀 Brasquete
          </h1>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            Bem-vindo ao Brasquete! Assuma o comando do seu time favorito e monte sua escalação inicial.
          </p>
        </div>

        {/* Team Selection */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Escolha seu Time
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {teams.map((team, index) => (
              <div
                key={team.id}
                onClick={() => handleTeamChange(index)}
                className={`cursor-pointer p-6 rounded-lg border-2 transition-all duration-200 ${
                  selectedTeamIndex === index
                    ? 'border-orange-500 bg-orange-50 shadow-md'
                    : 'border-gray-200 bg-gray-50 hover:border-orange-300 hover:bg-orange-25'
                }`}
              >
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {team.name}
                </h3>
                <p className="text-gray-600">
                  {team.players.length} jogadores
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {team.players.slice(0, 3).map((player) => (
                    <span
                      key={player.id}
                      className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded"
                    >
                      {player.name}
                    </span>
                  ))}
                  {team.players.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{team.players.length - 3} mais
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Starter Selection */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">
              Monte seu Quinteto Inicial
            </h2>
            <div className="flex gap-3">
              <button
                onClick={() => setShowStarterSelection(!showStarterSelection)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  showStarterSelection
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {showStarterSelection ? '👁️ Ocultar Seleção' : '⚙️ Escolher Titulares'}
              </button>
              <button
                onClick={autoSelectStarters}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                🤖 Auto Selecionar
              </button>
            </div>
          </div>

          {showStarterSelection && (
            <div className="mb-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Selecione 1 jogador por posição:
              </h3>
              
              <div className="grid gap-6">
                {['PG', 'SG', 'SF', 'PF', 'C'].map(position => {
                  const positionNames = {
                    'PG': 'Armador',
                    'SG': 'Ala-Armador', 
                    'SF': 'Ala',
                    'PF': 'Ala-Pivô',
                    'C': 'Pivô'
                  };
                  
                  return (
                    <div key={position} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="text-md font-bold text-gray-700 mb-3">
                        {position} - {positionNames[position as keyof typeof positionNames]}
                      </h4>
                      <div className="grid gap-2">
                        {getPlayersByPosition(position).map(player => {
                          const isStarter = starters.includes(player.id);
                          return (
                            <div
                              key={player.id}
                              onClick={() => toggleStarter(player.id)}
                              className={`cursor-pointer p-3 rounded border-2 transition-all ${
                                isStarter
                                  ? 'border-green-500 bg-green-50'
                                  : 'border-gray-200 bg-white hover:border-orange-300'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <span className="font-medium text-gray-800">{player.name}</span>
                                  {isStarter && (
                                    <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                      ⭐ TITULAR
                                    </span>
                                  )}
                                </div>
                                <div className="flex gap-3 text-sm">
                                  <span className="text-red-600 font-medium">ATK: {player.attack}</span>
                                  <span className="text-blue-600 font-medium">DEF: {player.defense}</span>
                                  <span className="text-green-600 font-medium">ENE: {player.energy}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Current Starters Display */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Quinteto Atual ({starters.length}/5)
            </h3>
            
            {starters.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-lg">Nenhum titular selecionado</p>
                <p className="text-sm">Use "Auto Selecionar" ou "Escolher Titulares" para montar sua escalação</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {starters.map(starterId => {
                  const player = selectedTeam.players.find(p => p.id === starterId);
                  if (!player) return null;
                  
                  return (
                    <div
                      key={player.id}
                      className="bg-green-50 rounded-lg p-4 border border-green-200"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="mb-2 md:mb-0">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {player.name}
                          </h3>
                          <span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                            {player.position}
                          </span>
                        </div>
                        
                        <div className="flex gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-semibold text-red-600">{player.attack}</div>
                            <div className="text-gray-500">Ataque</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-blue-600">{player.defense}</div>
                            <div className="text-gray-500">Defesa</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-green-600">{player.energy}</div>
                            <div className="text-gray-500">Energia</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!isStarterLineupComplete() && starters.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  ⚠️ Escalação incompleta! Você precisa selecionar um jogador para cada posição.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Start Match Button */}
        <div className="text-center">
          <Link href="/match">
            <button 
              className={`font-bold py-4 px-8 rounded-xl text-xl transition-all duration-200 shadow-lg ${
                isStarterLineupComplete() || starters.length === 0
                  ? 'bg-orange-600 hover:bg-orange-700 text-white hover:shadow-xl transform hover:scale-105'
                  : 'bg-gray-400 text-gray-600 cursor-not-allowed'
              }`}
              disabled={starters.length > 0 && !isStarterLineupComplete()}
            >
              🏀 Iniciar Partida
            </button>
          </Link>
          {starters.length > 0 && !isStarterLineupComplete() && (
            <p className="mt-2 text-sm text-gray-600">
              Complete sua escalação para iniciar a partida
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
