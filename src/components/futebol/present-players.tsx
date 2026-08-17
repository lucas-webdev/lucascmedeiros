"use client";

import { cn } from "@/lib/utils";
import type { JogadorPresente } from "@/lib/futebol-types";
import { Stepper } from "./stepper";

interface PresentPlayersProps {
  jogadores: JogadorPresente[];
  onChangeStat: (
    id: number,
    campo: "gols" | "assistencias",
    valor: number
  ) => void;
}

const CORES_TIME: Record<number, string> = {
  1: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  2: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  3: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  4: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  5: "bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300",
  6: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300",
};

export function PresentPlayers({ jogadores, onChangeStat }: PresentPlayersProps) {
  if (jogadores.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted">
        Nenhum jogador confirmado ainda.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
            <th scope="col" className="px-4 py-3">
              Jogador
            </th>
            <th scope="col" className="px-4 py-3">
              Time
            </th>
            <th scope="col" className="px-4 py-3">
              Gols
            </th>
            <th scope="col" className="px-4 py-3">
              Assistências
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {jogadores.map((jogador) => (
            <tr key={jogador.id}>
              <td className="px-4 py-3">
                <span className="flex items-center gap-1.5">
                  {jogador.nome}
                  {jogador.mensalista && (
                    <span
                      aria-label="Mensalista"
                      title="Mensalista"
                      className="text-accent"
                    >
                      ★
                    </span>
                  )}
                </span>
              </td>
              <td className="px-4 py-3">
                {jogador.timeNumero ? (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      CORES_TIME[jogador.timeNumero] ??
                        "bg-muted text-foreground"
                    )}
                  >
                    Time {jogador.timeNumero}
                  </span>
                ) : (
                  <span className="text-xs text-muted">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <Stepper
                  label={`gols de ${jogador.nome}`}
                  value={jogador.gols}
                  onChange={(valor) => onChangeStat(jogador.id, "gols", valor)}
                />
              </td>
              <td className="px-4 py-3">
                <Stepper
                  label={`assistências de ${jogador.nome}`}
                  value={jogador.assistencias}
                  onChange={(valor) =>
                    onChangeStat(jogador.id, "assistencias", valor)
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
