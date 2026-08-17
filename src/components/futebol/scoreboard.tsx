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
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <h3 className="text-center text-sm font-semibold text-white/80">Placar</h3>
      <div className="mt-3 flex items-center justify-center gap-4">
        <div className="text-center">
          <label htmlFor={id1} className="block text-xs text-white/60">
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
            className="mt-1 w-16 rounded-md border border-white/20 bg-white/10 px-2 py-2 text-center text-2xl font-bold tabular-nums text-white"
          />
        </div>
        <span aria-hidden="true" className="text-2xl font-bold text-white/50">
          ×
        </span>
        <div className="text-center">
          <label htmlFor={id2} className="block text-xs text-white/60">
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
            className="mt-1 w-16 rounded-md border border-white/20 bg-white/10 px-2 py-2 text-center text-2xl font-bold tabular-nums text-white"
          />
        </div>
      </div>
    </div>
  );
}
