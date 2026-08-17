"use client";

import { useId } from "react";
import type { JogadorPresente } from "@/lib/futebol-types";

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
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor={inputId} className="block text-sm font-medium">
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
            className="mt-1 w-24 rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={onSortear}
          disabled={presentesCount < numTimes}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {temTimes ? "Sortear novamente" : "Sortear times"}
        </button>
      </div>

      {presentesCount < numTimes && (
        <p className="mt-2 text-sm text-muted">
          É preciso pelo menos {numTimes} jogadores confirmados para sortear{" "}
          {numTimes} times.
        </p>
      )}

      {temTimes && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(times).map(([time, ids]) => (
            <div key={time} className="rounded-md border border-border p-3">
              <h3 className="text-sm font-semibold text-accent">
                Time {time}
              </h3>
              <ul className="mt-2 space-y-1 text-sm">
                {ids.map((id) => (
                  <li key={id}>{jogadoresPorId.get(id)?.nome ?? id}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
