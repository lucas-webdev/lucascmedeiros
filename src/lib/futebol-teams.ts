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
