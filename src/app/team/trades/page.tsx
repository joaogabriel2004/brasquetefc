"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { PlayerDB, TeamDB } from "@/db/brasqueteDb";
import {
  loadTeamManager,
  type TeamManagerData,
  tradePlayers,
} from "@/services/season/teamManager";
import {
  evaluateTrade,
  playerTradeValue,
  type TradeEvaluation,
} from "@/services/season/tradeEvaluation";

const packageLimit = 3;

function formatValue(value: number): string {
  return value.toFixed(1);
}

function getVerdictLabel(verdict: TradeEvaluation["verdict"]): string {
  const labels: Record<TradeEvaluation["verdict"], string> = {
    muito_vantajosa: "Grande vantagem para você",
    vantajosa: "Vantagem para você",
    equilibrada: "Troca equilibrada",
    desvantajosa: "Você cede mais valor",
    muito_desvantajosa: "Grande perda de valor",
  };
  return labels[verdict];
}

function getResultMessage(
  reason: "invalid_proposal" | "ai_rejected" | "salary_cap" | "roster_size",
): string {
  const messages = {
    invalid_proposal:
      "A proposta não é mais válida. Atualize os jogadores selecionados.",
    ai_rejected:
      "O outro time recusou: a diferença de valor está grande demais.",
    salary_cap: "A troca ultrapassa o teto salarial de um dos times.",
    roster_size:
      "A troca deixaria um dos elencos fora do limite de 5 a 15 jogadores.",
  };
  return messages[reason];
}

