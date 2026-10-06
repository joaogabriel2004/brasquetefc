"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  DEFAULT_TACTICS,
  type Player,
  type ShotPriorities,
  type ShotPriority,
  type Tactics,
  type TrainingFocus,
} from "@/data/teams";
import type { TeamDB } from "@/db/brasqueteDb";
import {
  loadTeamManager,
  releasePlayer,
  renewPlayerContract,
  saveTeamManager,
  signFreeAgent,
  tradePlayers,
} from "@/services/season/teamManager";
import { getPlayerAttributes } from "@/utils/simulation/playerRatings";

const positions = ["PG", "SG", "SF", "PF", "C"] as const;

export default function TeamPage() {
  const router = useRouter();
  const [team, setTeam] = useState<TeamDB | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [freeAgents, setFreeAgents] = useState<Player[]>([]);
  const [tradeOptions, setTradeOptions] = useState<Player[]>([]);
  const [payroll, setPayroll] = useState(0);
  const [trainingFocuses, setTrainingFocuses] = useState<
    Record<string, TrainingFocus>
  >({});
  const [starterIds, setStarterIds] = useState<string[]>([]);
  const [tactics, setTactics] = useState<Tactics>(DEFAULT_TACTICS);
  const [shotPriorities, setShotPriorities] = useState<ShotPriorities>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [outgoingPlayerId, setOutgoingPlayerId] = useState("");
  const [incomingPlayerId, setIncomingPlayerId] = useState("");
  const [marketMessage, setMarketMessage] = useState("");

  useEffect(() => {
    async function loadTeam() {
      const saveId = localStorage.getItem("currentSaveId");
      if (!saveId) {
        router.push("/");
        return;
      }

      const data = await loadTeamManager(saveId);
      if (!data) {
        router.push("/");
        return;
      }

      const { team: currentTeam, players: roster } = data;
      setTeam(currentTeam);
      setPlayers(roster);
      setFreeAgents(data.freeAgents);
      setTradeOptions(data.tradeOptions);
      setPayroll(data.payroll);
      setTrainingFocuses(
        Object.fromEntries(
          roster.map((player) => [
            player.id,
            player.trainingFocus ?? "arremesso",
          ]),
        ),
      );
      setStarterIds(
        currentTeam.starterIds?.filter((id) =>
          roster.some((player) => player.id === id),
        ) ?? [],
      );
      setTactics({ ...DEFAULT_TACTICS, ...currentTeam.tactics });
      setShotPriorities(currentTeam.shotPriorities ?? {});
    }

    loadTeam();
  }, [router]);

  const starters = players.filter((player) => starterIds.includes(player.id));

  function toggleStarter(playerId: string) {
    setSaved(false);
    setStarterIds((current) => {
      if (current.includes(playerId))
        return current.filter((id) => id !== playerId);
      if (current.length === 5) return current;
      return [...current, playerId];
    });
  }

  async function saveConfiguration() {
    const saveId = localStorage.getItem("currentSaveId");
    if (!saveId || !team || starterIds.length !== 5) return;

    setSaving(true);
    await saveTeamManager(saveId, team.id, {
      starterIds,
      tactics,
      shotPriorities,
      trainingFocuses,
    });
    setTeam({ ...team, starterIds, tactics, shotPriorities });
    setSaving(false);
    setSaved(true);
  }

  async function handleSignFreeAgent(player: Player) {
    const saveId = localStorage.getItem("currentSaveId");
    if (!saveId || !team) return;

    const signed = await signFreeAgent(saveId, team.id, player.id);
    if (!signed) {
      setMarketMessage("Sem espaço no teto salarial ou elenco cheio.");
      return;
    }

    const signedPlayer = { ...player, teamId: team.id, contractYears: 2 };
    setPlayers([...players, signedPlayer]);
    setFreeAgents(freeAgents.filter((agent) => agent.id !== player.id));
    setTeam({ ...team, playerIds: [...team.playerIds, player.id] });
    setPayroll(payroll + (player.salary ?? 0));
    setMarketMessage(`${player.name} assinou por 2 temporadas.`);
  }

  async function handleReleasePlayer(player: Player) {
    const saveId = localStorage.getItem("currentSaveId");
    if (!saveId || !team) return;

    const released = await releasePlayer(saveId, team.id, player.id);
    if (!released) {
      setMarketMessage("O elenco precisa manter pelo menos cinco jogadores.");
      return;
    }

    setPlayers(players.filter((current) => current.id !== player.id));
    setStarterIds(starterIds.filter((id) => id !== player.id));
    setFreeAgents([
      ...freeAgents,
      { ...player, teamId: "free-agents", contractYears: 0 },
    ]);
    setTeam({
      ...team,
      playerIds: team.playerIds.filter((id) => id !== player.id),
      starterIds: team.starterIds?.filter((id) => id !== player.id),
    });
    setPayroll(Math.max(0, payroll - (player.salary ?? 0)));
    setMarketMessage(`${player.name} foi dispensado e está livre no mercado.`);
  }

  async function handleRenewContract(player: Player) {
    const saveId = localStorage.getItem("currentSaveId");
    if (!saveId || !team) return;

    const renewal = await renewPlayerContract(saveId, team.id, player.id);
    if (!renewal.renewed || renewal.salary === undefined) {
      setMarketMessage(
        "Não há espaço no teto salarial para renovar este contrato.",
      );
      return;
    }

    setPlayers(
      players.map((current) =>
        current.id === player.id
          ? { ...current, contractYears: 2, salary: renewal.salary }
          : current,
      ),
    );
    setPayroll(payroll - (player.salary ?? 0) + renewal.salary);
    setMarketMessage(`${player.name} renovou por 2 temporadas.`);
  }

  async function handleTrade() {
    const saveId = localStorage.getItem("currentSaveId");
    if (!saveId || !team || !outgoingPlayerId || !incomingPlayerId) return;

    const outgoing = players.find((player) => player.id === outgoingPlayerId);
    const incoming = tradeOptions.find(
      (player) => player.id === incomingPlayerId,
    );
    if (!outgoing || !incoming) return;

    const completed = await tradePlayers(
      saveId,
      team.id,
      outgoing.id,
      incoming.id,
    );
    if (!completed) {
      setMarketMessage("A troca excede o teto salarial de um dos times.");
      return;
    }

    setPlayers([
      ...players.filter((player) => player.id !== outgoing.id),
      { ...incoming, teamId: team.id },
    ]);
    setTradeOptions([
      ...tradeOptions.filter((player) => player.id !== incoming.id),
      { ...outgoing, teamId: incoming.teamId },
    ]);
    setStarterIds(
      starterIds.map((id) => (id === outgoing.id ? incoming.id : id)),
    );
    setTeam({
      ...team,
      playerIds: team.playerIds
        .filter((id) => id !== outgoing.id)
        .concat(incoming.id),
      starterIds: team.starterIds?.map((id) =>
        id === outgoing.id ? incoming.id : id,
      ),
    });
    setPayroll(payroll - (outgoing.salary ?? 0) + (incoming.salary ?? 0));
    setMarketMessage(`Troca concluída: ${outgoing.name} por ${incoming.name}.`);
    setOutgoingPlayerId("");
    setIncomingPlayerId("");
  }

  if (!team)
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-white to-orange-50 flex items-center justify-center">
        <p className="text-orange-600 font-semibold">Carregando elenco...</p>
      </div>
    );

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-100 via-white to-orange-50 p-6 text-gray-800">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* HEADER */}
        <header className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-orange-200 bg-white p-6 shadow">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-orange-600">
              Sala do técnico
            </p>
            <h1 className="text-3xl font-bold text-orange-600 md:text-4xl">{team.name}</h1>
            <p className="mt-1 text-sm text-gray-600">
              Defina os cinco titulares e o plano de jogo para as próximas partidas.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/season")}
            className="rounded bg-orange-600 px-4 py-2 font-semibold text-white shadow hover:bg-orange-700"
          >
            Voltar à temporada
          </button>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <section className="rounded-xl border border-orange-200 bg-white p-6 shadow space-y-6">
            <div>
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-xl font-bold text-orange-600">Escalação titular</h2>
                <span
                  className={`text-sm font-semibold ${
                    starterIds.length === 5 ? "text-green-700" : "text-orange-600"
                  }`}
                >
                  {starterIds.length} / 5 selecionados
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {positions.map((position) => {
                  const player = starters.find(
                    (starter) => starter.position === position,
                  );
                  return (
                    <div
                      key={position}
                      className="min-h-24 rounded border border-orange-200 bg-orange-50/50 p-3"
                    >
                      <p className="text-xs font-bold uppercase text-orange-600">
                        {position}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-gray-800">
                        {player?.name ?? "Livre"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-orange-600">Elenco completo</h3>
              <div className="divide-y divide-orange-100 rounded border border-orange-200 bg-white">
                {players.map((player) => {
                  const selected = starterIds.includes(player.id);
                  const attributes = getPlayerAttributes(player);
                  return (
                    <div
                      key={player.id}
                      className="flex flex-col gap-3 p-4 hover:bg-orange-50/40"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selected}
                            disabled={!selected && starterIds.length === 5}
                            onChange={() => toggleStarter(player.id)}
                            className="h-4 w-4 accent-orange-600"
                          />
                          <span className="w-9 text-sm font-bold text-orange-600">
                            {player.position}
                          </span>
                          <span className="min-w-0 truncate font-semibold">
                            {player.name}
                          </span>
                          <span className="hidden text-xs text-gray-500 sm:inline">
                            ATA {player.attack} · DEF {player.defense} ·{" "}
                            {player.age ?? "?"} anos · POT {player.potential ?? "?"}
                          </span>
                        </label>

                        <div className="flex items-center gap-2">
                          <select
                            aria-label={`Prioridade de arremesso para ${player.name}`}
                            value={shotPriorities[player.id] ?? "normal"}
                            onChange={(event) => {
                              setSaved(false);
                              setShotPriorities({
                                ...shotPriorities,
                                [player.id]: event.target.value as ShotPriority,
                              });
                            }}
                            className="rounded border border-orange-200 bg-white px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
                          >
                            <option value="less">Arremessa menos</option>
                            <option value="normal">Normal</option>
                            <option value="more">Arremessa mais</option>
                          </select>

                          <select
                            aria-label={`Treino de ${player.name}`}
                            value={trainingFocuses[player.id] ?? "arremesso"}
                            onChange={(event) => {
                              setSaved(false);
                              setTrainingFocuses({
                                ...trainingFocuses,
                                [player.id]: event.target.value as TrainingFocus,
                              });
                            }}
                            className="rounded border border-orange-200 bg-white px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
                          >
                            <option value="arremesso">Treino: arremesso</option>
                            <option value="criacao">Treino: criação</option>
                            <option value="defesa">Treino: defesa</option>
                            <option value="rebote">Treino: rebote</option>
                            <option value="condicionamento">Treino: físico</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between text-xs text-gray-600">
                        <span>
                          Salário <strong className="text-gray-800">{player.salary ?? 0}M</strong> · Contrato{" "}
                          <strong className="text-gray-800">{player.contractYears ?? 0} anos</strong>
                        </span>
                        <div className="flex gap-3">
                          {(player.contractYears ?? 0) <= 2 && (
                            <button
                              type="button"
                              onClick={() => handleRenewContract(player)}
                              className="font-semibold text-green-700 hover:underline"
                            >
                              Renovar
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleReleasePlayer(player)}
                            className="font-semibold text-orange-600 hover:underline"
                          >
                            Dispensar
                          </button>
                        </div>
                      </div>

                      <details className="w-full text-xs text-gray-500 pt-1 border-t border-orange-100">
                        <summary className="cursor-pointer font-semibold text-orange-600">
                          Ver atributos
                        </summary>
                        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3 text-gray-700">
                          <span>Finalização: {attributes.insideScoring}</span>
                          <span>Meia distância: {attributes.midRangeShooting}</span>
                          <span>3 pontos: {attributes.threePointShooting}</span>
                          <span>Lance livre: {attributes.freeThrowShooting}</span>
                          <span>Criação: {attributes.playmaking}</span>
                          <span>Rebote: {attributes.rebounding}</span>
                          <span>Defesa perímetro: {attributes.perimeterDefense}</span>
                          <span>Defesa interior: {attributes.interiorDefense}</span>
                          <span>Roubos: {attributes.steals}</span>
                          <span>Tocos: {attributes.blocks}</span>
                          <span>Resistência: {attributes.stamina}</span>
                        </div>
                      </details>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-xl border border-orange-200 bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-bold text-orange-600">Plano de jogo</h2>
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700">
                  Ritmo
                  <select
                    value={tactics.ritmo}
                    onChange={(event) => {
                      setSaved(false);
                      setTactics({
                        ...tactics,
                        ritmo: event.target.value as Tactics["ritmo"],
                      });
                    }}
                    className="mt-1 w-full rounded border border-orange-200 bg-white px-3 py-2.5 text-sm font-normal text-gray-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="lento">Controlado</option>
                    <option value="medio">Equilibrado</option>
                    <option value="rapido">Acelerado</option>
                  </select>
                </label>

                <label className="block text-sm font-semibold text-gray-700">
                  Foco ofensivo
                  <select
                    value={tactics.foco}
                    onChange={(event) => {
                      setSaved(false);
                      setTactics({
                        ...tactics,
                        foco: event.target.value as Tactics["foco"],
                      });
                    }}
                    className="mt-1 w-full rounded border border-orange-200 bg-white px-3 py-2.5 text-sm font-normal text-gray-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="garrafao">Garrafão</option>
                    <option value="perimetro">Perímetro</option>
                  </select>
                </label>

                <label className="block text-sm font-semibold text-gray-700">
                  Defesa
                  <select
                    value={tactics.defesa}
                    onChange={(event) => {
                      setSaved(false);
                      setTactics({
                        ...tactics,
                        defesa: event.target.value as Tactics["defesa"],
                      });
                    }}
                    className="mt-1 w-full rounded border border-orange-200 bg-white px-3 py-2.5 text-sm font-normal text-gray-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="homem">Individual</option>
                    <option value="zona">Por zona</option>
                    <option value="mista">Mista</option>
                  </select>
                </label>
              </div>

              <button
                type="button"
                onClick={saveConfiguration}
                disabled={saving || starterIds.length !== 5}
                className="mt-6 w-full rounded bg-orange-600 px-5 py-3 font-bold text-white shadow hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {saving
                  ? "Salvando..."
                  : saved
                  ? "Configuração salva"
                  : "Salvar escalação e táticas"}
              </button>
              {starterIds.length !== 5 && (
                <p className="mt-2 text-xs text-orange-600 font-semibold">
                  Escolha exatamente cinco titulares para salvar.
                </p>
              )}
            </div>
          </aside>
        </div>

        <section className="rounded-xl border border-orange-200 bg-white p-6 shadow space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-orange-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-orange-600">Mercado e contratos</h2>
              <p className="mt-1 text-sm text-gray-600">
                Folha <strong className="text-gray-800">{payroll}M</strong> de <strong className="text-gray-800">{team.salaryCap ?? 160}M</strong> · Espaço salarial{" "}
                <strong className="text-gray-800">{Math.max(0, (team.salaryCap ?? 160) - payroll)}M</strong> · Elenco{" "}
                <strong className="text-gray-800">{players.length}/15</strong>
              </p>
            </div>
            {marketMessage && (
              <output className="text-sm font-semibold text-green-700 bg-green-50 px-3 py-1 rounded border border-green-200">
                {marketMessage}
              </output>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <h3 className="font-bold text-orange-600">Agentes livres</h3>
              <div className="divide-y divide-orange-100 rounded border border-orange-200 bg-white max-h-80 overflow-y-auto p-2">
                {freeAgents.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between gap-3 py-2.5 px-2 hover:bg-orange-50/40 rounded"
                  >
                    <div>
                      <p className="font-semibold text-sm text-gray-800">
                        <span className="text-orange-600">{player.position}</span> · {player.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {player.age ?? "?"} anos · POT {player.potential ?? "?"} · {player.salary ?? 0}M
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={
                        players.length >= 15 ||
                        payroll + (player.salary ?? 0) > (team.salaryCap ?? 160)
                      }
                      onClick={() => handleSignFreeAgent(player)}
                      className="rounded border border-green-600 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Assinar
                    </button>
                  </div>
                ))}
                {freeAgents.length === 0 && (
                  <p className="py-3 text-center text-sm text-gray-500">
                    Sem agentes livres disponíveis.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-orange-600">Troca direta</h3>
              <div className="rounded border border-orange-200 bg-orange-50/30 p-4 space-y-3">
                <select
                  value={outgoingPlayerId}
                  onChange={(event) => setOutgoingPlayerId(event.target.value)}
                  className="w-full rounded border border-orange-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  <option value="">Seu jogador</option>
                  {players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name} · {player.salary ?? 0}M
                    </option>
                  ))}
                </select>

                <select
                  value={incomingPlayerId}
                  onChange={(event) => setIncomingPlayerId(event.target.value)}
                  className="w-full rounded border border-orange-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  <option value="">Jogador de outro time</option>
                  {tradeOptions.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name} · {player.salary ?? 0}M
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  disabled={!outgoingPlayerId || !incomingPlayerId}
                  className="w-full rounded bg-orange-600 px-4 py-2 font-semibold text-white shadow hover:bg-orange-700 disabled:opacity-40"
                  onClick={handleTrade}
                >
                  Confirmar troca
                </button>

                <p className="text-xs text-gray-500">
                  A troca só é aceita se os dois times permanecerem dentro do teto salarial.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}