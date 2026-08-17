function embaralhar<T>(itens: T[]): T[] {
  const resultado = [...itens];
  for (let i = resultado.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [resultado[i], resultado[j]] = [resultado[j], resultado[i]];
  }
  return resultado;
}

/**
 * Distribui jogadores em `numTimes` times o mais equilibrado possível
 * (diferença máxima de 1 jogador entre times, já que não há dado de nível
 * de habilidade para balancear por força).
 */
export function sortearTimes(
  jogadorIds: number[],
  numTimes: number
): Record<number, number[]> {
  const embaralhados = embaralhar(jogadorIds);
  const times: Record<number, number[]> = {};

  for (let time = 1; time <= numTimes; time++) {
    times[time] = [];
  }

  embaralhados.forEach((id, index) => {
    const time = (index % numTimes) + 1;
    times[time].push(id);
  });

  return times;
}

export interface VisualTime {
  nome: string;
  /** cor de texto simples, para títulos sobre o fundo azul-marinho */
  corTexto: string;
  /** classes de fundo+texto, para badges/pills sólidos */
  corBadge: string;
}

/**
 * Os coletes físicos da pelada são azul e amarelo — times 1 e 2 usam esse
 * nome. A partir do 3º time (sorteios com mais de 2 times) não há colete
 * correspondente, então cai para "Time N" com uma cor genérica.
 */
const VISUAL_TIME: Record<number, VisualTime> = {
  1: { nome: "Colete Azul", corTexto: "text-blue-400", corBadge: "bg-blue-500 text-white" },
  2: {
    nome: "Colete Amarelo",
    corTexto: "text-amber-300",
    corBadge: "bg-amber-400 text-slate-900",
  },
  3: { nome: "Time 3", corTexto: "text-purple-400", corBadge: "bg-purple-500 text-white" },
  4: { nome: "Time 4", corTexto: "text-pink-400", corBadge: "bg-pink-500 text-white" },
  5: { nome: "Time 5", corTexto: "text-emerald-400", corBadge: "bg-emerald-500 text-white" },
  6: { nome: "Time 6", corTexto: "text-cyan-400", corBadge: "bg-cyan-500 text-white" },
};

export function visualDoTime(numero: number): VisualTime {
  return (
    VISUAL_TIME[numero] ?? {
      nome: `Time ${numero}`,
      corTexto: "text-white",
      corBadge: "bg-white/20 text-white",
    }
  );
}
