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
  placar: [number, number] | null;
}
