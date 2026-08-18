function embaralhar<T>(itens: T[]): T[] {
  const resultado = [...itens];
  for (let i = resultado.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [resultado[i], resultado[j]] = [resultado[j], resultado[i]];
  }
  return resultado;
}

export interface JogadorParaSorteio {
  id: number;
  pontos: number;
  jogos: number;
  gols: number;
  assistencias: number;
}

/**
 * Nota de cada jogador = pontos por jogo + aproveitamento (gols+assistências
 * por jogo). Pontos por jogo em vez do total bruto — senão alguém "mediano"
 * que já jogou muitas peladas acumula mais pontos que alguém bom que jogou
 * pouco, o que distorceria o equilíbrio. Sem jogos ainda = nota neutra (0).
 */
function calcularNotas(jogadores: JogadorParaSorteio[]): Map<number, number> {
  const notas = new Map<number, number>();
  for (const j of jogadores) {
    const nota =
      j.jogos > 0 ? j.pontos / j.jogos + (j.gols + j.assistencias) / j.jogos : 0;
    notas.set(j.id, nota);
  }
  return notas;
}

/**
 * Sorteia os times equilibrando pela nota de cada jogador presente (pontos +
 * aproveitamento). Em vez de um "zigue-zague" fixo por posição no ranking
 * (que sempre repetiria a mesma divisão entre as mesmas pessoas, semana após
 * semana), agrupa jogadores de nível parecido em blocos do tamanho do número
 * de times — 1º e 2º colocados do dia formam um bloco, 3º e 4º outro, e
 * assim por diante — e dentro de cada bloco sorteia aleatoriamente quem vai
 * para qual time. Isso garante que os melhores de cada bloco nunca fiquem
 * juntos (mantém o equilíbrio), mas a distribuição em si varia a cada
 * sorteio, mesmo com o mesmo grupo de presentes.
 */
export function sortearTimes(
  jogadores: JogadorParaSorteio[],
  numTimes: number
): Record<number, number[]> {
  const notas = calcularNotas(jogadores);
  const ordenados = [...jogadores].sort(
    (a, b) => (notas.get(b.id) ?? 0) - (notas.get(a.id) ?? 0)
  );

  const times: Record<number, number[]> = {};
  for (let time = 1; time <= numTimes; time++) {
    times[time] = [];
  }

  for (let inicio = 0; inicio < ordenados.length; inicio += numTimes) {
    const bloco = ordenados.slice(inicio, inicio + numTimes);
    const timesDoBloco = embaralhar(
      Array.from({ length: numTimes }, (_, i) => i + 1)
    );
    bloco.forEach((jogador, i) => {
      times[timesDoBloco[i]].push(jogador.id);
    });
  }

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
