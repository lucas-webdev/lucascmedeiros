"use client";

import { useMemo, useRef } from "react";
import { calcularMarcos } from "@/lib/jogos-marcos";
import type { Partida } from "@/lib/jogos-types";
import { CartaoPartida } from "./cartao-partida";

interface QuadroMarcosProps {
  /** Todas as partidas carregadas (o quadro ignora os filtros da página). */
  partidas: Partida[];
}

function textoFaltam(faltam: number): string {
  return faltam === 1
    ? "Falta 1 jogo diferente"
    : `Faltam ${faltam} jogos diferentes`;
}

export function QuadroMarcos({ partidas }: QuadroMarcosProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { jogosDiferentes, marcos } = useMemo(
    () => calcularMarcos(partidas),
    [partidas]
  );
  const alcancados = marcos.filter((m) => m.partida).length;

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="mt-4 flex w-full items-center justify-between gap-3 rounded-xl border border-d-line bg-d-card px-4 py-3 text-left"
      >
        <span>
          <span className="block text-base font-semibold">
            Marcos de jogos diferentes
          </span>
          <span className="block text-sm text-d-muted">
            {alcancados} de {marcos.length} marcos alcançados
          </span>
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="size-5 shrink-0 text-d-muted"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="m7.5 5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="quadro-marcos-titulo"
        // Clique no fundo (no próprio <dialog>, fora do conteúdo) fecha.
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current.close();
        }}
        className="m-auto max-h-[90dvh] w-[min(42rem,calc(100%-2rem))] overflow-y-auto rounded-2xl border border-d-line bg-d-bg p-0 text-d-fg backdrop:bg-black/60"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-d-line bg-d-bg px-4 py-3">
          <div className="min-w-0">
            <h2 id="quadro-marcos-titulo" className="text-lg font-semibold">
              Marcos de jogos diferentes
            </h2>
            <p className="text-sm text-d-muted">
              Você já jogou{" "}
              <strong className="font-semibold text-d-fg tabular-nums">
                {jogosDiferentes}
              </strong>{" "}
              jogos diferentes.
            </p>
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Fechar"
            className="-mr-1 shrink-0 rounded-lg p-2 text-d-muted"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="m5 5 10 10M15 5 5 15" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-4 py-4">
          <p className="text-xs text-d-muted">
            Cada marco mostra a primeira partida do jogo que fez a contagem
            chegar àquele número, considerando todas as partidas carregadas (os
            filtros da página não se aplicam). O BGG não guarda a hora da
            partida, então jogos que estrearam no mesmo dia são ordenados pelo
            registro no BGG.
          </p>

          <ol className="mt-4 space-y-4">
            {marcos.map((marco) => (
              <li key={marco.numero}>
                <p className="mb-2 text-sm font-semibold">
                  <span className="tabular-nums">{marco.numero}º</span> jogo
                  diferente
                </p>
                {marco.partida ? (
                  <>
                    <CartaoPartida partida={marco.partida} />
                    {marco.estreiasNoDia > 1 && (
                      <p className="mt-2 text-xs text-d-warn">
                        {marco.estreiasNoDia} jogos diferentes estrearam neste
                        dia. A ordem entre eles segue o registro no BGG e pode
                        não ser a real.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="rounded-xl border border-dashed border-d-line p-4 text-sm text-d-muted">
                    Ainda não alcançado. {textoFaltam(marco.faltam)}.
                  </p>
                )}
              </li>
            ))}
          </ol>
        </div>
      </dialog>
    </>
  );
}
