"use client";

import { cn } from "@/lib/utils";
import type { JogadorPresente, PartidaHistorico } from "@/lib/futebol-types";
import { visualDoTime } from "@/lib/futebol-teams";
import { VestIcon } from "./vest-icon";
import { calcularResumoPelada } from "./resumo-pelada-modal";

interface HistoricoPartidaProps {
  historico: PartidaHistorico;
}

/** Time Amarelo (2) primeiro, Time Azul (1) depois, demais times (3+) na sequência. */
function ordemTime(timeNumero: number): number {
  if (timeNumero === 2) return 0;
  if (timeNumero === 1) return 1;
  return timeNumero + 1;
}

/**
 * Estatísticas de uma pelada já finalizada, só leitura — mostrado no lugar
 * do formulário de presença/sorteio quando a data escolhida já tem uma
 * partida registrada (tentar finalizar de novo seria bloqueado pelo
 * servidor mesmo, então nem faz sentido mostrar o formulário de novo).
 */
export function HistoricoPartida({ historico }: HistoricoPartidaProps) {
  const { numTimes, placar, jogadores } = historico;

  const ordenados = [...jogadores].sort((a, b) => {
    const diffTime = ordemTime(a.timeNumero) - ordemTime(b.timeNumero);
    if (diffTime !== 0) return diffTime;
    return a.nome.localeCompare(b.nome, "pt-BR");
  });

  const comoPresentes: JogadorPresente[] = jogadores.map((j) => ({
    id: j.id,
    nome: j.nome,
    mensalista: j.mensalista,
    timeNumero: j.timeNumero,
    gols: j.gols,
    assistencias: j.assistencias,
    goleiro: false,
  }));
  const resumo = calcularResumoPelada(comoPresentes, numTimes, placar);
  const empate = numTimes === 2 && placar !== null && placar[0] === placar[1];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/50">
          Essa pelada já foi finalizada
        </p>

        {placar && numTimes === 2 && (
          <div className="mb-4 text-center">
            <div className="flex items-center justify-center gap-4">
              <div>
                <p className="text-xs text-white/50">Colete Azul</p>
                <p className="text-3xl font-bold tabular-nums">{placar[0]}</p>
              </div>
              <span className="text-xl font-bold text-white/40">×</span>
              <div>
                <p className="text-xs text-white/50">Colete Amarelo</p>
                <p className="text-3xl font-bold tabular-nums">{placar[1]}</p>
              </div>
            </div>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-amber-300">
              {empate
                ? "Empate"
                : `Vitória do ${visualDoTime(placar[0] > placar[1] ? 1 : 2).nome}`}
            </p>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
              ⚽ Artilheiro
            </p>
            {resumo.artilheiros.length > 0 ? (
              <p className="mt-1 text-base font-bold leading-snug">
                {resumo.artilheiros.map((a) => a.nome).join(", ")}{" "}
                <span className="font-normal text-white/60">
                  ({resumo.artilheiros[0].gols}{" "}
                  {resumo.artilheiros[0].gols === 1 ? "gol" : "gols"})
                </span>
              </p>
            ) : (
              <p className="mt-1 text-sm text-white/50">Ninguém marcou</p>
            )}
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
              🎯 Garçom
            </p>
            {resumo.garcons.length > 0 ? (
              <p className="mt-1 text-base font-bold leading-snug">
                {resumo.garcons.map((g) => g.nome).join(", ")}{" "}
                <span className="font-normal text-white/60">
                  ({resumo.garcons[0].assistencias}{" "}
                  {resumo.garcons[0].assistencias === 1
                    ? "assistência"
                    : "assistências"}
                  )
                </span>
              </p>
            ) : (
              <p className="mt-1 text-sm text-white/50">Ninguém deu assistência</p>
            )}
          </div>
        </div>
      </div>

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
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                      visualDoTime(jogador.timeNumero).corBadge
                    )}
                  >
                    <VestIcon className="h-3 w-3 shrink-0" />
                    {visualDoTime(jogador.timeNumero).nome}
                  </span>
                </td>
                <td className="px-4 py-3 tabular-nums">{jogador.gols}</td>
                <td className="px-4 py-3 tabular-nums">{jogador.assistencias}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
