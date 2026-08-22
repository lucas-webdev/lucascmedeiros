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
  times: Record<number, number[]>;
  jogadoresPorId: Map<number, JogadorPresente>;
}

export function TeamDraw({
  presentesCount,
  numTimes,
  onChangeNumTimes,
  onSortear,
  times,
  jogadoresPorId,
}: TeamDrawProps) {
  const inputId = useId();
  const temTimes = Object.keys(times).length > 0;

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
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(times).map(([time, ids]) => {
            const visual = visualDoTime(Number(time));
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
                    return (
                      <li key={id} className="flex items-center gap-1.5">
                        {jogador?.nome ?? id}
                        {jogador?.mensalista && (
                          <span
                            aria-label="Mensalista"
                            title="Mensalista"
                            className="text-amber-400"
                          >
                            ★
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
