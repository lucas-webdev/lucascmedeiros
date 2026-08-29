"use client";

import { cn } from "@/lib/utils";
import type { JogadorPresente } from "@/lib/futebol-types";
import { visualDoTime } from "@/lib/futebol-teams";
import { Stepper } from "./stepper";
import { VestIcon } from "./vest-icon";

interface PresentPlayersProps {
  jogadores: JogadorPresente[];
  onChangeStat: (
    id: number,
    campo: "gols" | "assistencias",
    valor: number
  ) => void;
  onToggleGoleiro: (id: number) => void;
}

/** Time Amarelo (2) primeiro, Time Azul (1) depois, demais times (3+) na sequência. */
function ordemTime(timeNumero: number | null): number {
  if (timeNumero === null) return -1;
  if (timeNumero === 2) return 0;
  if (timeNumero === 1) return 1;
  return timeNumero + 1;
}

export function PresentPlayers({
  jogadores,
  onChangeStat,
  onToggleGoleiro,
}: PresentPlayersProps) {
  if (jogadores.length === 0) {
    return (
      <p className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/60 backdrop-blur-sm">
        Nenhum jogador confirmado ainda.
      </p>
    );
  }

  const ordenados = [...jogadores].sort((a, b) => {
    const diffTime = ordemTime(a.timeNumero) - ordemTime(b.timeNumero);
    if (diffTime !== 0) return diffTime;
    return a.nome.localeCompare(b.nome, "pt-BR");
  });

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-white/50">
            <th scope="col" className="px-4 py-3">
              Jogador
            </th>
            <th scope="col" className="px-4 py-3">
              Goleiro
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
          {ordenados.map((jogador) => (
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
                <input
                  type="checkbox"
                  checked={jogador.goleiro}
                  onChange={() => onToggleGoleiro(jogador.id)}
                  aria-label={`${jogador.nome} joga de goleiro nessa pelada`}
                  className="h-5 w-5 rounded border-white/30 bg-white/10 accent-[#2F4FE0]"
                />
              </td>
              <td className="px-4 py-3">
                {jogador.timeNumero ? (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                      visualDoTime(jogador.timeNumero).corBadge
                    )}
                  >
                    <VestIcon className="h-3 w-3 shrink-0" />
                    {visualDoTime(jogador.timeNumero).nome}
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