function PlayerOption({
  player,
  selected,
  disabled,
  onToggle,
}: {
  player: PlayerDB;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 border-b border-orange-100 p-3 transition ${
        selected ? "bg-orange-50 font-medium" : "hover:bg-orange-50/50"
      }`}
    >
      <input
        type="checkbox"
        checked={selected}
        disabled={disabled}
        onChange={onToggle}
        className="h-4 w-4 accent-orange-600"
      />
      <span className="w-8 shrink-0 text-xs font-bold text-orange-600">
        {player.position}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-gray-800">
          {player.name}
        </span>
        <span className="block text-xs text-gray-500">
          {player.age ?? "?"} anos · POT {player.potential ?? "?"} · contrato{" "}
          {player.contractYears ?? 0}a
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block text-sm font-bold text-gray-800">
          {Math.round(playerTradeValue(player))}
        </span>
        <span className="block text-xs text-gray-500">
          {player.salary ?? 0}M
        </span>
      </span>
    </label>
  );
}

export default function TradesPage() {
  const router = useRouter();
  const [data, setData] = useState<TeamManagerData | null>(null);
  const [opponentId, setOpponentId] = useState("");
  const [outgoingIds, setOutgoingIds] = useState<string[]>([]);
  const [incomingIds, setIncomingIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const saveId = localStorage.getItem("currentSaveId");
      if (!saveId) {
        router.push("/");
        return;
      }

      const managerData = await loadTeamManager(saveId);
      if (!managerData) {
        router.push("/");
        return;
      }

      setData(managerData);
      setOpponentId(managerData.tradeTeams[0]?.id ?? "");
    }

    void load();
  }, [router]);

  const opponent: TeamDB | undefined = data?.tradeTeams.find(
    (team) => team.id === opponentId,
  );
  const opponentPlayers =
    data?.tradeOptions.filter((player) => player.teamId === opponentId) ?? [];
  const outgoingPlayers =
    data?.players.filter((player) => outgoingIds.includes(player.id)) ?? [];
  const incomingPlayers = opponentPlayers.filter((player) =>
    incomingIds.includes(player.id),
  );
  const evaluation = useMemo(
    () =>
      outgoingPlayers.length > 0 && incomingPlayers.length > 0
        ? evaluateTrade(outgoingPlayers, incomingPlayers)
        : null,
    [outgoingPlayers, incomingPlayers],
  );

  const opponentPayroll = opponentPlayers.reduce(
    (total, player) => total + (player.salary ?? 0),
    0,
  );
  const userPayrollAfter =
    data && evaluation
      ? data.payroll - evaluation.outgoingSalary + evaluation.incomingSalary
      : (data?.payroll ?? 0);
  const opponentPayrollAfter = evaluation
    ? opponentPayroll - evaluation.incomingSalary + evaluation.outgoingSalary
    : opponentPayroll;
  const userRosterAfter = data
    ? data.players.length - outgoingIds.length + incomingIds.length
    : 0;
  const opponentRosterAfter = opponent
    ? opponentPlayers.length - incomingIds.length + outgoingIds.length
    : 0;
  const salaryFits = Boolean(
    data &&
      opponent &&
      userPayrollAfter <= (data.team.salaryCap ?? 160) &&
      opponentPayrollAfter <= (opponent.salaryCap ?? 160),
  );
  const rosterFits =
    userRosterAfter >= 5 &&
    userRosterAfter <= 15 &&
    opponentRosterAfter >= 5 &&
    opponentRosterAfter <= 15;
  const canSubmit = Boolean(
    evaluation?.aiLikelyAccepts && salaryFits && rosterFits && !saving,
  );

  async function submitTrade() {
    const saveId = localStorage.getItem("currentSaveId");
    if (!saveId || !data || !opponent || !canSubmit) return;

    setSaving(true);
    const result = await tradePlayers(
      saveId,
      data.team.id,
      opponent.id,
      outgoingIds,
      incomingIds,
    );

    if (!result.accepted) {
      setMessage(getResultMessage(result.reason ?? "invalid_proposal"));
      setSaving(false);
      return;
    }

    const refreshedData = await loadTeamManager(saveId);
    if (refreshedData) setData(refreshedData);
    setOutgoingIds([]);
    setIncomingIds([]);
    setMessage("Troca concluída. Os dois elencos foram atualizados.");
    setSaving(false);
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-100 via-white to-orange-50">
        <p className="font-semibold text-orange-600">Carregando mercado...</p>
      </div>
    );
  }

  const totalOfferValue = evaluation
    ? evaluation.outgoingValue + evaluation.incomingValue
    : 0;
  const outgoingBar =
    evaluation && totalOfferValue > 0
      ? (evaluation.outgoingValue / totalOfferValue) * 100
      : 50;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-white to-orange-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-orange-200 bg-white p-6 shadow">
          <div>
            <h1 className="text-3xl font-bold text-orange-600">
              🔄 Central de trocas
            </h1>
            <p className="text-gray-600">
              Diretoria · Monte uma proposta e avalie o impacto nos dois times.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/team")}
            className="rounded bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700 transition"
          >
            Voltar ao elenco
          </button>
        </div>

        {/* SELETOR DE TIME ADVERSÁRIO */}
        <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-orange-200 bg-white p-6 shadow">
          <div>
            <span className="text-xs font-bold uppercase tracking-wide text-orange-600">
              Seu time
            </span>
            <h2 className="text-xl font-bold text-gray-800">{data.team.name}</h2>
            <p className="mt-1 text-sm text-gray-600">
              Folha: <span className="font-semibold">{data.payroll}M</span> / {data.team.salaryCap ?? 160}M
            </p>
          </div>
          <label className="min-w-64 text-sm font-semibold text-gray-700">
            Negociar com
            <select
              value={opponentId}
              onChange={(event) => {
                setOpponentId(event.target.value);
                setIncomingIds([]);
                setMessage("");
              }}
              className="mt-1 block w-full rounded border border-orange-200 bg-white px-3 py-2.5 font-normal text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {data.tradeTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {opponent ? (
          <>
            {/* PAINÉIS DE SELEÇÃO DE JOGADORES */}
            <div className="grid gap-6 lg:grid-cols-2">
              <PlayerSelectionPanel
                title={data.team.name}
                players={data.players}
                selectedIds={outgoingIds}
                setSelectedIds={setOutgoingIds}
                capCount={packageLimit}
              />
              <PlayerSelectionPanel
                title={opponent.name}
                players={opponentPlayers}
                selectedIds={incomingIds}
                setSelectedIds={setIncomingIds}
                capCount={packageLimit}
              />
            </div>

            {/* AVALIAÇÃO DA PROPOSTA */}
            <section className="rounded-xl border border-orange-200 bg-white p-6 shadow">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <span className="mb-1 text-xs font-bold uppercase tracking-wide text-orange-600">
                    Avaliação da proposta
                  </span>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {evaluation
                      ? getVerdictLabel(evaluation.verdict)
                      : "Selecione jogadores dos dois lados"}
                  </h2>
                </div>
                {evaluation && (
                  <span
                    className={`text-lg font-bold ${evaluation.valueDifferencePercent > 12 ? "text-red-600" : evaluation.valueDifferencePercent < -12 ? "text-green-600" : "text-gray-600"}`}
                  >
                    {evaluation.valueDifferencePercent > 0 ? "+" : ""}
                    {evaluation.valueDifferencePercent.toFixed(1)}% para você
                  </span>
                )}
              </div>

              {evaluation && (
                <>
                  <div className="mb-5">
                    <div className="mb-2 flex justify-between text-xs font-semibold text-gray-600">
                      <span>
                        {data.team.name}:{" "}
                        {formatValue(evaluation.outgoingValue)}
                      </span>
                      <span>
                        {opponent.name}: {formatValue(evaluation.incomingValue)}
                      </span>
                    </div>
                    <div className="flex h-3 overflow-hidden rounded-full bg-orange-100">
                      <div
                        className="bg-green-600 transition-all"
                        style={{ width: `${outgoingBar}%` }}
                      />
                      <div
                        className="bg-orange-500 transition-all"
                        style={{ width: `${100 - outgoingBar}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 text-sm sm:grid-cols-3">
                    <Metric
                      label="Sua folha após a troca"
                      value={`${formatValue(userPayrollAfter)} / ${data.team.salaryCap ?? 160}M`}
                    />
                    <Metric
                      label="Folha do adversário"
                      value={`${formatValue(opponentPayrollAfter)} / ${opponent.salaryCap ?? 160}M`}
                    />
                    <Metric
                      label="Elencos após a troca"
                      value={`${userRosterAfter} jog. · ${opponentRosterAfter} jog.`}
                    />
                  </div>

                  <ul className="mt-5 grid gap-2 text-sm text-gray-700 sm:grid-cols-2">
                    {evaluation.reasons.map((reason) => (
                      <li key={reason}>• {reason}</li>
                    ))}
                  </ul>

                  <p
                    className={`mt-5 text-sm font-semibold ${evaluation.aiLikelyAccepts ? "text-green-700" : "text-orange-600"}`}
                  >
                    {evaluation.aiLikelyAccepts
                      ? "✨ A IA provavelmente aceitaria esta proposta."
                      : "⚠️ A IA provavelmente recusaria esta proposta por estar desequilibrada."}
                  </p>
                  {!salaryFits && (
                    <p className="mt-1 text-sm font-semibold text-red-600">
                      ❌ A proposta excede o teto salarial de um dos times.
                    </p>
                  )}
                  {!rosterFits && (
                    <p className="mt-1 text-sm font-semibold text-red-600">
                      ❌ A proposta deixa um elenco fora do limite de 5 a 15 atletas.
                    </p>
                  )}
                </>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-orange-100 pt-5">
                {message && (
                  <output className="text-sm font-semibold text-orange-600">
                    {message}
                  </output>
                )}
                <button
                  type="button"
                  disabled={!canSubmit}
                  onClick={submitTrade}
                  className="ml-auto rounded-xl bg-orange-600 px-8 py-3 text-sm font-bold text-white shadow hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-40 transition"
                >
                  {saving ? "Fechando troca..." : "Enviar proposta"}
                </button>
              </div>
            </section>
          </>
        ) : (
          <p className="py-12 text-center text-gray-500">
            Não há times disponíveis para negociar.
          </p>
        )}
      </div>
    </div>
  );
}

