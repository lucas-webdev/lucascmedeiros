"use client";

import { useId } from "react";
import type { JogadorPresente } from "@/lib/futebol-types";
import { visualDoTime } from "@/lib/futebol-teams";
import { VestIcon } from "./vest-icon";

interface TeamDrawProps {
  presentesCount: number;
  numTimes: number;
  onChangeNumTimes: (n: number) => void;
  onSortear: () => void;
  onMoverJogador: (id: number, direcao: "anterior" | "proximo") => void;
  times: Record<number, number[]>;
  jogadoresPorId: Map<number, JogadorPresente>;
}

export function TeamDraw({
  presentesCount,
  numTimes,
  onChangeNumTimes,
  onSortear,
  onMoverJogador,
  times,
  jogadoresPorId,
}: TeamDrawProps) {
  const inputId = useId();
  const chavesTime = Object.keys(times)
    .map(Number)
    .sort((a, b) => a - b);
  const temTimes = chavesTime.length > 0;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor={inputId} className="block text-sm font-medium text-white/80">
            Número de times
          </label>
          <input
            id={inputId}
            type="number"
            min={2}
            max={8}
            value={numTimes}
            onChange={(e) =>
              onChangeNumTimes(
                Math.max(2, Math.min(8, Number(e.target.value) || 2))
              )
            }
            className="mt-1 w-24 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white"
          />
        </div>
        <button
          type="button"
          onClick={onSortear}
          disabled={presentesCount < numTimes}
          className="rounded-md bg-[#2F4FE0] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2643C8] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {temTimes ? "Sortear novamente" : "Sortear times"}
        </button>
      </div>

      {presentesCount < numTimes && (
        <p className="mt-2 text-sm text-white/60">
          É preciso pelo menos {numTimes} jogadores confirmados para sortear{" "}
          {numTimes} times.
        </p>
      )}

      {temTimes && (
        <>
          <p className="mt-3 text-xs text-white/50">
            Use as setas pra trocar alguém de time, se precisar ajustar o
            sorteio manualmente.
          </p>
          <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {chavesTime.map((time, indice) => {
              const ids = times[time];
              const visual = visualDoTime(time);
              return (
                <div
                  key={time}
                  className="rounded-md border border-white/10 bg-white/5 p-3"
                >
                  <h3
                    className={`flex items-center gap-1.5 text-sm font-semibold ${visual.corTexto}`}
                  >
                    <VestIcon className="h-4 w-4 shrink-0" />
                    {visual.nome}
                  </h3>
                  <ul className="mt-2 space-y-1 text-sm text-white">
                    {ids.map((id) => {
                      const jogador = jogadoresPorId.get(id);
                      const nome = jogador?.nome ?? String(id);
                      return (
                        <li
                          key={id}
                          className="flex items-center justify-between gap-2"
                        >
                          <span className="flex items-center gap-1.5">
                            {nome}
                            {jogador?.mensalista && (
                              <span
                                aria-label="Mensalista"
                                title="Mensalista"
                                className="text-amber-400"
                              >
                                ★
                              </span>
                            )}
                          </span>
                          <span className="flex shrink-0 gap-0.5">
                            <button
                              type="button"
                              aria-label={`Mover ${nome} para o time anterior`}
                              disabled={indice === 0}
                              onClick={() => onMoverJogador(id, "anterior")}
                              className="flex h-8 w-8 items-center justify-center rounded text-sm leading-none text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
                            >
                              <span aria-hidden="true">▲</span>
                            </button>
                            <button
                              type="button"
                              aria-label={`Mover ${nome} para o próximo time`}
                              disabled={indice === chavesTime.length - 1}
                              onClick={() => onMoverJogador(id, "proximo")}
                              className="flex h-8 w-8 items-center justify-center rounded text-sm leading-none text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
                            >
                              <span aria-hidden="true">▼</span>
                            </button>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
