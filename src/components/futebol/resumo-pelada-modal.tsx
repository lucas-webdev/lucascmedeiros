"use client";

import { useEffect, useRef } from "react";
import type { JogadorPresente } from "@/lib/futebol-types";
import { visualDoTime } from "@/lib/futebol-teams";

export interface ResumoPeladaData {
  placar: [number, number] | null;
  numTimes: number;
  artilheiros: { nome: string; gols: number }[];
  garcons: { nome: string; assistencias: number }[];
  destaques: { nome: string; timeNumero: number | null }[];
}

/** Gols valem mais que assistências pra decidir o "melhor jogador" da pelada. */
function pontuacaoDestaque(jogador: JogadorPresente): number {
  return jogador.gols * 2 + jogador.assistencias;
}

/**
 * Resumo calculado só com os dados dessa pelada específica (nunca a
 * tabela geral/acumulada). Destaques: com 2 times e um vencedor claro,
 * os 2 melhores do time vencedor + o melhor do time perdedor; em caso de
 * empate (ou sorteio com mais de 2 times, onde não há um "vencedor"
 * único), os 3 melhores no geral.
 */
export function calcularResumoPelada(
  jogadoresPresentes: JogadorPresente[],
  numTimes: number,
  placar: [number, number] | null
): ResumoPeladaData {
  const comTime = jogadoresPresentes.filter((j) => j.timeNumero !== null);

  const maxGols = Math.max(0, ...comTime.map((j) => j.gols));
  const artilheiros =
    maxGols > 0
      ? comTime
          .filter((j) => j.gols === maxGols)
          .map((j) => ({ nome: j.nome, gols: j.gols }))
      : [];

  const maxAssist = Math.max(0, ...comTime.map((j) => j.assistencias));
  const garcons =
    maxAssist > 0
      ? comTime
          .filter((j) => j.assistencias === maxAssist)
          .map((j) => ({ nome: j.nome, assistencias: j.assistencias }))
      : [];

  const melhoresGerais = () =>
    [...comTime]
      .sort((a, b) => pontuacaoDestaque(b) - pontuacaoDestaque(a))
      .slice(0, 3)
      .map((j) => ({ nome: j.nome, timeNumero: j.timeNumero }));

  let destaques: { nome: string; timeNumero: number | null }[];

  if (numTimes === 2 && placar && placar[0] !== placar[1]) {
    const timeVencedor = placar[0] > placar[1] ? 1 : 2;
    const timePerdedor = timeVencedor === 1 ? 2 : 1;
    const doVencedor = comTime
      .filter((j) => j.timeNumero === timeVencedor)
      .sort((a, b) => pontuacaoDestaque(b) - pontuacaoDestaque(a))
      .slice(0, 2);
    const doPerdedor = comTime
      .filter((j) => j.timeNumero === timePerdedor)
      .sort((a, b) => pontuacaoDestaque(b) - pontuacaoDestaque(a))
      .slice(0, 1);
    destaques = [...doVencedor, ...doPerdedor].map((j) => ({
      nome: j.nome,
      timeNumero: j.timeNumero,
    }));
  } else {
    destaques = melhoresGerais();
  }

  return { placar, numTimes, artilheiros, garcons, destaques };
}

interface ResumoPeladaModalProps {
  resumo: ResumoPeladaData;
  onClose: () => void;
}

export function ResumoPeladaModal({ resumo, onClose }: ResumoPeladaModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focaveis = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, [tabindex]:not([tabindex="-1"])'
      );
      if (focaveis.length === 0) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const empate =
    resumo.numTimes === 2 &&
    resumo.placar !== null &&
    resumo.placar[0] === resumo.placar[1];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="resumo-pelada-titulo"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-[#12225E] p-6 text-white shadow-2xl [color-scheme:dark]"
      >
        <div className="flex items-start justify-between gap-3">
          <h2
            id="resumo-pelada-titulo"
            className="text-2xl font-black uppercase leading-none tracking-tight"
          >
            Partida finalizada!
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="shrink-0 rounded-md p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        {resumo.placar && resumo.numTimes === 2 && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-center">
            <div className="flex items-center justify-center gap-4">
              <div>
                <p className="text-xs text-white/50">Time Azul</p>
                <p className="text-3xl font-bold tabular-nums">{resumo.placar[0]}</p>
              </div>
              <span className="text-xl font-bold text-white/40">×</span>
              <div>
                <p className="text-xs text-white/50">Time Amarelo</p>
                <p className="text-3xl font-bold tabular-nums">{resumo.placar[1]}</p>
              </div>
            </div>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-amber-300">
              {empate
                ? "Empate"
                : `Vitória do ${visualDoTime(resumo.placar[0] > resumo.placar[1] ? 1 : 2).nome}`}
            </p>
          </div>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
              ⚽ Artilheiro
            </p>
            {resumo.artilheiros.length > 0 ? (
              <p className="mt-1 text-base font-bold leading-snug">
                {resumo.artilheiros.map((a) => a.nome).join(", ")}{" "}
                <span className="font-normal text-white/60">
                  ({resumo.artilheiros[0].gols}{" "}
                  {resumo.artilheiros[0].gols === 1 ? "gol" : "gols"})
                </span>
              </p>
            ) : (
              <p className="mt-1 text-sm text-white/50">Ninguém marcou</p>
            )}
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
              🎯 Garçom
            </p>
            {resumo.garcons.length > 0 ? (
              <p className="mt-1 text-base font-bold leading-snug">
                {resumo.garcons.map((g) => g.nome).join(", ")}{" "}
                <span className="font-normal text-white/60">
                  ({resumo.garcons[0].assistencias}{" "}
                  {resumo.garcons[0].assistencias === 1
                    ? "assistência"
                    : "assistências"}
                  )
                </span>
              </p>
            ) : (
              <p className="mt-1 text-sm text-white/50">Ninguém deu assistência</p>
            )}
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
            Destaques do dia
          </p>
          {resumo.destaques.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {resumo.destaques.map((d, i) => {
                const visual =
                  d.timeNumero !== null ? visualDoTime(d.timeNumero) : null;
                return (
                  <li key={`${d.nome}-${i}`} className="flex items-center gap-2 text-sm">
                    <span aria-hidden="true" className="text-amber-400">
                      ★
                    </span>
                    <span className="font-medium">{d.nome}</span>
                    {visual && (
                      <span className={`text-xs ${visual.corTexto}`}>
                        {visual.nome}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-white/50">Sem dados suficientes.</p>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-md bg-[#2F4FE0] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2643C8]"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
