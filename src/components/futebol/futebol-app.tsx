"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FutebolApiError,
  getPlayers,
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
import { RankingSection } from "./ranking-section";
import {
  ResumoPeladaModal,
  calcularResumoPelada,
  type ResumoPeladaData,
} from "./resumo-pelada-modal";

function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-semibold tracking-tight ${className}`}>
      igreja<span className="font-black">onda</span>
    </span>
  );
}

interface FutebolContentProps {
  pin: string;
  onAuthError: () => void;
  onDadosAtualizados: () => void;
}

function FutebolContent({
  pin,
  onAuthError,
  onDadosAtualizados,
}: FutebolContentProps) {
  const [pronto, setPronto] = useState(false);
  const [draft, setDraft] = useState<PeladaDraft | null>(null);

  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [carregandoJogadores, setCarregandoJogadores] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);

  const [enviandoResultado, setEnviandoResultado] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [resumo, setResumo] = useState<ResumoPeladaData | null>(null);

  useEffect(() => {
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
      const jogadoresResp = await getPlayers();
      setJogadores(jogadoresResp);
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

  // Base do placar = soma dos gols marcados na lista de presentes, por
  // time. O placar exibido soma essa base a um ajuste manual (gol contra,
  // por exemplo) — assim, editar o placar não se perde quando um gol
  // normal é marcado depois: ele soma em cima do valor do momento.
  const placarBase: [number, number] = useMemo(() => {
    let time1 = 0;
    let time2 = 0;
    for (const jogador of jogadoresPresentes) {
      if (jogador.timeNumero === 1) time1 += jogador.gols;
      else if (jogador.timeNumero === 2) time2 += jogador.gols;
    }
    return [time1, time2];
  }, [jogadoresPresentes]);

  const placarAjuste: [number, number] = draft?.placarAjuste ?? [0, 0];
  const placarExibido: [number, number] = [
    placarBase[0] + placarAjuste[0],
    placarBase[1] + placarAjuste[1],
  ];

  if (!pronto || !draft) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-sm text-white/60">
        Carregando...
      </div>
    );
  }

  const handleChangeData = (novaData: string) => {
    if (!novaData) return;
    setDraft(carregarDraft(novaData) ?? criarDraftVazio(novaData));
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
      prev ? { ...prev, numTimes: n, times: {}, placarAjuste: [0, 0] } : prev
    );
  };

  const handleSortear = () => {
    setDraft((prev) => {
      if (!prev) return prev;
      const presentes = prev.presentesIds
        .map((id) => jogadores.find((j) => j.id === id))
        .filter((j): j is Jogador => Boolean(j));
      const times = sortearTimes(presentes, prev.numTimes);
      return { ...prev, times, placarAjuste: [0, 0] };
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

  const handleChangePlacar = (novoPlacar: [number, number]) => {
    setDraft((prev) => {
      if (!prev) return prev;
      // Guarda a diferença entre o valor digitado e a soma atual dos gols
      // como ajuste — assim, quando um gol normal for marcado depois, ele
      // soma em cima do valor editado, em vez de ser sobrescrito por ele.
      const ajuste: [number, number] = [
        novoPlacar[0] - placarBase[0],
        novoPlacar[1] - placarBase[1],
      ];
      return { ...prev, placarAjuste: ajuste };
    });
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
        draft.numTimes === 2 ? placarExibido : null;

      await submitMatch(pin, draft.data, draft.numTimes, placarFinal, payload);

      setResumo(
        calcularResumoPelada(jogadoresPresentes, draft.numTimes, placarFinal)
      );
      limparDraft(draft.data);
      setDraft(criarDraftVazio(draft.data));
      await recarregarJogadores();
      onDadosAtualizados();
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

  const handleRosterChanged = () => {
    recarregarJogadores();
    onDadosAtualizados();
  };

  return (
    <div>
      {erroCarregamento && (
        <p role="alert" className="mb-4 text-sm text-red-300">
          {erroCarregamento}{" "}
          <button type="button" onClick={recarregarJogadores} className="underline">
            Tentar novamente
          </button>
        </p>
      )}

      <div className="mb-6">
        <label htmlFor="data-pelada" className="block text-sm font-medium text-white/80">
          Data da pelada
        </label>
        <input
          id="data-pelada"
          type="date"
          value={draft.data}
          onChange={(e) => handleChangeData(e.target.value)}
          className="mt-1 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white [color-scheme:dark]"
        />
      </div>

      <div className="mb-6">
        <PlayerRoster
          jogadores={jogadores}
          pin={pin}
          onChanged={handleRosterChanged}
          onAuthError={onAuthError}
        />
      </div>

      {carregandoJogadores ? (
        <p className="mb-6 text-sm text-white/60">Carregando jogadores...</p>
      ) : (
        <div className="mb-6">
          <AttendanceList
            jogadores={jogadores}
            presentesIds={draft.presentesIds}
            onToggle={toggleAttendance}
          />
        </div>
      )}

      <section className="mb-6">
        <h3 className="mb-2 text-sm font-semibold text-white/80">
          Presentes ({jogadoresPresentes.length})
        </h3>
        <PresentPlayers
          jogadores={jogadoresPresentes}
          onChangeStat={handleChangeStat}
        />
      </section>

      <section className="mb-6">
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
        <section className="mb-6">
          <Scoreboard placar={placarExibido} onChange={handleChangePlacar} />
        </section>
      )}

      <section className="flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
        {erroEnvio && (
          <p role="alert" className="text-sm text-red-300">
            {erroEnvio}
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
          className="w-full max-w-xs rounded-md bg-[#2F4FE0] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[#2643C8] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {enviandoResultado ? "Enviando..." : "Finalizar pelada"}
        </button>
      </section>

      {resumo && (
        <ResumoPeladaModal resumo={resumo} onClose={() => setResumo(null)} />
      )}
    </div>
  );
}

export function FutebolApp() {
  const [rankingKey, setRankingKey] = useState(0);

  useEffect(() => {
    document.documentElement.lang = "pt";
  }, []);

  const recarregarRanking = useCallback(() => {
    setRankingKey((k) => k + 1);
  }, []);

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background:
          "linear-gradient(135deg, #0A1240 0%, #12225E 45%, #1E3FBE 100%)",
      }}
    >
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <svg
          className="absolute left-0 top-0"
          style={{ width: "65vmin", height: "65vmin", filter: "blur(2.5px)" }}
          viewBox="0 0 200 200"
          preserveAspectRatio="xMidYMid meet"
        >
          <circle className="futebol-wave-ring" cx="0" cy="0" r="35" style={{ strokeWidth: 1.5, opacity: 0.18 }} />
          <circle className="futebol-wave-ring" cx="0" cy="0" r="65" style={{ strokeWidth: 1.5, opacity: 0.14 }} />
          <circle className="futebol-wave-ring" cx="0" cy="0" r="95" style={{ strokeWidth: 1.5, opacity: 0.1 }} />
          <circle className="futebol-wave-ring" cx="0" cy="0" r="125" style={{ strokeWidth: 1.5, opacity: 0.07 }} />
          <circle className="futebol-wave-ring" cx="0" cy="0" r="155" style={{ strokeWidth: 1.5, opacity: 0.05 }} />
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <header>
          <h1 className="text-5xl font-black uppercase leading-none tracking-tight sm:text-6xl">
            Futebol
          </h1>
          <p className="mt-2 text-lg font-semibold text-white/90">
            da Igreja Onda BH
          </p>
        </header>

        <section className="mt-8">
          <RankingSection refreshKey={rankingKey} />
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/50">
            Área da organização
          </h2>
          <PinGate>
            {(pin, onAuthError) => (
              <FutebolContent
                pin={pin}
                onAuthError={onAuthError}
                onDadosAtualizados={recarregarRanking}
              />
            )}
          </PinGate>
        </section>

        <footer className="mt-12 flex flex-col items-center gap-1 pb-4 text-center">
          <Wordmark className="text-base text-white" />
        </footer>
      </div>
    </div>
  );
}
