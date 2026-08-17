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
  1: "bg-blue-500 text-white",
  2: "bg-emerald-500 text-white",
  3: "bg-amber-500 text-white",
  4: "bg-purple-500 text-white",
  5: "bg-pink-500 text-white",
  6: "bg-cyan-500 text-white",
};

export function PresentPlayers({ jogadores, onChangeStat }: PresentPlayersProps) {
  if (jogadores.length === 0) {
    return (
      <p className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/60 backdrop-blur-sm">
        Nenhum jogador confirmado ainda.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-white/50">
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
        <tbody className="divide-y divide-white/10">
          {jogadores.map((jogador) => (
            <tr key={jogador.id}>
              <td className="px-4 py-3">
                <span className="flex items-center gap-1.5 text-white">
                  {jogador.nome}
                  {jogador.mensalista && (
                    <span
                      aria-label="Mensalista"
                      title="Mensalista"
                      className="text-amber-400"
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
                        "bg-white/20 text-white"
                    )}
                  >
                    Time {jogador.timeNumero}
                  </span>
                ) : (
                  <span className="text-xs text-white/40">—</span>
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
