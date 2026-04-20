"use client";

import { useEffect, useState } from "react";
import { getBrasqueteDB } from "@/db/brasqueteDb";
import { advanceDay } from "@/services/season/advanceDay";
import { useRouter } from "next/navigation";

export default function SeasonPage() {
  const router = useRouter();

  const [league, setLeague] = useState<any>(null);
  const [games, setGames] = useState<any[]>([]);
  const [teamId, setTeamId] = useState<string>("");

  // 🔹 Função central pra pegar saveId (evita bug)
  function getSaveId() {
    return localStorage.getItem("currentSaveId");
  }

  // 🔹 Carregar temporada
  async function loadSeason() {
    const saveId = getSaveId();
    if (!saveId) {
      console.error("❌ Sem saveId");
      router.push("/");
      return;
    }

    const db = getBrasqueteDB(saveId);

    const lg = await db.league.get("main");
    if (!lg) {
      console.error("❌ Liga não encontrada");
      return;
    }

    setLeague(lg);
    setTeamId(lg.teamIdSelected);

    const g = await db.games
      .where("round")
      .equals(lg.currentRound)
      .toArray();

    setGames(g);
  }

  useEffect(() => {
    loadSeason();
  }, []);

  // 🔹 Avançar rodada/dia
  async function handleAdvanceDay() {
    const saveId = getSaveId();
    if (!saveId) return;

    await advanceDay(saveId);
    await loadSeason();
  }

  if (!league) {
    return <p style={{ padding: 20 }}>Carregando temporada...</p>;
  }

  // 🔹 Encontrar jogo do jogador
  const myGame = games.find(
    (g) => g.homeTeam === teamId || g.awayTeam === teamId
  );

  return (
    <div style={{ padding: 20 }}>
      <h1>👋 Olá, {league.coachName}</h1>
      <h2>🏀 Temporada {league.season}</h2>
      <h3>
        Rodada {league.currentRound} / {league.totalRounds}
      </h3>

      {/* 🔥 JOGO DO USUÁRIO */}
      <h3 style={{ marginTop: 20 }}>Seu jogo:</h3>

      {myGame ? (
        <button
          style={{
            padding: 12,
            marginBottom: 20,
            background: "orange",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer"
          }}
          onClick={() => {
            console.log("👉 Indo pro jogo:", myGame.id);
            router.push(`/match/${myGame.id}`);
          }}
        >
          🏀 Jogar partida
        </button>
      ) : (
        <p>Nenhum jogo seu nesta rodada.</p>
      )}

      {/* 🔥 LISTA DE JOGOS */}
      <h3>Jogos da rodada:</h3>

      {games.map((g) => (
        <div key={g.id} style={{ marginBottom: 8 }}>
          <p>
            {g.homeTeam} vs {g.awayTeam} —{" "}
            {g.played
              ? `${g.score[g.homeTeam]} x ${g.score[g.awayTeam]}`
              : "A jogar"}
          </p>
        </div>
      ))}

      {/* 🔥 AVANÇAR */}
      <button
        style={{
          marginTop: 30,
          padding: 12,
          background: "#444",
          color: "white",
          borderRadius: 8,
          cursor: "pointer"
        }}
        onClick={handleAdvanceDay}
      >
        ⏭️ Avançar rodada
      </button>
    </div>
  );
}