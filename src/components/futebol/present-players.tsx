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

  // Uma "linha" por jogador em duas camadas (nome/time/GK em cima, gols e
  // assistências embaixo) em vez de <table>: no celular uma tabela larga
  // forçava scroll horizontal e escondia colunas; assim só rola na vertical.
  return (
    <ul className="divide-y divide-white/10 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
      {ordenados.map((jogador, indice) => {
        const visual = jogador.timeNumero
          ? visualDoTime(jogador.timeNumero)
          : null;
        const comecaNovoTime =
          indice > 0 && ordenados[indice - 1].timeNumero !== jogador.timeNumero;
        return (
          <li
            key={jogador.id}
            className={cn(
              "px-4 py-3",
              comecaNovoTime && "border-t-4 border-white/30"
            )}
          >
            <div className="flex items-center gap-2">
              {visual && (
                <span
                  role="img"
                  aria-label={visual.nome}
                  title={visual.nome}
                  className={cn("shrink-0", visual.corTexto)}
                >
                  <VestIcon className="h-5 w-5" />
                </span>
              )}
              <span className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-white">
                <span className="truncate">{jogador.nome}</span>
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
              <label className="ml-auto flex shrink-0 cursor-pointer items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/70">
                <input
                  type="checkbox"
                  checked={jogador.goleiro}
                  onChange={() => onToggleGoleiro(jogador.id)}
                  aria-label={`${jogador.nome} joga de goleiro nessa pelada`}
                  className="h-5 w-5 rounded border-white/30 bg-white/10 accent-[#2F4FE0]"
                />
                GK
              </label>
            </div>

            <div className="mt-2 grid grid-cols-2">
              <div className="flex justify-start">
                <div>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-white/50">
                    Gols
                  </p>
                  <Stepper
                    label={`gols de ${jogador.nome}`}
                    value={jogador.gols}
                    onChange={(valor) =>
                      onChangeStat(jogador.id, "gols", valor)
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end border-l border-white/20">
                <div>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-white/50">
                    Assistências
                  </p>
                  <Stepper
                    label={`assistências de ${jogador.nome}`}
                    value={jogador.assistencias}
                    onChange={(valor) =>
                      onChangeStat(jogador.id, "assistencias", valor)
                    }
                  />
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
