import type { Partida } from "./jogos-types";

/**
 * Quantidades de jogos diferentes que viram um "marco" no quadro. Marcos que
 * ainda não foram alcançados aparecem como pendentes e se preenchem sozinhos
 * quando as partidas novas chegam ao BGG; basta editar esta lista para
 * acompanhar outros números.
 */
export const MARCOS_JOGOS_DIFERENTES: readonly number[] = [
  100, 300, 500, 900, 999, 1000, 1200, 1500, 1999, 2000,
];

export interface Marco {
  /** Quantidade de jogos diferentes (ex.: 100 = o 100º jogo diferente). */
  numero: number;
  /**
   * Primeira partida do jogo que fez a contagem chegar a `numero`, ou `null`
   * se ainda não foi alcançado.
   */
  partida: Partida | null;
  /** Quantos jogos diferentes faltam para alcançar o marco (0 se já alcançado). */
  faltam: number;
  /**
   * Quantos jogos estrearam no mesmo dia da partida do marco (incluindo ele).
   * Acima de 1, a ordem entre eles é só aproximada (ver `comparar`); 0 se o
   * marco ainda não foi alcançado.
   */
  estreiasNoDia: number;
}

export interface ResultadoMarcos {
  /** Total de jogos diferentes nas partidas recebidas. */
  jogosDiferentes: number;
  /** Na ordem crescente de `numero`, sem repetições. */
  marcos: Marco[];
}

/**
 * Ordem cronológica: data e, no mesmo dia, o id do registro no BGG. O BGG não
 * guarda a hora da partida e o id reflete a ordem em que o registro foi criado
 * (que, com importações como a do BG Stats, nem sempre é a ordem em que se
 * jogou), então o desempate dentro do dia é aproximado — `estreiasNoDia`
 * avisa quando isso importa. Partidas sem data vão para o fim, para não
 * distorcerem a ordem das que têm.
 */
function comparar(a: Partida, b: Partida): number {
  if (a.date !== b.date) {
    if (a.date === "") return 1;
    if (b.date === "") return -1;
    return a.date < b.date ? -1 : 1;
  }
  return a.id - b.id;
}

/**
 * O N-ésimo jogo diferente é aquele cuja PRIMEIRA partida é a N-ésima em
 * ordem cronológica entre as primeiras partidas de cada jogo. O marco N é
 * essa primeira partida. Considera sempre todas as partidas recebidas.
 */
export function calcularMarcos(
  partidas: Partida[],
  numeros: readonly number[] = MARCOS_JOGOS_DIFERENTES
): ResultadoMarcos {
  const primeiraDeCada = new Map<number, Partida>();
  for (const partida of partidas) {
    const atual = primeiraDeCada.get(partida.game.id);
    if (!atual || comparar(partida, atual) < 0) {
      primeiraDeCada.set(partida.game.id, partida);
    }
  }

  const ordenadas = [...primeiraDeCada.values()].sort(comparar);
  const jogosDiferentes = ordenadas.length;

  const estreiasPorDia = new Map<string, number>();
  for (const { date } of ordenadas) {
    estreiasPorDia.set(date, (estreiasPorDia.get(date) ?? 0) + 1);
  }

  const marcos = [...new Set(numeros)]
    .filter((n) => Number.isInteger(n) && n > 0)
    .sort((a, b) => a - b)
    .map((numero): Marco => {
      const partida = ordenadas[numero - 1] ?? null;
      return {
        numero,
        partida,
        faltam: Math.max(0, numero - jogosDiferentes),
        estreiasNoDia: partida ? (estreiasPorDia.get(partida.date) ?? 1) : 0,
      };
    });

  return { jogosDiferentes, marcos };
}
