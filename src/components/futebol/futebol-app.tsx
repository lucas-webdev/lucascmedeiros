"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import {
  FutebolApiError,
  getPlayers,
  getRanking,
  submitMatch,
} from "@/lib/futebol-api";
import {
  carregarDraft,
  criarDraftVazio,
  hojeISO,
  limparDraft,
  salvarDraft,
} from "@/lib/futebol-storage";
import { sortearTimes } from "@/lib/futebol-teams";
import type { Jogador, JogadorPresente, PeladaDraft } from "@/lib/futebol-types";
import { PinGate } from "./pin-gate";
import { PlayerRoster } from "./player-roster";
import { AttendanceList } from "./attendance-list";
import { PresentPlayers } from "./present-players";
import { TeamDraw } from "./team-draw";
import { Scoreboard } from "./scoreboard";
import { RankingTable } from "./ranking-table";

function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-md border border-border p-2 text-muted transition-colors hover:bg-accent-muted hover:text-accent"
      aria-label={theme === "light" ? "Ativar modo escuro" : "Ativar modo claro"}
    >
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  );
}

interface FutebolContentProps {
  pin: string;
  onAuthError: () => void;
}

function FutebolContent({ pin, onAuthError }: FutebolContentProps) {
  const [pronto, setPronto] = useState(false);
  const [draft, setDraft] = useState<PeladaDraft | null>(null);

  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [ranking, setRanking] = useState<Jogador[]>([]);
  const [carregandoJogadores, setCarregandoJogadores] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);

  const [enviandoResultado, setEnviandoResultado] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [sucessoEnvio, setSucessoEnvio] = useState(false);

  useEffect(() => {
    document.documentElement.lang = "pt";
    const data = hojeISO();
    setDraft(carregarDraft(data) ?? criarDraftVazio(data));
    setPronto(true);
  }, []);

  useEffect(() => {
    if (pronto && draft) {
      salvarDraft(draft);
    }
  }, [draft, pronto]);

  const recarregarJogadores = useCallback(async () => {
    try {
      const [jogadoresResp, rankingResp] = await Promise.all([
        getPlayers(),
        getRanking(),
      ]);
      setJogadores(jogadoresResp);
      setRanking(rankingResp);
      setErroCarregamento(null);
    } catch (e) {
      setErroCarregamento(
        e instanceof Error ? e.message : "Erro ao carregar dados."
      );
    }
  }, []);

  useEffect(() => {
    setCarregandoJogadores(true);
    recarregarJogadores().finally(() => setCarregandoJogadores(false));
  }, [recarregarJogadores]);

  const jogadoresPresentes: JogadorPresente[] = useMemo(() => {
    if (!draft) return [];
    const timeDoJogador = new Map<number, number>();
    Object.entries(draft.times).forEach(([time, ids]) => {
      ids.forEach((id) => timeDoJogador.set(id, Number(time)));
    });
    return draft.presentesIds
      .map((id) => jogadores.find((j) => j.id === id))
      .filter((j): j is Jogador => Boolean(j))
      .map((j) => ({
        id: j.id,
        nome: j.nome,
        mensalista: j.mensalista,
        timeNumero: timeDoJogador.get(j.id) ?? null,
        gols: draft.estatisticas[j.id]?.gols ?? 0,
        assistencias: draft.estatisticas[j.id]?.assistencias ?? 0,
      }));
  }, [draft, jogadores]);

  const jogadoresPorId = useMemo(
    () => new Map(jogadoresPresentes.map((j) => [j.id, j])),
    [jogadoresPresentes]
  );

  if (!pronto || !draft) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted">
        Carregando...
      </div>
    );
  }

  const handleChangeData = (novaData: string) => {
    if (!novaData) return;
    setDraft(carregarDraft(novaData) ?? criarDraftVazio(novaData));
    setSucessoEnvio(false);
    setErroEnvio(null);
  };

  const toggleAttendance = (id: number) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const presente = prev.presentesIds.includes(id);
      const presentesIds = presente
        ? prev.presentesIds.filter((pid) => pid !== id)
        : [...prev.presentesIds, id];

      const times = { ...prev.times };
      if (presente) {
        for (const time of Object.keys(times)) {
          times[Number(time)] = times[Number(time)].filter(
            (pid) => pid !== id
          );
        }
      }

      return { ...prev, presentesIds, times };
    });
  };

  const handleChangeNumTimes = (n: number) => {
    setDraft((prev) =>
      prev
        ? { ...prev, numTimes: n, times: {}, placar: n === 2 ? prev.placar : null }
        : prev
    );
  };

  const handleSortear = () => {
    setDraft((prev) => {
      if (!prev) return prev;
      const times = sortearTimes(prev.presentesIds, prev.numTimes);
      return {
        ...prev,
        times,
        placar: prev.numTimes === 2 ? prev.placar ?? [0, 0] : null,
      };
    });
  };

  const handleChangeStat = (
    id: number,
    campo: "gols" | "assistencias",
    valor: number
  ) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const atual = prev.estatisticas[id] ?? { gols: 0, assistencias: 0 };
      return {
        ...prev,
        estatisticas: {
          ...prev.estatisticas,
          [id]: { ...atual, [campo]: valor },
        },
      };
    });
  };

  const handleChangePlacar = (placar: [number, number]) => {
    setDraft((prev) => (prev ? { ...prev, placar } : prev));
  };

  const handleFinalizarPelada = async () => {
    if (draft.presentesIds.length === 0) return;
    if (Object.keys(draft.times).length === 0) return;
    if (
      !window.confirm(
        "Confirma o envio dos resultados desta pelada? Essa ação não pode ser desfeita."
      )
    ) {
      return;
    }

    setErroEnvio(null);
    setEnviandoResultado(true);
    try {
      const payload = jogadoresPresentes
        .filter((j) => j.timeNumero !== null)
        .map((j) => ({
          id: j.id,
          timeNumero: j.timeNumero as number,
          gols: j.gols,
          assistencias: j.assistencias,
        }));

      if (payload.length === 0) {
        throw new Error("Sorteie os times antes de finalizar a pelada.");
      }

      const placarFinal: [number, number] | null =
        draft.numTimes === 2 ? draft.placar ?? [0, 0] : null;

      await submitMatch(pin, draft.data, draft.numTimes, placarFinal, payload);

      limparDraft(draft.data);
      setDraft(criarDraftVazio(draft.data));
      setSucessoEnvio(true);
      await recarregarJogadores();
    } catch (e) {
      if (e instanceof FutebolApiError && e.status === 401) {
        onAuthError();
      } else {
        setErroEnvio(e instanceof Error ? e.message : "Erro ao enviar resultado.");
      }
    } finally {
      setEnviandoResultado(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Futebol Onda BH</h1>
          <Link href="/" className="text-xs text-muted hover:text-accent hover:underline">
            ← Voltar ao site
          </Link>
        </div>
        <ThemeToggleButton />
      </header>

      {erroCarregamento && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {erroCarregamento}{" "}
          <button
            type="button"
            onClick={recarregarJogadores}
            className="underline"
          >
            Tentar novamente
          </button>
        </p>
      )}

      <div className="mt-6">
        <label htmlFor="data-pelada" className="block text-sm font-medium">
          Data da pelada
        </label>
        <input
          id="data-pelada"
          type="date"
          value={draft.data}
          onChange={(e) => handleChangeData(e.target.value)}
          className="mt-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="mt-6">
        <PlayerRoster
          jogadores={jogadores}
          pin={pin}
          onChanged={recarregarJogadores}
          onAuthError={onAuthError}
        />
      </div>

      {carregandoJogadores ? (
        <p className="mt-6 text-sm text-muted">Carregando jogadores...</p>
      ) : (
        <div className="mt-6">
          <AttendanceList
            jogadores={jogadores}
            presentesIds={draft.presentesIds}
            onToggle={toggleAttendance}
          />
        </div>
      )}

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold">
          Presentes ({jogadoresPresentes.length})
        </h2>
        <PresentPlayers
          jogadores={jogadoresPresentes}
          onChangeStat={handleChangeStat}
        />
      </section>

      <section className="mt-6">
        <TeamDraw
          presentesCount={draft.presentesIds.length}
          numTimes={draft.numTimes}
          onChangeNumTimes={handleChangeNumTimes}
          onSortear={handleSortear}
          times={draft.times}
          jogadoresPorId={jogadoresPorId}
        />
      </section>

      {draft.numTimes === 2 && Object.keys(draft.times).length > 0 && (
        <section className="mt-6">
          <Scoreboard
            placar={draft.placar ?? [0, 0]}
            onChange={handleChangePlacar}
          />
        </section>
      )}

      <section className="mt-6 flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-4">
        {erroEnvio && (
          <p role="alert" className="text-sm text-red-600">
            {erroEnvio}
          </p>
        )}
        {sucessoEnvio && (
          <p role="status" className="text-sm text-emerald-600">
            Pelada registrada com sucesso!{" "}
            <button
              type="button"
              onClick={() => setSucessoEnvio(false)}
              className="underline"
            >
              Ok
            </button>
          </p>
        )}
        <button
          type="button"
          onClick={handleFinalizarPelada}
          disabled={
            enviandoResultado ||
            draft.presentesIds.length === 0 ||
            Object.keys(draft.times).length === 0
          }
          className="w-full max-w-xs rounded-md bg-accent px-6 py-3 text-base font-semibold text-accent-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {enviandoResultado ? "Enviando..." : "Finalizar pelada"}
        </button>
      </section>

      <section className="mt-8">
        <h2 className="mb-2 text-lg font-semibold">Tabela individual</h2>
        <RankingTable jogadores={ranking} />
      </section>
    </div>
  );
}

export function FutebolApp() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground">
        <PinGate>
          {(pin, onAuthError) => (
            <FutebolContent pin={pin} onAuthError={onAuthError} />
          )}
        </PinGate>
      </div>
    </ThemeProvider>
  );
}