function PlayerSelectionPanel({
  title,
  players,
  selectedIds,
  setSelectedIds,
  capCount,
}: {
  title: string;
  players: PlayerDB[];
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  capCount: number;
}) {
  return (
    <section className="rounded-xl border border-orange-200 bg-white shadow overflow-hidden">
      <header className="flex items-center justify-between border-b border-orange-100 bg-orange-50 px-4 py-3">
        <h2 className="font-bold text-orange-700">{title}</h2>
        <span className="text-xs font-semibold text-orange-600">
          {selectedIds.length}/{capCount} atletas
        </span>
      </header>
      <div className="max-h-[440px] overflow-y-auto">
        {players.map((player) => {
          const selected = selectedIds.includes(player.id);
          const disabled = !selected && selectedIds.length >= capCount;
          return (
            <PlayerOption
              key={player.id}
              player={player}
              selected={selected}
              disabled={disabled}
              onToggle={() => {
                if (selected) {
                  setSelectedIds(selectedIds.filter((id) => id !== player.id));
                } else if (selectedIds.length < capCount) {
                  setSelectedIds([...selectedIds, player.id]);
                }
              }}
            />
          );
        })}
        {players.length === 0 && (
          <p className="p-6 text-center text-sm text-gray-500">
            Nenhum jogador disponível.
          </p>
        )}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-orange-200 bg-orange-50/50 p-3">
      <p className="text-xs font-semibold text-orange-600">{label}</p>
      <p className="mt-1 font-bold text-gray-800">{value}</p>
    </div>
  );
}