import { cn } from "@/lib/utils";
import type { Jogador } from "@/lib/futebol-types";

interface RankingTableProps {
  jogadores: Jogador[];
}

const MEDALHA = ["🥇", "🥈", "🥉"];
const MEDALHA_LABEL = ["1º lugar", "2º lugar", "3º lugar"];
const DESTAQUE_LINHA = [
  "bg-amber-400/10 border-l-4 border-amber-400",
  "bg-slate-300/10 border-l-4 border-slate-300",
  "bg-orange-600/10 border-l-4 border-orange-500",
];
const DESTAQUE_PONTOS = ["text-amber-300", "text-slate-200", "text-orange-400"];

function aproveitamento(jogador: Jogador): number {
  return jogador.jogos > 0
    ? (jogador.gols + jogador.assistencias) / jogador.jogos
    : 0;
}

export function RankingTable({ jogadores }: RankingTableProps) {
  const ordenados = [...jogadores].sort(
    (a, b) => b.pontos - a.pontos || aproveitamento(b) - aproveitamento(a)
  );

  if (ordenados.length === 0) {
    return (
      <p className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/60 backdrop-blur-sm">
        Ainda não há estatísticas registradas.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-white/50">
            <th scope="col" className="px-4 py-3">
              #
            </th>
            <th scope="col" className="px-4 py-3">
              Jogador
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              Pontos
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              Jogos
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              Gols
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              Assist.
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              %
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {ordenados.map((jogador, i) => {
            const destaque = i < 3;
            return (
              <tr key={jogador.id} className={cn(destaque && DESTAQUE_LINHA[i])}>
                <td className="px-4 py-3 text-white/50">
                  {destaque ? (
                    <span aria-label={MEDALHA_LABEL[i]} title={MEDALHA_LABEL[i]}>
                      {MEDALHA[i]}
                    </span>
                  ) : (
                    i + 1
                  )}
                </td>
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
                <td
                  className={cn(
                    "px-4 py-3 text-right font-semibold",
                    destaque ? DESTAQUE_PONTOS[i] : "text-white"
                  )}
                >
                  {jogador.pontos}
                </td>
                <td className="px-4 py-3 text-right text-white">{jogador.jogos}</td>
                <td className="px-4 py-3 text-right text-white">{jogador.gols}</td>
                <td className="px-4 py-3 text-right text-white">
                  {jogador.assistencias}
                </td>
                <td className="px-4 py-3 text-right text-white/70">
                  {Math.round(aproveitamento(jogador) * 100)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
