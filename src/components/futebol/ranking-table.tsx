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

/**
 * "Overall" do jogador (0 a ~100): combina taxa de vitória (pontos por
 * jogo, peso maior) com participação em gols/assistências (peso menor).
 * Um fator de "maturidade" — que cresce com o número de jogos mas nunca
 * chega a 1 — limita o quanto desse desempenho já pode aparecer: com só
 * 1 jogo, o resultado fica sempre entre 50 e 60, não importa o quão bem
 * (ou mal) o jogador se saiu; conforme mais jogos acontecem, a faixa
 * acessível se abre, mas chegar perto de 100 exige muitos jogos E
 * desempenho consistente — não é algo que uma pelada isolada garante.
 */
function calcularOverall(jogador: Jogador): number {
  if (jogador.jogos <= 0) return 0;

  const pontosPorJogo = jogador.pontos / jogador.jogos;
  const participacaoPorJogo =
    (jogador.gols + jogador.assistencias) / jogador.jogos;
  const desempenho =
    0.7 * Math.min(1, pontosPorJogo / 3) + 0.3 * Math.min(1, participacaoPorJogo);
  const maturidade = jogador.jogos / (jogador.jogos + 4);

  return 50 + 50 * maturidade * desempenho;
}

export function RankingTable({ jogadores }: RankingTableProps) {
  const ordenados = [...jogadores].sort(
    (a, b) => b.pontos - a.pontos || calcularOverall(b) - calcularOverall(a)
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
              Overall
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
                  {Math.round(calcularOverall(jogador))}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
