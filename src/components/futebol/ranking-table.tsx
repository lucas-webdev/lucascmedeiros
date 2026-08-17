import { cn } from "@/lib/utils";
import type { Jogador } from "@/lib/futebol-types";

interface RankingTableProps {
  jogadores: Jogador[];
}

export function RankingTable({ jogadores }: RankingTableProps) {
  const ordenados = [...jogadores].sort(
    (a, b) => b.pontos - a.pontos || b.jogos - a.jogos || b.gols - a.gols
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
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {ordenados.map((jogador, i) => (
            <tr
              key={jogador.id}
              className={cn(i === 0 && "bg-amber-400/10")}
            >
              <td className="px-4 py-3 text-white/50">{i + 1}</td>
              <td className="px-4 py-3">
                <span className="flex items-center gap-1.5">
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
              <td className="px-4 py-3 text-right font-semibold">
                {jogador.pontos}
              </td>
              <td className="px-4 py-3 text-right">{jogador.jogos}</td>
              <td className="px-4 py-3 text-right">{jogador.gols}</td>
              <td className="px-4 py-3 text-right">{jogador.assistencias}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
