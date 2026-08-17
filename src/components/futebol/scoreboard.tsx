"use client";

import { useId } from "react";

interface ScoreboardProps {
  placar: [number, number];
  onChange: (placar: [number, number]) => void;
}

export function Scoreboard({ placar, onChange }: ScoreboardProps) {
  const id1 = useId();
  const id2 = useId();

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-center text-sm font-semibold">Placar</h3>
      <div className="mt-3 flex items-center justify-center gap-4">
        <div className="text-center">
          <label htmlFor={id1} className="block text-xs text-muted">
            Time 1
          </label>
          <input
            id={id1}
            type="number"
            min={0}
            value={placar[0]}
            onChange={(e) =>
              onChange([Math.max(0, Number(e.target.value) || 0), placar[1]])
            }
            className="mt-1 w-16 rounded-md border border-border bg-background px-2 py-2 text-center text-2xl font-bold tabular-nums"
          />
        </div>
        <span aria-hidden="true" className="text-2xl font-bold text-muted">
          ×
        </span>
        <div className="text-center">
          <label htmlFor={id2} className="block text-xs text-muted">
            Time 2
          </label>
          <input
            id={id2}
            type="number"
            min={0}
            value={placar[1]}
            onChange={(e) =>
              onChange([placar[0], Math.max(0, Number(e.target.value) || 0)])
            }
            className="mt-1 w-16 rounded-md border border-border bg-background px-2 py-2 text-center text-2xl font-bold tabular-nums"
          />
        </div>
      </div>
    </div>
  );
}
