export interface Jogador {
  id: number;
  nome: string;
  mensalista: boolean;
  pontos: number;
  jogos: number;
  gols: number;
  assistencias: number;
}

export interface JogadorPresente {
  id: number;
  nome: string;
  mensalista: boolean;
  timeNumero: number | null;
  gols: number;
  assistencias: number;
}

export interface PeladaDraft {
  data: string;
  presentesIds: number[];
  numTimes: number;
  times: Record<number, number[]>;
  estatisticas: Record<number, { gols: number; assistencias: number }>;
  /**
   * Ajuste manual do placar (ex.: gol contra, que não pertence a nenhum
   * jogador). O placar exibido é sempre soma dos gols marcados por time +
   * esse ajuste — editar o placar só muda o ajuste, nunca sobrescreve os
   * gols dos jogadores.
   */
  placarAjuste: [number, number];
}
